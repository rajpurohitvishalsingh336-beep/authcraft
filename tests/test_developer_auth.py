from app.core.security import verify_password
from app.models.developer import Developer
from app.services.email_service import EmailService


def test_developer_registration_and_argon2(client, db):
    EmailService.clear_dev_outbox()
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "sarah.dev@example.com",
            "password": "SuperSecurePassword123!",
            "full_name": "Sarah Connor",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "sarah.dev@example.com"
    assert data["full_name"] == "Sarah Connor"
    assert "password" not in data

    # Verify password was stored with Argon2id hash
    dev_in_db = db.query(Developer).filter(Developer.email == "sarah.dev@example.com").first()
    assert dev_in_db is not None
    assert dev_in_db.password_hash.startswith("$argon2id$")
    assert verify_password("SuperSecurePassword123!", dev_in_db.password_hash) is True
    assert verify_password("WrongPassword!", dev_in_db.password_hash) is False


def test_developer_registration_duplicate_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "unique.dev@example.com",
            "password": "Password1234!",
            "full_name": "Unique Dev",
        },
    )
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "unique.dev@example.com",
            "password": "Password1234!",
            "full_name": "Duplicate Dev",
        },
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()


def test_developer_login_and_session(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "alex@startup.io",
            "password": "AlexPassword999#",
            "full_name": "Alex Mercer",
        },
    )

    # Failed login
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@startup.io", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401
    assert "invalid email or password" in bad_login.json()["detail"].lower()

    # Successful login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@startup.io", "password": "AlexPassword999#"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Verify protected /auth/me endpoint
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alex@startup.io"

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200


def test_developer_password_reset_flow(client):
    EmailService.clear_dev_outbox()
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "reset.tester@example.com",
            "password": "OldPassword123!",
            "full_name": "Reset Tester",
        },
    )

    # Request password reset
    forgot_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset.tester@example.com"},
    )
    assert forgot_res.status_code == 200

    outbox = EmailService.get_dev_outbox("reset.tester@example.com")
    assert len(outbox) >= 1
    reset_token = outbox[-1]["metadata"]["token"]
    assert reset_token is not None

    # Reset password with token
    confirm_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "NewBrandPassword456!"},
    )
    assert confirm_res.status_code == 200

    # Old password no longer works
    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.tester@example.com", "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    # New password works
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.tester@example.com", "password": "NewBrandPassword456!"},
    )
    assert new_login.status_code == 200
