from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DeveloperRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100)


class DeveloperLoginRequest(BaseModel):
    email: EmailStr
    password: str


class DeveloperPasswordResetRequest(BaseModel):
    email: EmailStr


class DeveloperPasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class DeveloperChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class DeveloperEmailVerifyRequest(BaseModel):
    token: str


class DeveloperResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    developer: DeveloperResponse
