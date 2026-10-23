import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True)  # prj_...
    developer_id = Column(String(36), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active", nullable=False)  # active, disabled
    is_published = Column(Boolean, default=False, nullable=False)
    published_version = Column(Integer, default=0, nullable=False)

    # Auth configuration flags
    allow_registration = Column(Boolean, default=True, nullable=False)
    require_email_verification = Column(Boolean, default=False, nullable=False)
    session_duration_minutes = Column(Integer, default=1440, nullable=False)
    password_min_length = Column(Integer, default=8, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    developer = relationship("Developer", back_populates="projects")
    configurations = relationship("ProjectConfiguration", back_populates="project", cascade="all, delete-orphan")
    allowed_origins = relationship("AllowedOrigin", back_populates="project", cascade="all, delete-orphan")
    allowed_redirect_uris = relationship("AllowedRedirectUri", back_populates="project", cascade="all, delete-orphan")
    users = relationship("ApplicationUser", back_populates="project", cascade="all, delete-orphan")
    events = relationship("AuthenticationEvent", back_populates="project", cascade="all, delete-orphan")


class AllowedOrigin(Base):
    __tablename__ = "allowed_origins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    origin = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="allowed_origins")


class AllowedRedirectUri(Base):
    __tablename__ = "allowed_redirect_uris"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    redirect_uri = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="allowed_redirect_uris")
