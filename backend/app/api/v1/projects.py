from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.config import settings
from app.core.database import get_db
from app.core.security import generate_project_id, generate_slug
from app.models.application_user import ApplicationUser
from app.models.auth_event import AuthenticationEvent
from app.models.developer import Developer
from app.models.project import AllowedOrigin, AllowedRedirectUri, Project
from app.models.project_config import ProjectConfiguration
from app.schemas.project import (
    AllowedOriginCreate,
    AllowedOriginSchema,
    AllowedRedirectUriCreate,
    AllowedRedirectUriSchema,
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)

router = APIRouter()


def build_hosted_url(slug: str) -> str:
    base = settings.PUBLIC_HOSTED_DOMAIN.rstrip("/")
    return f"{base}/login/{slug}"


def format_project_response(project: Project, db: Session) -> ProjectResponse:
    user_count = db.query(ApplicationUser).filter(ApplicationUser.project_id == project.id).count()
    event_count = db.query(AuthenticationEvent).filter(AuthenticationEvent.project_id == project.id).count()

    return ProjectResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        status=project.status,
        is_published=project.is_published,
        published_version=project.published_version,
        allow_registration=project.allow_registration,
        allow_otp_login=getattr(project, "allow_otp_login", True),
        require_2step_verification=getattr(project, "require_2step_verification", False),
        require_email_verification=project.require_email_verification,
        session_duration_minutes=project.session_duration_minutes,
        password_min_length=project.password_min_length,
        hosted_login_url=build_hosted_url(project.slug),
        created_at=project.created_at,
        updated_at=project.updated_at,
        total_users=user_count,
        total_events=event_count,
        allowed_origins=[AllowedOriginSchema.model_validate(o) for o in project.allowed_origins],
        allowed_redirect_uris=[AllowedRedirectUriSchema.model_validate(r) for r in project.allowed_redirect_uris],
    )


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """List all projects owned by the authenticated developer."""
    projects = (
        db.query(Project)
        .filter(Project.developer_id == current_dev.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [format_project_response(p, db) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Create a new project and initialize its default configuration."""
    # Check limit of projects per developer (free MVP rule)
    existing_count = db.query(Project).filter(Project.developer_id == current_dev.id).count()
    if existing_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project quota exceeded. You have reached the maximum allowed projects on your plan.",
        )

    project_id = generate_project_id()
    project_slug = generate_slug(req.name)

    project = Project(
        id=project_id,
        developer_id=current_dev.id,
        name=req.name.strip(),
        slug=project_slug,
        description=req.description.strip() if req.description else None,
        status="active",
        is_published=False,
        published_version=0,
        allow_registration=req.allow_registration,
        allow_otp_login=req.allow_otp_login,
        require_2step_verification=getattr(req, "require_2step_verification", False),
        require_email_verification=req.require_email_verification,
        session_duration_minutes=req.session_duration_minutes,
        password_min_length=req.password_min_length,
    )
    db.add(project)
    db.flush()

    # Create initial draft configuration
    initial_config = ProjectConfiguration(
        project_id=project.id,
        version=1,
        is_published=False,
        brand_name=project.name,
        page_title=f"Sign in to {project.name}",
        welcome_message="Welcome back! Please enter your credentials to continue.",
        login_text=f"Sign in to access your {project.name} account",
        register_text=f"Create a new {project.name} account",
    )
    db.add(initial_config)

    # Add default development redirect URI (e.g. localhost:3000/callback)
    default_redirect = AllowedRedirectUri(
        project_id=project.id,
        redirect_uri=f"{settings.FRONTEND_URL}/demo-app/callback",
    )
    db.add(default_redirect)

    db.commit()
    db.refresh(project)

    return format_project_response(project, db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Retrieve details for a single project owned by developer."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you do not have permission to access it.",
        )
    return format_project_response(project, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    req: ProjectUpdateRequest,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Update project settings."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you do not have permission to access it.",
        )

    if req.name is not None:
        project.name = req.name.strip()
    if req.description is not None:
        project.description = req.description.strip()
    if req.status is not None:
        project.status = req.status
    if req.allow_registration is not None:
        project.allow_registration = req.allow_registration
    if req.allow_otp_login is not None:
        project.allow_otp_login = req.allow_otp_login
    if req.require_2step_verification is not None:
        project.require_2step_verification = req.require_2step_verification
    if req.require_email_verification is not None:
        project.require_email_verification = req.require_email_verification
    if req.session_duration_minutes is not None:
        project.session_duration_minutes = req.session_duration_minutes
    if req.password_min_length is not None:
        project.password_min_length = req.password_min_length

    db.commit()
    db.refresh(project)
    return format_project_response(project, db)


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Delete a project and all associated data."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you do not have permission to access it.",
        )

    db.delete(project)
    db.commit()
    return {"message": f"Project '{project.name}' and all associated users/events deleted successfully."}


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Duplicate an existing project and its visual configuration as a new draft project."""
    existing_count = db.query(Project).filter(Project.developer_id == current_dev.id).count()
    if existing_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project quota exceeded. You have reached the maximum allowed projects on your plan.",
        )

    source = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you do not have permission to access it.",
        )

    new_project_id = generate_project_id()
    new_name = f"{source.name} (Copy)"
    new_slug = generate_slug(new_name)

    new_project = Project(
        id=new_project_id,
        developer_id=current_dev.id,
        name=new_name,
        slug=new_slug,
        description=source.description,
        status="active",
        is_published=False,
        published_version=0,
        allow_registration=source.allow_registration,
        require_email_verification=source.require_email_verification,
        session_duration_minutes=source.session_duration_minutes,
        password_min_length=source.password_min_length,
    )
    db.add(new_project)
    db.flush()

    # Find source config to clone
    source_config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == source.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )

    if source_config:
        new_config = ProjectConfiguration(
            project_id=new_project.id,
            version=1,
            is_published=False,
            theme_mode=source_config.theme_mode,
            layout_id=source_config.layout_id,
            layout_tokens=source_config.layout_tokens,
            logo_url=source_config.logo_url,
            primary_color=source_config.primary_color,
            secondary_color=source_config.secondary_color,
            background_color=source_config.background_color,
            card_background_color=source_config.card_background_color,
            text_color=source_config.text_color,
            border_radius=source_config.border_radius,
            font_family=source_config.font_family,
            custom_css_vars=source_config.custom_css_vars,
            brand_name=new_name,
            page_title=f"Sign in to {new_name}",
            welcome_message=source_config.welcome_message,
            login_text=source_config.login_text,
            register_text=source_config.register_text,
            email_label=source_config.email_label,
            password_label=source_config.password_label,
            footer_text=source_config.footer_text,
            show_password_toggle=source_config.show_password_toggle,
            show_forgot_password=source_config.show_forgot_password,
            show_registration=source_config.show_registration,
            button_style=source_config.button_style,
            input_style=source_config.input_style,
            layout_style=source_config.layout_style,
            template_name=source_config.template_name,
            form_width=source_config.form_width,
            form_alignment=source_config.form_alignment,
        )
    else:
        new_config = ProjectConfiguration(
            project_id=new_project.id,
            version=1,
            is_published=False,
            brand_name=new_name,
            page_title=f"Sign in to {new_name}",
        )
    db.add(new_config)

    # Clone origins and redirects
    for o in source.allowed_origins:
        db.add(AllowedOrigin(project_id=new_project.id, origin=o.origin))
    for r in source.allowed_redirect_uris:
        db.add(AllowedRedirectUri(project_id=new_project.id, redirect_uri=r.redirect_uri))

    db.commit()
    db.refresh(new_project)
    return format_project_response(new_project, db)


@router.post("/{project_id}/publish", response_model=ProjectResponse)
def publish_project(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """
    Publish the latest draft configuration to production.
    Increments published_version and makes the hosted login URL active.
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you do not have permission to access it.",
        )

    # Find the latest draft config
    latest_config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )

    if not latest_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No configuration found to publish.",
        )

    project.is_published = True
    project.published_version += 1
    latest_config.is_published = True
    latest_config.version = project.published_version

    db.commit()
    db.refresh(project)

    return format_project_response(project, db)


@router.post("/{project_id}/unpublish", response_model=ProjectResponse)
def unpublish_project(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Unpublish the project so hosted authentication pages return safe disabled status."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    project.is_published = False
    db.commit()
    db.refresh(project)

    return format_project_response(project, db)


# Allowed Origins & Redirect URIs
@router.post("/{project_id}/origins", response_model=AllowedOriginSchema)
def add_allowed_origin(
    project_id: str,
    req: AllowedOriginCreate,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    origin_clean = req.origin.strip().rstrip("/")
    origin_rec = AllowedOrigin(project_id=project.id, origin=origin_clean)
    db.add(origin_rec)
    db.commit()
    db.refresh(origin_rec)
    return origin_rec


@router.delete("/{project_id}/origins/{origin_id}")
def delete_allowed_origin(
    project_id: str,
    origin_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    origin = (
        db.query(AllowedOrigin)
        .join(Project)
        .filter(AllowedOrigin.id == origin_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not origin:
        raise HTTPException(status_code=404, detail="Origin not found.")
    db.delete(origin)
    db.commit()
    return {"message": "Origin deleted."}


@router.post("/{project_id}/redirect-uris", response_model=AllowedRedirectUriSchema)
def add_allowed_redirect_uri(
    project_id: str,
    req: AllowedRedirectUriCreate,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    uri_clean = req.redirect_uri.strip()
    # Basic security validation
    if not (uri_clean.startswith("http://localhost") or uri_clean.startswith("http://127.0.0.1") or uri_clean.startswith("https://")):
        raise HTTPException(
            status_code=400,
            detail="Redirect URIs must start with https://, or http://localhost / http://127.0.0.1 for local development."
        )

    redirect_rec = AllowedRedirectUri(project_id=project.id, redirect_uri=uri_clean)
    db.add(redirect_rec)
    db.commit()
    db.refresh(redirect_rec)
    return redirect_rec


@router.delete("/{project_id}/redirect-uris/{redirect_id}")
def delete_allowed_redirect_uri(
    project_id: str,
    redirect_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    redirect = (
        db.query(AllowedRedirectUri)
        .join(Project)
        .filter(AllowedRedirectUri.id == redirect_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not redirect:
        raise HTTPException(status_code=404, detail="Redirect URI not found.")
    db.delete(redirect)
    db.commit()
    return {"message": "Redirect URI deleted."}
