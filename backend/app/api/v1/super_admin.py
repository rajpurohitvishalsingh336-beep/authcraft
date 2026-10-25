import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
import pyotp
from sqlalchemy.orm import Session

from app.api.deps import get_client_ip
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.models.application_user import ApplicationUser
from app.models.auth_event import AuthenticationEvent
from app.models.developer import Developer
from app.models.developer_platform import ApiKey, WebhookEndpoint
from app.models.presentation import Presentation
from app.models.project import Project
from app.models.security_incident import SecurityIncident
from app.models.super_admin import SuperAdmin, SuperAdminAuditLog
from app.models.workflow import Workflow

logger = logging.getLogger("authcraft.super_admin")
router = APIRouter()


class SuperAdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None


class SuperAdminVerifyMFARequest(BaseModel):
    temp_token: str
    totp_code: str


class SuperAdminSetupMFARequest(BaseModel):
    totp_code: str


def get_current_super_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> SuperAdmin:
    """Dependency verifying that the caller is an authenticated Super Admin."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Super Admin authorization required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1].strip()
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Super Admin privileges required.")

    admin = db.query(SuperAdmin).filter(SuperAdmin.id == payload.get("sub"), SuperAdmin.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Super Admin account inactive or not found.")

    return admin


def log_super_admin_action(
    db: Session,
    admin_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
):
    """Record an unalterable audit trail record for super admin actions."""
    audit = SuperAdminAuditLog(
        super_admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details_json=json.dumps(details or {}),
        ip_address=ip_address,
    )
    db.add(audit)
    db.commit()


@router.post("/login", tags=["Private Super Admin Console"])
def super_admin_login(
    payload: SuperAdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate a Super Admin.
    Enforces mandatory RFC 6238 TOTP verification.
    If MFA is enabled and no valid totp_code is provided, returns mfa_required=True and a temporary token.
    """
    admin = db.query(SuperAdmin).filter(SuperAdmin.email == payload.email.lower().strip()).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator account is disabled.")

    # Check TOTP MFA
    if admin.is_mfa_enabled and admin.totp_secret:
        if not payload.totp_code:
            # Issue temporary 5-minute verification token
            temp_token = create_access_token(
                subject=admin.id,
                token_type="super_admin_mfa_pending",
                expires_delta=timedelta(minutes=5),
                extra_claims={"email": admin.email, "role": "super_admin_mfa_pending"},
            )
            return {
                "mfa_required": True,
                "temp_token": temp_token,
                "message": "Enter the 6-digit TOTP code from your authenticator app.",
            }

        # Verify TOTP code
        totp = pyotp.TOTP(admin.totp_secret)
        if not totp.verify(payload.totp_code.strip(), valid_window=1):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 6-digit TOTP code.")

    # Authentication successful
    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(
        subject=admin.id,
        token_type="super_admin",
        expires_delta=timedelta(hours=12),
        extra_claims={"email": admin.email, "role": "super_admin", "name": admin.full_name},
    )

    log_super_admin_action(
        db, admin.id, "login_success", "super_admin", admin.id,
        {"email": admin.email}, get_client_ip(request)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "mfa_required": False,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": admin.role,
            "is_mfa_enabled": admin.is_mfa_enabled,
        },
    }


@router.post("/mfa/verify", tags=["Private Super Admin Console"])
def verify_mfa_login(
    payload: SuperAdminVerifyMFARequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Complete 2-step TOTP login using temporary token."""
    decoded = decode_access_token(payload.temp_token)
    if not decoded or decoded.get("role") != "super_admin_mfa_pending":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired MFA session.")

    admin = db.query(SuperAdmin).filter(SuperAdmin.id == decoded.get("sub")).first()
    if not admin or not admin.totp_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Administrator not found.")

    totp = pyotp.TOTP(admin.totp_secret)
    if not totp.verify(payload.totp_code.strip(), valid_window=1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 6-digit TOTP code.")

    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(
        subject=admin.id,
        token_type="super_admin",
        expires_delta=timedelta(hours=12),
        extra_claims={"email": admin.email, "role": "super_admin", "name": admin.full_name},
    )

    log_super_admin_action(
        db, admin.id, "mfa_login_success", "super_admin", admin.id,
        {"email": admin.email}, get_client_ip(request)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": admin.role,
            "is_mfa_enabled": admin.is_mfa_enabled,
        },
    }


@router.post("/mfa/setup", tags=["Private Super Admin Console"])
def setup_mfa(
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Generate a new RFC 6238 Base32 TOTP secret and provisioning URI."""
    secret = pyotp.random_base32()
    current_admin.totp_secret = secret
    db.commit()

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_admin.email, issuer_name="AuthCraft Super Admin")

    return {
        "totp_secret": secret,
        "provisioning_uri": uri,
        "message": "Scan this URI with Google Authenticator or 1Password, then confirm with a 6-digit code.",
    }


@router.post("/mfa/activate", tags=["Private Super Admin Console"])
def activate_mfa(
    payload: SuperAdminSetupMFARequest,
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Confirm and activate TOTP MFA on the super admin account."""
    if not current_admin.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA setup has not been initiated.")

    totp = pyotp.TOTP(current_admin.totp_secret)
    if not totp.verify(payload.totp_code.strip(), valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")

    current_admin.is_mfa_enabled = True
    db.commit()

    return {"message": "TOTP MFA activated successfully.", "is_mfa_enabled": True}


@router.get("/overview", tags=["Private Super Admin Console"])
def super_admin_platform_overview(
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Platform-wide system health, tenant statistics, and operational telemetry."""
    total_developers = db.query(Developer).count()
    active_developers = db.query(Developer).filter(Developer.is_active == True).count()
    total_projects = db.query(Project).count()
    published_projects = db.query(Project).filter(Project.is_published == True).count()
    total_users = db.query(ApplicationUser).count()
    total_presentations = db.query(Presentation).count()
    total_workflows = db.query(Workflow).count()
    total_api_keys = db.query(ApiKey).count()
    total_webhooks = db.query(WebhookEndpoint).count()
    open_incidents = db.query(SecurityIncident).filter(SecurityIncident.status.in_(["open", "investigating"])).count()
    total_auth_events = db.query(AuthenticationEvent).count()

    return {
        "status": "nominal",
        "service_version": settings.VERSION,
        "tenants": {
            "total_developers": total_developers,
            "active_developers": active_developers,
        },
        "resources": {
            "total_projects": total_projects,
            "published_projects": published_projects,
            "total_end_users": total_users,
            "total_presentations": total_presentations,
            "total_workflows": total_workflows,
            "total_api_keys": total_api_keys,
            "total_webhooks": total_webhooks,
        },
        "security": {
            "open_incidents": open_incidents,
            "total_auth_events_recorded": total_auth_events,
        },
        "database": {
            "engine": "sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql",
            "connection": "healthy",
        },
    }


@router.get("/tenants", tags=["Private Super Admin Console"])
def list_tenants(
    limit: int = 50,
    offset: int = 0,
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """List developer tenants with project counts and activity status."""
    devs = db.query(Developer).order_by(Developer.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for d in devs:
        proj_count = db.query(Project).filter(Project.developer_id == d.id).count()
        user_count = (
            db.query(ApplicationUser)
            .join(Project, ApplicationUser.project_id == Project.id)
            .filter(Project.developer_id == d.id)
            .count()
        )
        results.append({
            "id": d.id,
            "email": d.email,
            "full_name": d.full_name,
            "is_active": d.is_active,
            "is_verified": d.is_verified,
            "project_count": proj_count,
            "end_user_count": user_count,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })

    return results


@router.post("/tenants/{developer_id}/toggle-status", tags=["Private Super Admin Console"])
def toggle_tenant_status(
    developer_id: str,
    request: Request,
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Suspend or reactivate a tenant developer account."""
    dev = db.query(Developer).filter(Developer.id == developer_id).first()
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")

    dev.is_active = not dev.is_active
    db.commit()

    log_super_admin_action(
        db, current_admin.id, "toggle_tenant_status", "developer", dev.id,
        {"email": dev.email, "new_active_status": dev.is_active}, get_client_ip(request)
    )

    return {"developer_id": dev.id, "is_active": dev.is_active, "message": f"Tenant status set to {'active' if dev.is_active else 'suspended'}."}


@router.get("/audit-logs", tags=["Private Super Admin Console"])
def list_super_admin_audit_logs(
    limit: int = 50,
    current_admin: SuperAdmin = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Query Super Admin audit trail."""
    logs = (
        db.query(SuperAdminAuditLog)
        .order_by(SuperAdminAuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "super_admin_id": l.super_admin_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]
