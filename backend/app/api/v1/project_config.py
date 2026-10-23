import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.developer import Developer
from app.models.project import Project
from app.models.project_config import ProjectConfiguration
from app.schemas.project_config import ProjectConfigResponse, ProjectConfigUpdate

router = APIRouter()

# Predefined templates
TEMPLATES: Dict[str, Dict[str, Any]] = {
    "modern": {
        "template_name": "modern",
        "primary_color": "#4F46E5",  # Indigo
        "secondary_color": "#6366F1",
        "background_color": "#F8FAFC",
        "card_background_color": "#FFFFFF",
        "text_color": "#0F172A",
        "theme_mode": "light",
        "layout_style": "card",
        "form_width": "md",
        "form_alignment": "center",
        "button_style": "rounded",
        "input_style": "outline",
        "font_family": "Inter",
        "border_radius": 8,
    },
    "minimal": {
        "template_name": "minimal",
        "primary_color": "#18181B",  # Zinc
        "secondary_color": "#27272A",
        "background_color": "#FFFFFF",
        "card_background_color": "#FAFAFA",
        "text_color": "#18181B",
        "theme_mode": "light",
        "layout_style": "simple",
        "form_width": "sm",
        "form_alignment": "center",
        "button_style": "solid",
        "input_style": "underlined",
        "font_family": "Inter",
        "border_radius": 4,
    },
    "professional": {
        "template_name": "professional",
        "primary_color": "#0284C7",  # Sky
        "secondary_color": "#0369A1",
        "background_color": "#F0F9FF",
        "card_background_color": "#FFFFFF",
        "text_color": "#0C4A6E",
        "theme_mode": "light",
        "layout_style": "card",
        "form_width": "md",
        "form_alignment": "center",
        "button_style": "rounded",
        "input_style": "outline",
        "font_family": "Roboto",
        "border_radius": 6,
    },
    "dark": {
        "template_name": "dark",
        "primary_color": "#8B5CF6",  # Violet
        "secondary_color": "#A78BFA",
        "background_color": "#09090B",
        "card_background_color": "#18181B",
        "text_color": "#F4F4F5",
        "theme_mode": "dark",
        "layout_style": "card",
        "form_width": "md",
        "form_alignment": "center",
        "button_style": "rounded",
        "input_style": "filled",
        "font_family": "Outfit",
        "border_radius": 12,
    },
    "startup": {
        "template_name": "startup",
        "primary_color": "#10B981",  # Emerald
        "secondary_color": "#059669",
        "background_color": "#F0FDF4",
        "card_background_color": "#FFFFFF",
        "text_color": "#064E3B",
        "theme_mode": "light",
        "layout_style": "card",
        "form_width": "md",
        "form_alignment": "center",
        "button_style": "pill",
        "input_style": "outline",
        "font_family": "Poppins",
        "border_radius": 16,
    },
    "classic": {
        "template_name": "classic",
        "primary_color": "#334155",  # Slate
        "secondary_color": "#475569",
        "background_color": "#F1F5F9",
        "card_background_color": "#FFFFFF",
        "text_color": "#1E293B",
        "theme_mode": "light",
        "layout_style": "card",
        "form_width": "md",
        "form_alignment": "center",
        "button_style": "rounded",
        "input_style": "outline",
        "font_family": "System",
        "border_radius": 4,
    },
}


@router.get("/templates")
def list_templates():
    """List available predefined design templates."""
    return TEMPLATES


@router.get("/{project_id}/draft", response_model=ProjectConfigResponse)
def get_draft_config(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Get the current draft configuration for the visual builder."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )
    if not config:
        # Create default config if missing
        config = ProjectConfiguration(
            project_id=project.id,
            brand_name=project.name,
            page_title=f"Sign in to {project.name}",
        )
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


@router.put("/{project_id}/draft", response_model=ProjectConfigResponse)
def update_draft_config(
    project_id: str,
    req: ProjectConfigUpdate,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Save changes to the visual builder draft configuration."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )

    if not config:
        config = ProjectConfiguration(project_id=project.id)
        db.add(config)

    # Apply verified updates
    for field, value in req.model_dump(exclude_unset=True).items():
        if field == "layout_tokens" and isinstance(value, (dict, list)):
            value = json.dumps(value)
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


@router.post("/{project_id}/apply-template/{template_name}", response_model=ProjectConfigResponse)
def apply_template(
    project_id: str,
    template_name: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Apply a predefined template preset to the draft configuration."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    template = TEMPLATES.get(template_name.lower())
    if not template:
        raise HTTPException(status_code=400, detail=f"Unknown template: {template_name}")

    config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )
    if not config:
        config = ProjectConfiguration(project_id=project.id)
        db.add(config)

    for key, val in template.items():
        setattr(config, key, val)

    db.commit()
    db.refresh(config)
    return config


@router.get("/{project_id}/export")
def export_project_config(
    project_id: str,
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Export project configuration as a validated JSON structure."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found.")

    return {
        "export_version": "2.0",
        "authcraft_schema_version": "2.0",
        "exported_at": config.updated_at.isoformat() if config.updated_at else None,
        "project_name": project.name,
        "configuration": {
            "layout_id": getattr(config, "layout_id", "saas-01"),
            "brand_name": config.brand_name,
            "page_title": config.page_title,
            "logo_url": config.logo_url,
            "primary_color": config.primary_color,
            "secondary_color": config.secondary_color,
            "background_color": config.background_color,
            "card_background_color": config.card_background_color,
            "text_color": config.text_color,
            "theme_mode": config.theme_mode,
            "template_name": config.template_name,
            "layout_style": config.layout_style,
            "form_width": config.form_width,
            "form_alignment": config.form_alignment,
            "button_style": config.button_style,
            "input_style": config.input_style,
            "font_family": config.font_family,
            "border_radius": config.border_radius,
            "welcome_message": config.welcome_message,
            "login_text": config.login_text,
            "register_text": config.register_text,
            "email_label": config.email_label,
            "password_label": config.password_label,
            "footer_text": config.footer_text,
            "show_password_toggle": config.show_password_toggle,
            "show_forgot_password": config.show_forgot_password,
            "show_registration": config.show_registration,
            "layout_tokens": getattr(config, "layout_tokens", None),
        },
    }


@router.post("/{project_id}/import", response_model=ProjectConfigResponse)
def import_project_config(
    project_id: str,
    payload: Dict[str, Any],
    current_dev: Developer = Depends(get_current_developer),
    db: Session = Depends(get_db),
):
    """Import and validate project configuration from JSON."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.developer_id == current_dev.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    raw_config = payload.get("configuration") if "configuration" in payload else payload
    validated = ProjectConfigUpdate.model_validate(raw_config)

    config = (
        db.query(ProjectConfiguration)
        .filter(ProjectConfiguration.project_id == project.id)
        .order_by(ProjectConfiguration.created_at.desc())
        .first()
    )
    if not config:
        config = ProjectConfiguration(project_id=project.id)
        db.add(config)

    for field, value in validated.model_dump(exclude_unset=True).items():
        if field == "layout_tokens" and isinstance(value, (dict, list)):
            value = json.dumps(value)
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config
