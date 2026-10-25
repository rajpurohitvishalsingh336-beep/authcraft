import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: f"wf_{uuid.uuid4().hex[:12]}")
    developer_id = Column(String(36), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), default="manual", nullable=False)  # on_project_created, on_login_failure_spike, on_user_registered, scheduled, manual
    status = Column(String(20), default="active", nullable=False)  # active, paused, draft
    definition_json = Column(Text, nullable=False, default="{}")  # Nodes & edges graph structure
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowExecution.started_at.desc()")


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(String(36), primary_key=True, default=lambda: f"wfx_{uuid.uuid4().hex[:12]}")
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_event = Column(String(50), nullable=False)
    status = Column(String(20), default="running", nullable=False)  # running, completed, failed, cancelled
    duration_ms = Column(Integer, default=0, nullable=False)
    logs_json = Column(Text, nullable=False, default="[]")  # Step-by-step execution logs & node outputs
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    workflow = relationship("Workflow", back_populates="executions")
