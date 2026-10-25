import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(String(36), primary_key=True, default=lambda: f"pres_{uuid.uuid4().hex[:12]}")
    developer_id = Column(String(36), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String(255), nullable=True)
    audience = Column(String(100), default="General", nullable=False)
    tone = Column(String(50), default="Professional", nullable=False)  # Professional, Executive, Creative, Technical, Persuasive
    template_id = Column(String(50), default="modern-pitch", nullable=False)
    aspect_ratio = Column(String(10), default="16:9", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    slides = relationship("PresentationSlide", back_populates="presentation", cascade="all, delete-orphan", order_by="PresentationSlide.slide_number")
    versions = relationship("PresentationVersion", back_populates="presentation", cascade="all, delete-orphan")


class PresentationSlide(Base):
    __tablename__ = "presentation_slides"

    id = Column(String(36), primary_key=True, default=lambda: f"sld_{uuid.uuid4().hex[:12]}")
    presentation_id = Column(String(36), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False, index=True)
    slide_number = Column(Integer, nullable=False)
    layout_type = Column(String(50), default="title", nullable=False)  # title, split_content, quote, metrics, cards, conclusion
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=True)
    content_json = Column(Text, nullable=False, default="{}")  # bullets, paragraphs, structured data
    speaker_notes = Column(Text, nullable=True)
    background_color = Column(String(20), default="#FFFFFF", nullable=False)
    accent_color = Column(String(20), default="#4F46E5", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    presentation = relationship("Presentation", back_populates="slides")


class PresentationVersion(Base):
    __tablename__ = "presentation_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    presentation_id = Column(String(36), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    snapshot_json = Column(Text, nullable=False)
    change_summary = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    presentation = relationship("Presentation", back_populates="versions")
