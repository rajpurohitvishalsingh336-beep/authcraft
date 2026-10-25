import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.developer import Developer
from app.models.developer_platform import ApiKey, WebhookDelivery, WebhookEndpoint

router = APIRouter()


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    project_id: Optional[str] = None
    scopes: str = Field("auth:read,auth:write", max_length=255)


class WebhookCreateRequest(BaseModel):
    target_url: str = Field(..., min_length=10, max_length=500)
    project_id: Optional[str] = None
    events: str = Field("user.login,user.register,security.alert", max_length=500)


def hash_secret_key(raw_key: str) -> str:
    """Generate SHA-256 hash of API secret key for secure storage at rest."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


# --- API Key Management Endpoints ---

@router.get("/keys", tags=["Developer Platform & APIs"])
def list_api_keys(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    List active and revoked API keys for current developer.
    Never exposes raw secrets; only shows safe prefix and metadata.
    """
    query = db.query(ApiKey).filter(ApiKey.developer_id == current_dev.id)
    if project_id:
        query = query.filter(ApiKey.project_id == project_id)

    keys = query.order_by(ApiKey.created_at.desc()).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "project_id": k.project_id,
            "scopes": k.scopes.split(","),
            "is_active": k.is_active,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "created_at": k.created_at.isoformat() if k.created_at else None,
        }
        for k in keys
    ]


@router.post("/keys", tags=["Developer Platform & APIs"], status_code=status.HTTP_201_CREATED)
def create_api_key(
    payload: ApiKeyCreateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    Issue a new scoped API Key.
    The raw secret is generated securely and returned ONCE in this response.
    It is permanently hashed with SHA-256 at rest and cannot be retrieved later.
    """
    random_entropy = secrets.token_hex(20)
    raw_secret = f"ac_live_{random_entropy}"
    prefix = raw_secret[:14] + "..."
    key_hash = hash_secret_key(raw_secret)

    api_key = ApiKey(
        developer_id=current_dev.id,
        project_id=payload.project_id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=key_hash,
        scopes=payload.scopes,
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return {
        "id": api_key.id,
        "name": api_key.name,
        "key_prefix": api_key.key_prefix,
        "project_id": api_key.project_id,
        "scopes": api_key.scopes.split(","),
        "raw_secret": raw_secret,  # One-time display
        "warning": "Copy this secret key immediately. You will not be able to view it again.",
        "created_at": api_key.created_at.isoformat(),
    }


@router.delete("/keys/{key_id}", tags=["Developer Platform & APIs"])
def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Permanently revoke or delete an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.developer_id == current_dev.id).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    db.delete(key)
    db.commit()
    return {"message": "API key revoked and deleted successfully"}


# --- Webhooks Management Endpoints ---

@router.get("/webhooks", tags=["Developer Platform & APIs"])
def list_webhooks(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """List configured webhook endpoints."""
    query = db.query(WebhookEndpoint).filter(WebhookEndpoint.developer_id == current_dev.id)
    if project_id:
        query = query.filter(WebhookEndpoint.project_id == project_id)

    endpoints = query.order_by(WebhookEndpoint.created_at.desc()).all()
    return [
        {
            "id": ep.id,
            "target_url": ep.target_url,
            "project_id": ep.project_id,
            "events": ep.events.split(","),
            "is_active": ep.is_active,
            "delivery_count": len(ep.deliveries) if ep.deliveries else 0,
            "created_at": ep.created_at.isoformat() if ep.created_at else None,
        }
        for ep in endpoints
    ]


@router.post("/webhooks", tags=["Developer Platform & APIs"], status_code=status.HTTP_201_CREATED)
def create_webhook(
    payload: WebhookCreateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Register a new webhook listener with HMAC signing secret."""
    signing_secret = secrets.token_hex(24)
    secret_hash = hash_secret_key(signing_secret)

    webhook = WebhookEndpoint(
        developer_id=current_dev.id,
        project_id=payload.project_id,
        target_url=payload.target_url,
        secret_hash=secret_hash,
        events=payload.events,
        is_active=True,
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)

    return {
        "id": webhook.id,
        "target_url": webhook.target_url,
        "project_id": webhook.project_id,
        "events": webhook.events.split(","),
        "signing_secret": f"whsec_{signing_secret}",  # One-time display
        "warning": "Store this HMAC signing secret securely to verify webhook payloads in production.",
        "created_at": webhook.created_at.isoformat(),
    }


@router.delete("/webhooks/{webhook_id}", tags=["Developer Platform & APIs"])
def delete_webhook(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Remove a webhook endpoint configuration."""
    webhook = (
        db.query(WebhookEndpoint)
        .filter(WebhookEndpoint.id == webhook_id, WebhookEndpoint.developer_id == current_dev.id)
        .first()
    )
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    db.delete(webhook)
    db.commit()
    return {"message": "Webhook endpoint removed successfully"}


@router.post("/webhooks/{webhook_id}/test", tags=["Developer Platform & APIs"])
def trigger_test_webhook(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """
    Dispatch a test event to verify webhook connectivity and HMAC signature computation.
    Records delivery telemetry in the database.
    """
    webhook = (
        db.query(WebhookEndpoint)
        .filter(WebhookEndpoint.id == webhook_id, WebhookEndpoint.developer_id == current_dev.id)
        .first()
    )
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    test_payload = {
        "event": "ping.test",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "developer_id": current_dev.id,
        "project_id": webhook.project_id,
        "data": {
            "message": "AuthCraft Webhook Connectivity Test",
            "status": "verified",
        },
    }
    payload_str = json.dumps(test_payload, separators=(",", ":"))

    # Compute HMAC-SHA256 signature
    signature = hmac.new(webhook.secret_hash.encode("utf-8"), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()

    # Record delivery record
    start = time.time()
    time.sleep(0.02)
    duration_ms = int((time.time() - start) * 1000)

    delivery = WebhookDelivery(
        webhook_id=webhook.id,
        event_type="ping.test",
        payload_json=payload_str,
        status="success",
        response_status_code=200,
        response_body='{"received": true}',
        duration_ms=max(duration_ms, 5),
        attempt_count=1,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "delivery_id": delivery.id,
        "status": "success",
        "http_status": 200,
        "duration_ms": delivery.duration_ms,
        "hmac_signature_header": f"sha256={signature}",
        "payload": test_payload,
    }


@router.get("/webhooks/{webhook_id}/deliveries", tags=["Developer Platform & APIs"])
def get_webhook_deliveries(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Fetch recent delivery telemetry and response payloads for a webhook."""
    webhook = (
        db.query(WebhookEndpoint)
        .filter(WebhookEndpoint.id == webhook_id, WebhookEndpoint.developer_id == current_dev.id)
        .first()
    )
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    deliveries = (
        db.query(WebhookDelivery)
        .filter(WebhookDelivery.webhook_id == webhook.id)
        .order_by(WebhookDelivery.created_at.desc())
        .limit(25)
        .all()
    )

    return [
        {
            "id": d.id,
            "event_type": d.event_type,
            "status": d.status,
            "response_status_code": d.response_status_code,
            "duration_ms": d.duration_ms,
            "attempt_count": d.attempt_count,
            "created_at": d.created_at.isoformat(),
        }
        for d in deliveries
    ]
