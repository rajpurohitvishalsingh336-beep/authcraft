import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=lambda: f"key_{uuid.uuid4().hex[:12]}")
    developer_id = Column(String(36), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    key_prefix = Column(String(16), nullable=False, index=True)  # e.g., ac_live_abcd...
    key_hash = Column(String(64), unique=True, index=True, nullable=False)  # SHA-256 of raw secret
    scopes = Column(String(255), default="auth:read,auth:write", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(String(36), primary_key=True, default=lambda: f"whk_{uuid.uuid4().hex[:12]}")
    developer_id = Column(String(36), ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    target_url = Column(String(500), nullable=False)
    secret_hash = Column(String(64), nullable=False)  # HMAC signing key hash
    events = Column(String(500), default="user.login,user.register,security.alert", nullable=False)  # Comma-separated
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    deliveries = relationship("WebhookDelivery", back_populates="webhook", cascade="all, delete-orphan", order_by="WebhookDelivery.created_at.desc()")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_id = Column(String(36), ForeignKey("webhook_endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # success, failed
    response_status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0, nullable=False)
    attempt_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    webhook = relationship("WebhookEndpoint", back_populates="deliveries")
