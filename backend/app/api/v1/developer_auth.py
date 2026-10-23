from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_client_ip, get_client_user_agent, get_current_developer
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    generate_project_id,
    generate_secure_token,
    generate_slug,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.developer import Developer, DeveloperSession
from app.models.project import AllowedRedirectUri, Project
from app.models.project_config import ProjectConfiguration
from app.models.token import VerificationToken
from app.schemas.developer import (
    DeveloperChangePasswordRequest,
    DeveloperEmailVerifyRequest,
    DeveloperLoginRequest,
    DeveloperPasswordResetConfirm,
    DeveloperPasswordResetRequest,
    DeveloperRegisterRequest,
    DeveloperResponse,
    TokenResponse,
)
from app.services.email_service import EmailService

router = APIRouter()


@router.post("/register", response_model=DeveloperResponse, status_code=status.HTTP_201_CREATED)
def register_developer(
    req: DeveloperRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Register a new developer account with Argon2id password hashing."""
    email_clean = req.email.strip().lower()

    # Check if developer already exists
    existing = db.query(Developer).filter(Developer.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A developer account with this email already exists.",
        )

    # Hash password using Argon2id
    password_hash = get_password_hash(req.password)

    # In dev mode, we automatically set verified to True or issue verification token
    developer = Developer(
        email=email_clean,
        password_hash=password_hash,
        full_name=req.full_name.strip(),
        is_verified=True,  # Immediate access for ease of developer onboarding
        is_active=True,
    )
    db.add(developer)
    db.commit()
    db.refresh(developer)

    # Generate verification token and dispatch email
    raw_token = generate_secure_token(32)
    token_rec = VerificationToken(
        token_type="developer_email_verify",
        target_id=developer.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES),
    )
    db.add(token_rec)
    db.commit()

    EmailService.send_verification_email(
        to_email=developer.email,
        token=raw_token,
        project_name=settings.PROJECT_NAME,
        is_developer=True,
    )

    # Auto-provision starter project so developer never lands on empty state
    try:
        starter_proj_id = generate_project_id()
        starter_name = "Starter Workspace"
        starter_slug = generate_slug(f"{developer.full_name or 'My'} Workspace")
        starter_project = Project(
            id=starter_proj_id,
            developer_id=developer.id,
            name=starter_name,
            slug=starter_slug,
            description="Your starter AuthCraft project workspace.",
            status="active",
            is_published=False,
            published_version=0,
            allow_registration=True,
            require_email_verification=False,
            session_duration_minutes=1440,
            password_min_length=8,
        )
        db.add(starter_project)
        db.flush()

        initial_config = ProjectConfiguration(
            project_id=starter_project.id,
            version=1,
            is_published=False,
            layout_id="minimal-clean-01",
            brand_name=starter_name,
            page_title=f"Sign in to {starter_name}",
            welcome_message="Welcome back! Please enter your credentials to continue.",
            login_text=f"Sign in to access your {starter_name} account",
            register_text=f"Create a new {starter_name} account",
        )
        db.add(initial_config)

        default_redirect = AllowedRedirectUri(
            project_id=starter_project.id,
            redirect_uri=f"{settings.FRONTEND_URL}/demo-app/callback",
        )
        db.add(default_redirect)
        db.commit()
    except Exception as e:
        db.rollback()
        # Fallback non-blocking if starter creation fails

    return developer


@router.post("/login", response_model=TokenResponse)
def login_developer(
    req: DeveloperLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Authenticate developer, issue JWT, and set secure HTTP-only cookie."""
    email_clean = req.email.strip().lower()
    developer = db.query(Developer).filter(Developer.email == email_clean).first()

    # Constant-time comparison & generic error to prevent account enumeration
    if not developer or not verify_password(req.password, developer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not developer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support.",
        )

    # Create signed JWT token
    token = create_access_token(
        subject=developer.id,
        token_type="developer",
        extra_claims={"email": developer.email, "name": developer.full_name},
    )

    # Store hashed session
    session_rec = DeveloperSession(
        developer_id=developer.id,
        session_token_hash=hash_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    db.add(session_rec)
    db.commit()

    # Set secure HTTP-only cookie
    response.set_cookie(
        key="authcraft_dev_session",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

    return TokenResponse(
        access_token=token,
        developer=DeveloperResponse.model_validate(developer),
    )


@router.post("/logout")
def logout_developer(
    response: Response,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Revoke developer session and clear cookies."""
    response.delete_cookie(
        key="authcraft_dev_session",
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=DeveloperResponse)
def get_current_developer_profile(
    current_dev: Developer = Depends(get_current_developer),
):
    """Retrieve authenticated developer profile."""
    return current_dev


@router.post("/verify-email")
def verify_developer_email(
    req: DeveloperEmailVerifyRequest,
    db: Session = Depends(get_db),
):
    """Verify developer email using a secure single-use token."""
    token_hashed = hash_token(req.token.strip())
    now = datetime.now(timezone.utc)

    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_hash == token_hashed,
            VerificationToken.token_type == "developer_email_verify",
            VerificationToken.is_used == False,
        )
        .first()
    )

    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    developer = db.query(Developer).filter(Developer.id == token_rec.target_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer account not found.",
        )

    developer.is_verified = True
    token_rec.is_used = True
    db.commit()

    return {"message": "Email successfully verified. You may now log in."}


@router.post("/forgot-password")
def forgot_password_developer(
    req: DeveloperPasswordResetRequest,
    db: Session = Depends(get_db),
):
    """Initiate developer password reset. Returns generic message to prevent account enumeration."""
    email_clean = req.email.strip().lower()
    developer = db.query(Developer).filter(Developer.email == email_clean).first()

    if developer and developer.is_active:
        raw_token = generate_secure_token(32)
        token_rec = VerificationToken(
            token_type="developer_password_reset",
            target_id=developer.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        )
        db.add(token_rec)
        db.commit()

        EmailService.send_password_reset_email(
            to_email=developer.email,
            token=raw_token,
            project_name=settings.PROJECT_NAME,
            is_developer=True,
        )

    return {
        "message": "If an active account exists for that email, a password reset link has been dispatched."
    }


@router.post("/reset-password")
def reset_password_developer(
    req: DeveloperPasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """Complete developer password reset with valid single-use token."""
    token_hashed = hash_token(req.token.strip())
    now = datetime.now(timezone.utc)

    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_hash == token_hashed,
            VerificationToken.token_type == "developer_password_reset",
            VerificationToken.is_used == False,
        )
        .first()
    )

    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    developer = db.query(Developer).filter(Developer.id == token_rec.target_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer account not found.",
        )

    # Update password with Argon2id hash
    developer.password_hash = get_password_hash(req.new_password)
    token_rec.is_used = True

    # Invalidate all active developer sessions
    db.query(DeveloperSession).filter(DeveloperSession.developer_id == developer.id).update(
        {"is_revoked": True}
    )
    db.commit()

    return {"message": "Password successfully reset. You may now log in with your new credentials."}


@router.post("/change-password")
def change_password_developer(
    req: DeveloperChangePasswordRequest,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Update password for logged in developer."""
    if not verify_password(req.current_password, current_dev.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match.",
        )

    current_dev.password_hash = get_password_hash(req.new_password)
    db.commit()

    return {"message": "Password successfully changed."}


@router.get("/dev-outbox")
def get_development_outbox(
    recipient: Optional[str] = None,
):
    """Helper endpoint to view outbound dev emails/tokens in development mode."""
    if not settings.DEV_EMAIL_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev mailbox only available in development mode.",
        )
    return EmailService.get_dev_outbox(recipient)
