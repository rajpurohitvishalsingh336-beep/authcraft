import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def get_auth_token():
    """Helper to register and login a test developer."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"platform.tester.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "API Architect"},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


def test_api_keys_security_lifecycle():
    """Verify API keys issuance, one-time reveal, list safety, and revocation."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create API key
    create_resp = client.post(
        "/api/v1/developer/keys",
        json={"name": "Production Microservice Key", "scopes": "auth:read,auth:write"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    key_data = create_resp.json()
    assert "raw_secret" in key_data
    assert key_data["raw_secret"].startswith("ac_live_")
    key_id = key_data["id"]

    # 2. List API keys - ensure raw_secret is never exposed
    list_resp = client.get("/api/v1/developer/keys", headers=headers)
    assert list_resp.status_code == 200
    keys_list = list_resp.json()
    assert len(keys_list) >= 1
    found = next(k for k in keys_list if k["id"] == key_id)
    assert "raw_secret" not in found
    assert "key_hash" not in found
    assert found["key_prefix"].startswith("ac_live_")

    # 3. Revoke key
    del_resp = client.delete(f"/api/v1/developer/keys/{key_id}", headers=headers)
    assert del_resp.status_code == 200

    # 4. Confirm revoked
    list_resp_2 = client.get("/api/v1/developer/keys", headers=headers)
    assert not any(k["id"] == key_id for k in list_resp_2.json())


def test_webhooks_lifecycle_and_hmac_delivery():
    """Verify webhook registration, HMAC signing secret issuance, and test delivery."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register webhook
    wh_resp = client.post(
        "/api/v1/developer/webhooks",
        json={
            "target_url": "https://api.mycorp.internal/webhooks/authcraft",
            "events": "user.login,security.alert",
        },
        headers=headers,
    )
    assert wh_resp.status_code == 201
    wh_data = wh_resp.json()
    assert "signing_secret" in wh_data
    assert wh_data["signing_secret"].startswith("whsec_")
    webhook_id = wh_data["id"]

    # 2. Trigger test delivery
    test_resp = client.post(f"/api/v1/developer/webhooks/{webhook_id}/test", headers=headers)
    assert test_resp.status_code == 200
    delivery = test_resp.json()
    assert delivery["status"] == "success"
    assert delivery["http_status"] == 200
    assert "sha256=" in delivery["hmac_signature_header"]

    # 3. Query delivery logs
    logs_resp = client.get(f"/api/v1/developer/webhooks/{webhook_id}/deliveries", headers=headers)
    assert logs_resp.status_code == 200
    deliveries = logs_resp.json()
    assert len(deliveries) >= 1
    assert deliveries[0]["event_type"] == "ping.test"

    # 4. Clean up webhook
    del_wh = client.delete(f"/api/v1/developer/webhooks/{webhook_id}", headers=headers)
    assert del_wh.status_code == 200
