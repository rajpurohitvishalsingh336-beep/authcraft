from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.application_user import ApplicationUser
from app.models.auth_event import AuthenticationEvent
from app.models.developer import Developer
from app.models.project import Project
from app.models.user_session import UserSession
from app.schemas.application_user import UserResponse
from app.schemas.auth_event import AuthEventResponse

router = APIRouter()


@router.get("/dashboard/overview")
def get_developer_dashboard_overview(
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Developer-level dashboard aggregate metrics."""
    project_ids = [
        p.id
        for p in db.query(Project.id).filter(Project.developer_id == current_dev.id).all()
    ]

    total_projects = len(project_ids)
    total_users = 0
    total_events = 0
    recent_events = []

    if project_ids:
        total_users = (
            db.query(ApplicationUser)
            .filter(ApplicationUser.project_id.in_(project_ids))
            .count()
        )
        total_events = (
            db.query(AuthenticationEvent)
            .filter(AuthenticationEvent.project_id.in_(project_ids))
            .count()
        )
        events = (
            db.query(AuthenticationEvent)
            .filter(AuthenticationEvent.project_id.in_(project_ids))
            .order_by(AuthenticationEvent.created_at.desc())
            .limit(10)
            .all()
        )
        recent_events = [AuthEventResponse.model_validate(e) for e in events]

    return {
        "developer": {
            "id": current_dev.id,
            "full_name": current_dev.full_name,
            "email": current_dev.email,
        },
        "stats": {
            "total_projects": total_projects,
            "total_users": total_users,
            "total_events": total_events,
            "plan": "Developer Free Tier",
            "project_limit": 10,
        },
        "recent_events": recent_events,
    }


# Project-Scoped Users
@router.get("/projects/{project_id}/users", response_model=List[UserResponse])
def list_project_users(
    project_id: str,
    search: Optional[str] = Query(None, description="Search by email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Retrieve paginated application users isolated to this project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    query = db.query(ApplicationUser).filter(ApplicationUser.project_id == project.id)
    if search:
        query = query.filter(ApplicationUser.email.ilike(f"%{search.strip()}%"))

    users = query.order_by(ApplicationUser.created_at.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/projects/{project_id}/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    project_id: str,
    user_id: str,
    is_active: bool,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Enable or disable an application user account."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == user_id, ApplicationUser.project_id == project.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/projects/{project_id}/users/{user_id}")
def delete_project_user(
    project_id: str,
    user_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Delete an application user."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == user_id, ApplicationUser.project_id == project.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}


# Project-Scoped Audit Events
@router.get("/projects/{project_id}/events", response_model=List[AuthEventResponse])
def list_project_auth_events(
    project_id: str,
    event_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """List security and audit events for a project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    query = db.query(AuthenticationEvent).filter(AuthenticationEvent.project_id == project.id)
    if event_type:
        query = query.filter(AuthenticationEvent.event_type == event_type)
    if status_filter:
        query = query.filter(AuthenticationEvent.status == status_filter)

    events = query.order_by(AuthenticationEvent.created_at.desc()).offset(skip).limit(limit).all()
    return [AuthEventResponse.model_validate(e) for e in events]


# Project-Scoped Sessions
@router.get("/projects/{project_id}/sessions")
def list_project_sessions(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """List active user sessions in this project."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    sessions = (
        db.query(UserSession)
        .filter(UserSession.project_id == project.id, UserSession.is_revoked == False)
        .order_by(UserSession.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "expires_at": s.expires_at,
            "created_at": s.created_at,
        }
        for s in sessions
    ]


@router.post("/projects/{project_id}/sessions/{session_id}/revoke")
def revoke_project_session(
    project_id: str,
    session_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Revoke a specific user session."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    session_rec = (
        db.query(UserSession)
        .filter(UserSession.id == session_id, UserSession.project_id == project.id)
        .first()
    )
    if not session_rec:
        raise HTTPException(status_code=404, detail="Session not found.")

    session_rec.is_revoked = True
    db.commit()
    return {"message": "Session revoked."}
