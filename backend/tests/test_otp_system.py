import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_developer_otp_send_and_verify():
    """Verify developer passwordless 1-click OTP authentication."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"dev.otp.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # Register developer
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": password, "full_name": "OTP Developer"})
    assert reg.status_code == 201

    # Request OTP
    send_resp = client.post("/api/v1/auth/otp/send", json={"email": email})
    assert send_resp.status_code == 200
    assert "sent successfully" in send_resp.json()["message"]

    # In dev mode, dev_otp is included or can be fetched via /otp/latest
    otp_code = send_resp.json().get("dev_otp")
    if not otp_code:
        latest_resp = client.get(f"/api/v1/auth/otp/latest?email={email}")
        assert latest_resp.status_code == 200
        otp_code = latest_resp.json()["latest_otp"]

    assert otp_code is not None
    assert len(otp_code) == 6

    # Verify with wrong OTP
    bad_verify = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": "000000"})
    assert bad_verify.status_code == 401

    # Verify with correct OTP
    good_verify = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": otp_code})
    assert good_verify.status_code == 200
    assert "access_token" in good_verify.json()
