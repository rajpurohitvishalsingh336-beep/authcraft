import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, String, Text

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(String(36), primary_key=True, default=lambda: f"inc_{uuid.uuid4().hex[:12]}")
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    incident_type = Column(String(50), nullable=False)  # brute_force_spike, disallowed_origin_spike, credential_stuffing
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="open", nullable=False)  # open, investigating, resolved, dismissed
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
