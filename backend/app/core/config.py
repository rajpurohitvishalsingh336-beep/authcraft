from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AuthCraft"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "authcraft-development-super-secret-key-32chars-minimum-security"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15  # 15 min short-lived
    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    OTP_EXPIRE_MINUTES: int = 10  # 10 min OTP lifespan
    OTP_LENGTH: int = 6  # 6-digit numeric OTP

    # Argon2id parameters (RFC 9106 recommended)
    ARGON2_TIME_COST: int = 3
    ARGON2_MEMORY_COST: int = 65536
    ARGON2_PARALLELISM: int = 4

    # Database
    DATABASE_URL: str = "sqlite:///./authcraft.db"

    # CORS & Domains
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    FRONTEND_URL: str = "http://localhost:3000"
    PUBLIC_HOSTED_DOMAIN: str = "http://localhost:3000"

    # Cookies
    COOKIE_SECURE: bool = False  # Set to True in HTTPS production
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Union[str, None] = None

    # Development Email Mode
    DEV_EMAIL_MODE: bool = True

    # Rate limiting
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_REGISTER: str = "10/minute"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
