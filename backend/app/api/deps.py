from datetime import datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token, hash_token
from app.models.developer import Developer, DeveloperSession


def get_client_ip(request: Request) -> str:
    """Extract client IP safely from forwarded headers or direct connection."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def get_client_user_agent(request: Request) -> str:
    """Extract client user agent."""
    return request.headers.get("User-Agent", "Unknown")[:255]


def get_current_developer(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    authcraft_dev_session: Optional[str] = Cookie(None),
) -> Developer:
    """
    Authenticate developer using either Bearer token header or HTTP-only session cookie.
    Validates token expiration, signature, and developer active status.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
    elif authcraft_dev_session:
        token = authcraft_dev_session

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and verify JWT
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "developer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token scope for developer resource.",
        )

    dev_id = payload.get("sub")
    if not dev_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    developer = db.query(Developer).filter(Developer.id == dev_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Developer account not found.",
        )

    if not developer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer account is disabled.",
        )

    return developer
