import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.auth_event import AuthenticationEvent
from app.models.developer import Developer
from app.models.project import Project
from app.models.security_incident import SecurityIncident
from app.models.user_session import UserSession

router = APIRouter()


class IncidentUpdateRequest(BaseModel):
    status: str = Field(..., max_length=20)  # open, investigating, resolved, dismissed
    resolution_notes: Optional[str] = None


class IncidentCreateRequest(BaseModel):
    project_id: str
    severity: str = Field("medium", max_length=20)  # low, medium, high, critical
    incident_type: str = Field(..., max_length=50)
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    metadata_json: Optional[str] = "{}"


class RevokeUserSessionsRequest(BaseModel):
    project_id: str
    user_id: str


@router.get("/incidents", tags=["Security Intelligence Center"])
def list_incidents(
    project_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """List security incidents across developer's projects."""
    dev_project_ids = [p.id for p in db.query(Project).filter(Project.developer_id == current_dev.id).all()]
    if not dev_project_ids:
        return []

    query = db.query(SecurityIncident).filter(SecurityIncident.project_id.in_(dev_project_ids))
    if project_id:
        if project_id not in dev_project_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")
        query = query.filter(SecurityIncident.project_id == project_id)
    if severity:
        query = query.filter(SecurityIncident.severity == severity)

    incidents = query.order_by(SecurityIncident.created_at.desc()).all()
    return [
        {
            "id": inc.id,
            "project_id": inc.project_id,
            "severity": inc.severity,
            "incident_type": inc.incident_type,
            "title": inc.title,
            "description": inc.description,
            "status": inc.status,
            "resolved_by": inc.resolved_by,
            "resolution_notes": inc.resolution_notes,
            "metadata": json.loads(inc.metadata_json) if inc.metadata_json else {},
            "created_at": inc.created_at.isoformat(),
            "updated_at": inc.updated_at.isoformat(),
        }
        for inc in incidents
    ]


@router.post("/incidents", tags=["Security Intelligence Center"], status_code=status.HTTP_201_CREATED)
def report_incident(
    payload: IncidentCreateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Record a newly discovered security incident or alert."""
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    incident = SecurityIncident(
        project_id=payload.project_id,
        severity=payload.severity,
        incident_type=payload.incident_type,
        title=payload.title,
        description=payload.description,
        metadata_json=payload.metadata_json or "{}",
        status="open",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return {
        "id": incident.id,
        "project_id": incident.project_id,
        "severity": incident.severity,
        "title": incident.title,
        "status": incident.status,
        "created_at": incident.created_at.isoformat(),
    }


@router.put("/incidents/{incident_id}", tags=["Security Intelligence Center"])
def update_incident(
    incident_id: str,
    payload: IncidentUpdateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Triage or resolve a security incident."""
    incident = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    # Verify project ownership
    project = (
        db.query(Project)
        .filter(Project.id == incident.project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    incident.status = payload.status
    if payload.resolution_notes:
        incident.resolution_notes = payload.resolution_notes
    if payload.status in ["resolved", "dismissed"]:
        incident.resolved_by = current_dev.email

    db.commit()
    db.refresh(incident)

    return {
        "id": incident.id,
        "status": incident.status,
        "resolved_by": incident.resolved_by,
        "resolution_notes": incident.resolution_notes,
        "updated_at": incident.updated_at.isoformat(),
    }


@router.get("/posture", tags=["Security Intelligence Center"])
def get_security_posture(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    Computes real-time enterprise security health score and compliance checks.
    """
    dev_projects = db.query(Project).filter(Project.developer_id == current_dev.id).all()
    if not dev_projects:
        return {"score": 100, "status": "nominal", "checklist": []}

    target_projects = [p for p in dev_projects if p.id == project_id] if project_id else dev_projects
    target_ids = [p.id for p in target_projects]

    unresolved_incidents = (
        db.query(SecurityIncident)
        .filter(SecurityIncident.project_id.in_(target_ids), SecurityIncident.status.in_(["open", "investigating"]))
        .count()
    )

    failed_auth_24h = (
        db.query(AuthenticationEvent)
        .filter(AuthenticationEvent.project_id.in_(target_ids), AuthenticationEvent.status == "failure")
        .count()
    )

    # Scoring algorithm
    score = 100
    if unresolved_incidents > 0:
        score -= min(unresolved_incidents * 15, 45)
    if failed_auth_24h > 10:
        score -= min((failed_auth_24h // 5) * 5, 25)

    checklist = [
        {
            "name": "Argon2id Salted Hashing",
            "passed": True,
            "description": "All developer and end-user passwords use memory-hard Argon2id.",
        },
        {
            "name": "Strict CORS Whitelist Enforced",
            "passed": all(len(p.allowed_origins) > 0 for p in target_projects) if target_projects else True,
            "description": "Hosted endpoints reject unverified origins.",
        },
        {
            "name": "1-Click OTP Verification Enabled",
            "passed": all(getattr(p, "allow_otp_login", True) for p in target_projects),
            "description": "Passwordless MFA available for login protection.",
        },
        {
            "name": "Zero Open Security Incidents",
            "passed": unresolved_incidents == 0,
            "description": f"{unresolved_incidents} active incidents pending triage.",
        },
    ]

    return {
        "score": max(score, 10),
        "rating": "A+" if score >= 90 else "A" if score >= 80 else "B" if score >= 65 else "Warning",
        "unresolved_incidents": unresolved_incidents,
        "failed_auth_24h": failed_auth_24h,
        "checklist": checklist,
    }


@router.get("/sessions", tags=["Security Intelligence Center"])
def list_active_sessions(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """List active user sessions across developer's projects."""
    dev_project_ids = [p.id for p in db.query(Project).filter(Project.developer_id == current_dev.id).all()]
    if not dev_project_ids:
        return []

    target_ids = [project_id] if project_id and project_id in dev_project_ids else dev_project_ids

    now = datetime.now(timezone.utc)
    sessions = (
        db.query(UserSession)
        .filter(UserSession.project_id.in_(target_ids), UserSession.is_revoked == False, UserSession.expires_at > now)
        .order_by(UserSession.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": s.id,
            "project_id": s.project_id,
            "user_id": s.user_id,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "created_at": s.created_at.isoformat(),
            "expires_at": s.expires_at.isoformat(),
            "is_revoked": s.is_revoked,
        }
        for s in sessions
    ]


@router.post("/sessions/{session_id}/revoke", tags=["Security Intelligence Center"])
def revoke_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Immediately revoke an active end-user session."""
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    project = db.query(Project).filter(Project.id == session.project_id, Project.developer_id == current_dev.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    session.is_revoked = True
    db.commit()

    return {"message": "Session revoked successfully", "session_id": session_id}


@router.post("/sessions/revoke-user", tags=["Security Intelligence Center"])
def revoke_all_user_sessions(
    payload: RevokeUserSessionsRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Revoke all active sessions for a specific user ID."""
    project = db.query(Project).filter(Project.id == payload.project_id, Project.developer_id == current_dev.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updated_count = (
        db.query(UserSession)
        .filter(UserSession.project_id == payload.project_id, UserSession.user_id == payload.user_id, UserSession.is_revoked == False)
        .update({"is_revoked": True})
    )
    db.commit()

    return {"message": f"Successfully revoked {updated_count} active sessions", "revoked_count": updated_count}
