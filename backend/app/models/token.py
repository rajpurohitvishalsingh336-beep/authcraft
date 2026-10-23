import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, String

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_type = Column(String(50), nullable=False, index=True)  # developer_email_verify, developer_password_reset, app_user_email_verify, app_user_password_reset
    target_id = Column(String(64), nullable=False, index=True)  # developer_id or application_user_id
    project_id = Column(String(64), nullable=True, index=True)  # null for developer tokens, project_id for end-user tokens
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
