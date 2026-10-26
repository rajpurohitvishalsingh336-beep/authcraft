import uuid
import pytest


def test_developer_2step_verification_flow(client):
    """Verify full Email 2-Step Verification lifecycle for developers."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"dev.2fa.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # 1. Register developer
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "TwoFactor Dev"},
    )
    assert reg.status_code == 201

    # 2. Login with 2-step challenge requested
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "require_2step": True},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["two_step_required"] is True
    assert "temp_token" in login_data
    assert login_data["email"] == email
    temp_token = login_data["temp_token"]
    otp_code = login_data.get("dev_otp")

    assert otp_code is not None
    assert len(otp_code) == 6

    # 3. Bad verification code should fail with 401
    bad_verify = client.post(
        "/api/v1/auth/login/2step/verify",
        json={"temp_token": temp_token, "otp": "999999", "email": email},
    )
    assert bad_verify.status_code == 401

    # 4. Resend 2-step code
    resend_resp = client.post(
        "/api/v1/auth/login/2step/resend",
        json={"temp_token": temp_token, "email": email},
    )
    assert resend_resp.status_code == 200
    new_otp = resend_resp.json().get("dev_otp")
    assert new_otp is not None
    assert len(new_otp) == 6

    # 5. Verify with fresh code
    good_verify = client.post(
        "/api/v1/auth/login/2step/verify",
        json={"temp_token": temp_token, "otp": new_otp, "email": email},
    )
    assert good_verify.status_code == 200
    good_data = good_verify.json()
    assert "access_token" in good_data
    assert good_data["developer"]["email"] == email
    dev_token = good_data["access_token"]

    # 6. Test toggling 2-step settings
    toggle_resp = client.put(
        "/api/v1/auth/2step-settings",
        headers={"Authorization": f"Bearer {dev_token}"},
        json={"enabled": True},
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_2step_enabled"] is True


def test_app_user_2step_verification_flow(client):
    """Verify full Email 2-Step Verification lifecycle for end-users within a project."""
    unique_suffix = uuid.uuid4().hex[:8]
    dev_email = f"project.owner.{unique_suffix}@example.com"
    password = "MasterPassword123!"

    # 1. Register developer and create project
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": dev_email, "password": password, "full_name": "Project Owner"},
    )
    assert reg.status_code == 201

    dev_login = client.post(
        "/api/v1/auth/login",
        json={"email": dev_email, "password": password, "require_2step": False},
    )
    assert dev_login.status_code == 200
    dev_token = dev_login.json()["access_token"]

    proj_resp = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {dev_token}"},
        json={"name": f"2FA App {unique_suffix}", "require_2step_verification": True},
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # 2. Register end-user under this project
    user_email = f"user.{unique_suffix}@appdomain.com"
    user_pass = "UserSecret123!"
    user_reg = client.post(
        f"/api/v1/projects/{project_id}/auth/register",
        json={"email": user_email, "password": user_pass, "display_name": "Jane User"},
    )
    assert user_reg.status_code == 200

    # 3. Login end-user (project mandates 2-step verification)
    user_login = client.post(
        f"/api/v1/projects/{project_id}/auth/login",
        json={"email": user_email, "password": user_pass},
    )
    assert user_login.status_code == 200
    login_data = user_login.json()
    assert login_data["two_step_required"] is True
    temp_token = login_data["temp_token"]
    otp_code = login_data.get("dev_otp")
    assert otp_code is not None
    assert len(otp_code) == 6

    # 4. Fail verification with bad OTP
    bad_verify = client.post(
        f"/api/v1/projects/{project_id}/auth/login/2step/verify",
        json={"temp_token": temp_token, "otp": "123456"},
    )
    assert bad_verify.status_code == 401

    # 5. Successful verification with correct OTP
    good_verify = client.post(
        f"/api/v1/projects/{project_id}/auth/login/2step/verify",
        json={"temp_token": temp_token, "otp": otp_code},
    )
    assert good_verify.status_code == 200
    good_data = good_verify.json()
    assert "session_token" in good_data
    assert good_data["user"]["email"] == user_email
