import hashlib
import re
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

import argon2
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import jwt

from app.core.config import settings

# Initialize Argon2id hasher with configured parameters (RFC 9106)
_ph = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    type=argon2.Type.ID,
)


def get_password_hash(password: str) -> str:
    """Hash a password using Argon2id."""
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against an Argon2id hash using constant-time comparison."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token (URL-safe string)."""
    return secrets.token_urlsafe(length)


def generate_numeric_otp(digits: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    return "".join(secrets.choice(string.digits) for _ in range(digits))


def hash_token(token: str) -> str:
    """
    Hash a high-entropy token using SHA-256 for safe database storage.
    Raw tokens are never stored in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_otp(target_id: str, otp: str) -> str:
    """
    Salt and hash a numeric OTP bound to target_id for rainbow-table resistant storage.
    """
    salted = f"{target_id}:{otp.strip()}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def create_access_token(
    subject: Union[str, Any],
    token_type: str = "developer",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create a signed JWT token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "sub", "iat", "type"]},
        )
        return payload
    except jwt.PyJWTError:
        return None


def generate_project_id() -> str:
    """Generate a unique project ID in the standard format `prj_<uuid4>`."""
    return f"prj_{uuid.uuid4().hex}"


def generate_slug(name: str) -> str:
    """
    Generate a URL-friendly slug from a project name with a short random suffix
    to avoid collisions.
    """
    base = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    if not base:
        base = "project"
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(4))
    return f"{base[:30]}-{suffix}"
