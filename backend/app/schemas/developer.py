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
    two_step_code: Optional[str] = None
    require_2step: Optional[bool] = None


class Developer2StepVerifyRequest(BaseModel):
    temp_token: str
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    email: Optional[EmailStr] = None


class Developer2StepResendRequest(BaseModel):
    temp_token: str
    email: Optional[EmailStr] = None


class Developer2StepToggleRequest(BaseModel):
    enabled: bool


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


class DeveloperSendOTPRequest(BaseModel):
    email: EmailStr


class DeveloperVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit numeric OTP")


class OTPSendResponse(BaseModel):
    message: str
    email: str
    expires_in_minutes: int
    dev_otp: Optional[str] = None  # Available in dev mode for easy local testing


class DeveloperResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_verified: bool
    is_active: bool
    is_2step_enabled: Optional[bool] = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    developer: Optional[DeveloperResponse] = None
    two_step_required: bool = False
    temp_token: Optional[str] = None
    email: Optional[str] = None
    dev_otp: Optional[str] = None
    message: Optional[str] = None
