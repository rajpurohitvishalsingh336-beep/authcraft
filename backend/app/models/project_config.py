import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ProjectConfiguration(Base):
    __tablename__ = "project_configurations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)

    # Visual identity & Branding
    brand_name = Column(String(100), default="My App", nullable=False)
    page_title = Column(String(100), default="Sign In to Your Account", nullable=False)
    logo_url = Column(Text, nullable=True)

    # Colors & Theme
    primary_color = Column(String(20), default="#4F46E5", nullable=False)
    secondary_color = Column(String(20), default="#6366F1", nullable=False)
    background_color = Column(String(20), default="#F8FAFC", nullable=False)
    card_background_color = Column(String(20), default="#FFFFFF", nullable=False)
    text_color = Column(String(20), default="#0F172A", nullable=False)
    theme_mode = Column(String(10), default="light", nullable=False)  # light, dark

    # Layout & Styling
    template_name = Column(String(30), default="modern", nullable=False)  # modern, minimal, professional, dark, startup, classic
    layout_style = Column(String(20), default="card", nullable=False)  # card, simple
    form_width = Column(String(10), default="md", nullable=False)  # sm, md, lg
    form_alignment = Column(String(10), default="center", nullable=False)  # center, left, right
    button_style = Column(String(20), default="rounded", nullable=False)  # solid, outline, rounded, pill
    input_style = Column(String(20), default="outline", nullable=False)  # outline, filled, underlined
    font_family = Column(String(30), default="Inter", nullable=False)  # Inter, Roboto, Poppins, Outfit, System
    border_radius = Column(Integer, default=8, nullable=False)  # 0, 4, 8, 12, 16, 9999

    # Copy & Content
    welcome_message = Column(String(255), default="Welcome back! Please enter your details.", nullable=False)
    login_text = Column(String(100), default="Sign in to continue to your dashboard", nullable=False)
    register_text = Column(String(100), default="Create an account to get started", nullable=False)
    email_label = Column(String(50), default="Email Address", nullable=False)
    password_label = Column(String(50), default="Password", nullable=False)
    footer_text = Column(String(255), default="Protected by AuthCraft No-Code Security", nullable=False)

    # Feature Toggles
    show_password_toggle = Column(Boolean, default=True, nullable=False)
    show_forgot_password = Column(Boolean, default=True, nullable=False)
    show_registration = Column(Boolean, default=True, nullable=False)

    # Optional custom CSS variables or json overrides
    custom_css_vars = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    project = relationship("Project", back_populates="configurations")
