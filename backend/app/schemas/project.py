from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AllowedOriginSchema(BaseModel):
    id: str
    origin: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AllowedOriginCreate(BaseModel):
    origin: str = Field(..., max_length=255)


class AllowedRedirectUriSchema(BaseModel):
    id: str
    redirect_uri: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AllowedRedirectUriCreate(BaseModel):
    redirect_uri: str = Field(..., max_length=500)


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    allow_registration: bool = True
    allow_otp_login: bool = True
    require_2step_verification: bool = False
    require_email_verification: bool = False
    session_duration_minutes: int = Field(1440, ge=15, le=43200)  # Between 15 mins and 30 days
    password_min_length: int = Field(8, ge=6, le=64)


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, pattern="^(active|disabled)$")
    allow_registration: Optional[bool] = None
    allow_otp_login: Optional[bool] = None
    require_2step_verification: Optional[bool] = None
    require_email_verification: Optional[bool] = None
    session_duration_minutes: Optional[int] = Field(None, ge=15, le=43200)
    password_min_length: Optional[int] = Field(None, ge=6, le=64)


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    status: str
    is_published: bool
    published_version: int
    allow_registration: bool
    allow_otp_login: bool = True
    require_2step_verification: bool = False
    require_email_verification: bool
    session_duration_minutes: int
    password_min_length: int
    hosted_login_url: str
    created_at: datetime
    updated_at: datetime
    total_users: int = 0
    total_events: int = 0
    allowed_origins: List[AllowedOriginSchema] = []
    allowed_redirect_uris: List[AllowedRedirectUriSchema] = []

    model_config = ConfigDict(from_attributes=True)
