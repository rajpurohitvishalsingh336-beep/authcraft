import json
import re
from datetime import datetime
from typing import Any, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator


HEX_COLOR_REGEX = r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"


class ProjectConfigBase(BaseModel):
    brand_name: str = Field("My App", min_length=1, max_length=100)
    page_title: str = Field("Sign In to Your Account", min_length=1, max_length=100)
    logo_url: Optional[str] = Field(None, max_length=2000)

    # Colors
    primary_color: str = Field("#4F46E5", pattern=HEX_COLOR_REGEX)
    secondary_color: str = Field("#6366F1", pattern=HEX_COLOR_REGEX)
    background_color: str = Field("#F8FAFC", pattern=HEX_COLOR_REGEX)
    card_background_color: str = Field("#FFFFFF", pattern=HEX_COLOR_REGEX)
    text_color: str = Field("#0F172A", pattern=HEX_COLOR_REGEX)
    theme_mode: str = Field("light", pattern="^(light|dark)$")

    # Layout & Styles
    layout_id: str = Field("minimal-clean-01", max_length=50)
    template_name: str = Field("modern")
    layout_style: str = Field("card", pattern="^(card|simple)$")
    form_width: str = Field("md", pattern="^(sm|md|lg)$")
    form_alignment: str = Field("center", pattern="^(left|center|right)$")
    button_style: str = Field("rounded", pattern="^(solid|outline|rounded|pill)$")
    input_style: str = Field("outline", pattern="^(outline|filled|underlined)$")
    font_family: str = Field("Inter")
    border_radius: int = Field(8, ge=0, le=9999)
    layout_tokens: Optional[Union[dict, list, str, Any]] = None

    # Copy & Content
    welcome_message: str = Field("Welcome back! Please enter your details.", max_length=255)
    login_text: str = Field("Sign in to continue to your dashboard", max_length=100)
    register_text: str = Field("Create an account to get started", max_length=100)
    email_label: str = Field("Email Address", max_length=50)
    password_label: str = Field("Password", max_length=50)
    footer_text: str = Field("Protected by AuthCraft No-Code Security", max_length=255)

    # Feature Toggles
    show_password_toggle: bool = True
    show_forgot_password: bool = True
    show_registration: bool = True
    allow_otp_login: bool = True

    # Custom styling
    custom_css_vars: Optional[str] = Field(None, max_length=2000)

    @field_validator("layout_tokens", mode="before")
    def parse_tokens(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v


class ProjectConfigUpdate(BaseModel):
    brand_name: Optional[str] = None
    page_title: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background_color: Optional[str] = None
    card_background_color: Optional[str] = None
    text_color: Optional[str] = None
    theme_mode: Optional[str] = None
    layout_id: Optional[str] = None
    template_name: Optional[str] = None
    layout_style: Optional[str] = None
    form_width: Optional[str] = None
    form_alignment: Optional[str] = None
    button_style: Optional[str] = None
    input_style: Optional[str] = None
    font_family: Optional[str] = None
    border_radius: Optional[int] = None
    layout_tokens: Optional[Union[dict, list, str, Any]] = None
    welcome_message: Optional[str] = None
    login_text: Optional[str] = None
    register_text: Optional[str] = None
    email_label: Optional[str] = None
    password_label: Optional[str] = None
    footer_text: Optional[str] = None
    show_password_toggle: Optional[bool] = None
    show_forgot_password: Optional[bool] = None
    show_registration: Optional[bool] = None
    custom_css_vars: Optional[str] = None


class ProjectConfigResponse(ProjectConfigBase):
    id: str
    project_id: str
    version: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
