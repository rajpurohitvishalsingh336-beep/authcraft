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
