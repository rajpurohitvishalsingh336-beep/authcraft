import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class SuperAdmin(Base):
    __tablename__ = "super_admins"

    id = Column(String(36), primary_key=True, default=lambda: f"sa_{uuid.uuid4().hex[:12]}")
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    totp_secret = Column(String(64), nullable=True)  # RFC 6238 Base32 Secret Key
    is_mfa_enabled = Column(Boolean, default=False, nullable=False)
    role = Column(String(30), default="super_admin", nullable=False)  # super_admin, security_auditor
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    audit_logs = relationship("SuperAdminAuditLog", back_populates="super_admin", cascade="all, delete-orphan", order_by="SuperAdminAuditLog.created_at.desc()")


class SuperAdminAuditLog(Base):
    __tablename__ = "super_admin_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    super_admin_id = Column(String(36), ForeignKey("super_admins.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g., view_tenant, toggle_mfa, purge_incident, change_quota
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=False, default="{}")
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    super_admin = relationship("SuperAdmin", back_populates="audit_logs")
