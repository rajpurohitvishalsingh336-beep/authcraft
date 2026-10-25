import uuid
import pytest
import pyotp
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.super_admin import SuperAdmin

client = TestClient(app)


def setup_test_super_admin():
    """Helper to create a dedicated super admin for automated testing."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"admin.test.{unique_suffix}@authcraft.internal"
    password = "SuperAdminSecret2026!"
    totp_secret = pyotp.random_base32()

    db = SessionLocal()
    admin = SuperAdmin(
        email=email,
        password_hash=get_password_hash(password),
        full_name="Automated Test Admin",
        totp_secret=totp_secret,
        is_mfa_enabled=True,
        role="super_admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    admin_id = admin.id
    db.close()

    return email, password, totp_secret, admin_id


def get_standard_developer_token():
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"standard.dev.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Standard Dev"},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


def test_super_admin_mfa_authentication_and_dashboard():
    email, password, totp_secret, admin_id = setup_test_super_admin()

    # 1. Step 1: Submit email & password -> Expect MFA Challenge
    login_step1 = client.post(
        "/api/v1/super-admin/login",
        json={"email": email, "password": password},
    )
    assert login_step1.status_code == 200
    mfa_challenge = login_step1.json()
    assert mfa_challenge["mfa_required"] is True
    temp_token = mfa_challenge["temp_token"]

    # 2. Step 2: Attempt invalid TOTP code -> 401 Unauthorized
    bad_mfa = client.post(
        "/api/v1/super-admin/mfa/verify",
        json={"temp_token": temp_token, "totp_code": "000000"},
    )
    assert bad_mfa.status_code == 401

    # 3. Step 3: Submit valid TOTP code
    totp = pyotp.TOTP(totp_secret)
    valid_code = totp.now()

    good_mfa = client.post(
        "/api/v1/super-admin/mfa/verify",
        json={"temp_token": temp_token, "totp_code": valid_code},
    )
    assert good_mfa.status_code == 200
    auth_data = good_mfa.json()
    assert "access_token" in auth_data
    admin_token = auth_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Super Admin platform overview
    overview_resp = client.get("/api/v1/super-admin/overview", headers=admin_headers)
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert overview["status"] == "nominal"
    assert "tenants" in overview
    assert "resources" in overview

    # 5. Query tenant list
    tenants_resp = client.get("/api/v1/super-admin/tenants", headers=admin_headers)
    assert tenants_resp.status_code == 200
    assert isinstance(tenants_resp.json(), list)

    # 6. Query audit logs
    audit_resp = client.get("/api/v1/super-admin/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    assert len(audit_logs) >= 1

    # 7. Privilege Isolation Test: Standard developer token must be REJECTED from Super Admin endpoints
    dev_token = get_standard_developer_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    forbidden_resp = client.get("/api/v1/super-admin/overview", headers=dev_headers)
    assert forbidden_resp.status_code == 403
    assert "Super Admin privileges required" in forbidden_resp.text
