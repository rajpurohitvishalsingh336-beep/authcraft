import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.developer import Developer
from app.models.presentation import Presentation, PresentationSlide, PresentationVersion
from app.services.presentation_service import PresentationService, PRESENTATION_THEMES

router = APIRouter()


class PresentationGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200)
    audience: str = Field("General", max_length=100)
    tone: str = Field("Professional", max_length=50)
    slide_count: int = Field(5, ge=3, le=12)
    template_id: str = Field("modern-indigo", max_length=50)
    project_id: Optional[str] = None


class SlideUpdateRequest(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content_json: Optional[str] = None
    speaker_notes: Optional[str] = None
    background_color: Optional[str] = None
    accent_color: Optional[str] = None
    layout_type: Optional[str] = None


class SlideCreateRequest(BaseModel):
    layout_type: str = "split_content"
    title: str = "New Slide Title"
    subtitle: Optional[str] = "Subtitle description"
    content_json: Optional[str] = '{"bullets": ["First point", "Second point"]}'
    speaker_notes: Optional[str] = "Key speaking points for this slide."
    background_color: Optional[str] = None
    accent_color: Optional[str] = None


def format_presentation_response(presentation: Presentation) -> Dict[str, Any]:
    return {
        "id": presentation.id,
        "title": presentation.title,
        "description": presentation.description,
        "topic": presentation.topic,
        "audience": presentation.audience,
        "tone": presentation.tone,
        "template_id": presentation.template_id,
        "aspect_ratio": presentation.aspect_ratio,
        "project_id": presentation.project_id,
        "slide_count": len(presentation.slides) if presentation.slides else 0,
        "slides": [
            {
                "id": s.id,
                "slide_number": s.slide_number,
                "layout_type": s.layout_type,
                "title": s.title,
                "subtitle": s.subtitle,
                "content_json": s.content_json,
                "speaker_notes": s.speaker_notes,
                "background_color": s.background_color,
                "accent_color": s.accent_color,
            }
            for s in (presentation.slides or [])
        ],
        "created_at": presentation.created_at.isoformat() if presentation.created_at else None,
        "updated_at": presentation.updated_at.isoformat() if presentation.updated_at else None,
    }


@router.get("/themes", tags=["AI Presentation Studio"])
def get_presentation_themes():
    """Retrieve catalog of presentation themes and templates."""
    return PRESENTATION_THEMES


@router.post("/generate", tags=["AI Presentation Studio"])
def generate_presentation(
    payload: PresentationGenerateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    AI Prompt-to-Presentation Generation.
    Creates a full deck with customized layouts, content, and themes.
    """
    deck_data = PresentationService.generate_presentation_deck(
        topic=payload.topic,
        audience=payload.audience,
        tone=payload.tone,
        slide_count=payload.slide_count,
        template_id=payload.template_id,
    )

    presentation = Presentation(
        developer_id=current_dev.id,
        project_id=payload.project_id,
        title=deck_data["title"],
        description=deck_data["description"],
        topic=deck_data["topic"],
        audience=deck_data["audience"],
        tone=deck_data["tone"],
        template_id=deck_data["template_id"],
    )
    db.add(presentation)
    db.flush()

    # Add slides
    for s_info in deck_data["slides"]:
        slide = PresentationSlide(
            presentation_id=presentation.id,
            slide_number=s_info["slide_number"],
            layout_type=s_info["layout_type"],
            title=s_info["title"],
            subtitle=s_info.get("subtitle"),
            content_json=s_info.get("content_json", "{}"),
            speaker_notes=s_info.get("speaker_notes"),
            background_color=s_info.get("background_color", "#0F172A"),
            accent_color=s_info.get("accent_color", "#6366F1"),
        )
        db.add(slide)

    db.commit()
    db.refresh(presentation)
    return format_presentation_response(presentation)


@router.get("", tags=["AI Presentation Studio"])
def list_presentations(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """List all presentations created by the current developer."""
    query = db.query(Presentation).filter(Presentation.developer_id == current_dev.id)
    if project_id:
        query = query.filter(Presentation.project_id == project_id)

    presentations = query.order_by(Presentation.updated_at.desc()).all()
    return [format_presentation_response(p) for p in presentations]


@router.get("/{presentation_id}", tags=["AI Presentation Studio"])
def get_presentation_details(
    presentation_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Fetch details and all slides for a specific presentation."""
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    return format_presentation_response(presentation)


@router.put("/{presentation_id}/slides/{slide_id}", tags=["AI Presentation Studio"])
def update_slide(
    presentation_id: str,
    slide_id: str,
    payload: SlideUpdateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Update slide content, theme styling, or layout."""
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    slide = (
        db.query(PresentationSlide)
        .filter(PresentationSlide.id == slide_id, PresentationSlide.presentation_id == presentation.id)
        .first()
    )
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")

    if payload.title is not None:
        slide.title = payload.title
    if payload.subtitle is not None:
        slide.subtitle = payload.subtitle
    if payload.content_json is not None:
        slide.content_json = payload.content_json
    if payload.speaker_notes is not None:
        slide.speaker_notes = payload.speaker_notes
    if payload.background_color is not None:
        slide.background_color = payload.background_color
    if payload.accent_color is not None:
        slide.accent_color = payload.accent_color
    if payload.layout_type is not None:
        slide.layout_type = payload.layout_type

    db.commit()
    db.refresh(slide)

    return {
        "id": slide.id,
        "slide_number": slide.slide_number,
        "layout_type": slide.layout_type,
        "title": slide.title,
        "subtitle": slide.subtitle,
        "content_json": slide.content_json,
        "speaker_notes": slide.speaker_notes,
        "background_color": slide.background_color,
        "accent_color": slide.accent_color,
    }


@router.post("/{presentation_id}/slides", tags=["AI Presentation Studio"])
def add_slide(
    presentation_id: str,
    payload: SlideCreateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Add a new slide to the presentation."""
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    theme = PRESENTATION_THEMES.get(presentation.template_id, PRESENTATION_THEMES["modern-indigo"])
    next_number = len(presentation.slides) + 1

    new_slide = PresentationSlide(
        presentation_id=presentation.id,
        slide_number=next_number,
        layout_type=payload.layout_type,
        title=payload.title,
        subtitle=payload.subtitle,
        content_json=payload.content_json or "{}",
        speaker_notes=payload.speaker_notes,
        background_color=payload.background_color or theme["bg_color"],
        accent_color=payload.accent_color or theme["primary_color"],
    )
    db.add(new_slide)
    db.commit()
    db.refresh(new_slide)

    return {
        "id": new_slide.id,
        "slide_number": new_slide.slide_number,
        "layout_type": new_slide.layout_type,
        "title": new_slide.title,
        "subtitle": new_slide.subtitle,
        "content_json": new_slide.content_json,
        "speaker_notes": new_slide.speaker_notes,
        "background_color": new_slide.background_color,
        "accent_color": new_slide.accent_color,
    }


@router.delete("/{presentation_id}/slides/{slide_id}", tags=["AI Presentation Studio"])
def delete_slide(
    presentation_id: str,
    slide_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Delete a slide and re-number remaining slides."""
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    slide = (
        db.query(PresentationSlide)
        .filter(PresentationSlide.id == slide_id, PresentationSlide.presentation_id == presentation.id)
        .first()
    )
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")

    db.delete(slide)
    db.commit()

    # Re-index remaining slides
    remaining_slides = (
        db.query(PresentationSlide)
        .filter(PresentationSlide.presentation_id == presentation.id)
        .order_by(PresentationSlide.slide_number)
        .all()
    )
    for idx, s in enumerate(remaining_slides, 1):
        s.slide_number = idx
    db.commit()

    return {"message": "Slide deleted successfully", "remaining_count": len(remaining_slides)}


@router.delete("/{presentation_id}", tags=["AI Presentation Studio"])
def delete_presentation(
    presentation_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Delete an entire presentation deck."""
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    db.delete(presentation)
    db.commit()
    return {"message": "Presentation deleted successfully"}


@router.get("/{presentation_id}/export/pptx", tags=["AI Presentation Studio"])
def export_pptx(
    presentation_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    Generate and stream a genuine, editable PowerPoint (.pptx) file.
    Does not rename or fake file formats; produces real OpenXML presentation data.
    """
    presentation = (
        db.query(Presentation)
        .filter(Presentation.id == presentation_id, Presentation.developer_id == current_dev.id)
        .first()
    )
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")

    slides_data = [
        {
            "slide_number": s.slide_number,
            "layout_type": s.layout_type,
            "title": s.title,
            "subtitle": s.subtitle,
            "content_json": s.content_json,
            "speaker_notes": s.speaker_notes,
            "background_color": s.background_color,
            "accent_color": s.accent_color,
        }
        for s in presentation.slides
    ]

    pptx_stream = PresentationService.export_to_pptx(
        presentation_title=presentation.title,
        slides=slides_data,
    )

    safe_title = re.sub(r"[^\w\-_.]", "_", presentation.title)
    filename = f"{safe_title}.pptx"

    return StreamingResponse(
        pptx_stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
