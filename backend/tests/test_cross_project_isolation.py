def get_dev_headers(client, email="isolation.dev@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "DevPassword123!", "full_name": "Isolation Dev"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DevPassword123!"},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_cross_project_data_isolation(client):
    headers = get_dev_headers(client)

    # 1. Developer creates Project Alpha and Project Beta
    proj_a = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Project Alpha", "password_min_length": 8},
    ).json()
    proj_b = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Project Beta", "password_min_length": 8},
    ).json()

    # Publish both projects
    client.post(f"/api/v1/projects/{proj_a['id']}/publish", headers=headers)
    client.post(f"/api/v1/projects/{proj_b['id']}/publish", headers=headers)

    # 2. Register end-user 'shared@user.com' in Project Alpha
    reg_a = client.post(
        f"/api/v1/projects/{proj_a['id']}/auth/register",
        json={
            "email": "shared@user.com",
            "password": "PasswordAlpha123!",
            "display_name": "Shared User Alpha",
        },
    )
    assert reg_a.status_code == 200
    token_a = reg_a.json()["session_token"]
    user_a_id = reg_a.json()["user"]["id"]

    # 3. Register SAME email 'shared@user.com' in Project Beta with DIFFERENT password
    reg_b = client.post(
        f"/api/v1/projects/{proj_b['id']}/auth/register",
        json={
            "email": "shared@user.com",
            "password": "PasswordBeta456!",
            "display_name": "Shared User Beta",
        },
    )
    assert reg_b.status_code == 200
    token_b = reg_b.json()["session_token"]
    user_b_id = reg_b.json()["user"]["id"]

    # IDs must be different (isolated records in DB)
    assert user_a_id != user_b_id

    # 4. Attempt to log in to Project Beta using Project Alpha's password -> MUST FAIL
    bad_login_b = client.post(
        f"/api/v1/projects/{proj_b['id']}/auth/login",
        json={"email": "shared@user.com", "password": "PasswordAlpha123!"},
    )
    assert bad_login_b.status_code == 401

    # 5. Log in to Project Beta with Project Beta's password -> MUST SUCCEED
    good_login_b = client.post(
        f"/api/v1/projects/{proj_b['id']}/auth/login",
        json={"email": "shared@user.com", "password": "PasswordBeta456!"},
    )
    assert good_login_b.status_code == 200

    # 6. Verify cross-project session token isolation:
    # Token from Project Alpha must NOT be accepted on Project Beta's protected endpoint
    cross_access = client.get(
        f"/api/v1/projects/{proj_b['id']}/auth/me",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert cross_access.status_code == 403

    # Token from Project Beta must be accepted on Project Beta
    valid_access = client.get(
        f"/api/v1/projects/{proj_b['id']}/auth/me",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert valid_access.status_code == 200
    assert valid_access.json()["display_name"] == "Shared User Beta"

    # 7. Project user lists in dashboard must be completely isolated
    users_a = client.get(f"/api/v1/projects/{proj_a['id']}/users", headers=headers).json()
    users_b = client.get(f"/api/v1/projects/{proj_b['id']}/users", headers=headers).json()

    assert len(users_a) == 1
    assert users_a[0]["id"] == user_a_id
    assert users_a[0]["display_name"] == "Shared User Alpha"

    assert len(users_b) == 1
    assert users_b[0]["id"] == user_b_id
    assert users_b[0]["display_name"] == "Shared User Beta"
