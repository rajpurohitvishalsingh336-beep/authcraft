from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = Field(None, max_length=100)
    redirect_uri: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    redirect_uri: Optional[str] = None


class UserForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class UserVerifyEmailRequest(BaseModel):
    token: str


class UserSendOTPRequest(BaseModel):
    email: EmailStr
    redirect_uri: Optional[str] = None


class UserVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit numeric OTP")
    redirect_uri: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    project_id: str
    email: str
    display_name: Optional[str]
    is_verified: bool
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAuthSuccessResponse(BaseModel):
    message: str
    user: UserResponse
    session_token: str
    redirect_uri: Optional[str] = None
