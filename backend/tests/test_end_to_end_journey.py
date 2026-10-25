from app.services.email_service import EmailService


def test_complete_13_step_journey(client):
    EmailService.clear_dev_outbox()

    # Step 1: A developer registers
    dev_email = "lead.architect@myfirm.io"
    reg_dev = client.post(
        "/api/v1/auth/register",
        json={
            "email": dev_email,
            "password": "MasterDevPassword123!",
            "full_name": "Lead Architect",
        },
    )
    assert reg_dev.status_code == 201
    dev_id = reg_dev.json()["id"]

    # Developer logs in to get session
    login_dev = client.post(
        "/api/v1/auth/login",
        json={"email": dev_email, "password": "MasterDevPassword123!"},
    )
    assert login_dev.status_code == 200
    dev_token = login_dev.json()["access_token"]
    dev_headers = {"Authorization": f"Bearer {dev_token}"}

    # Step 2 & 3: The developer creates Project A; AuthCraft generates a Project ID
    create_proj = client.post(
        "/api/v1/projects",
        headers=dev_headers,
        json={
            "name": "CloudSphere",
            "description": "Next-gen enterprise cloud authentication",
            "require_email_verification": True,
            "password_min_length": 8,
        },
    )
    assert create_proj.status_code == 201
    project_a = create_proj.json()
    project_a_id = project_a["id"]
    project_a_slug = project_a["slug"]
    assert project_a_id.startswith("prj_")

    # Step 4: The developer customizes and publishes a login page
    customize_res = client.put(
        f"/api/v1/projects/{project_a_id}/draft",
        headers=dev_headers,
        json={
            "brand_name": "CloudSphere Enterprise",
            "page_title": "Sign In to CloudSphere",
            "primary_color": "#2563EB",
            "secondary_color": "#1D4ED8",
            "background_color": "#F8FAFC",
            "card_background_color": "#FFFFFF",
            "text_color": "#0F172A",
            "theme_mode": "light",
            "template_name": "modern",
            "layout_style": "card",
            "form_width": "md",
            "form_alignment": "center",
            "button_style": "rounded",
            "input_style": "outline",
            "font_family": "Inter",
            "border_radius": 8,
            "welcome_message": "Welcome back to CloudSphere Enterprise Portal",
            "login_text": "Sign in to access your enterprise environment",
            "register_text": "Register your enterprise account",
            "email_label": "Work Email",
            "password_label": "Enterprise Password",
            "footer_text": "Protected by AuthCraft Enterprise Shield",
            "show_password_toggle": True,
            "show_forgot_password": True,
            "show_registration": True,
        },
    )
    assert customize_res.status_code == 200

    publish_res = client.post(f"/api/v1/projects/{project_a_id}/publish", headers=dev_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["is_published"] is True

    # Step 5: AuthCraft displays a hosted login URL
    hosted_url = publish_res.json()["hosted_login_url"]
    assert f"/login/{project_a_slug}" in hosted_url

    # Check public resolver
    public_config = client.get(f"/api/v1/public/projects/{project_a_slug}/config").json()
    assert public_config["status"] == "ready"
    assert public_config["brand_name"] == "CloudSphere Enterprise"

    # Step 6: A new end user registers through that page
    end_user_email = "employee42@company.com"
    reg_user = client.post(
        f"/api/v1/projects/{project_a_id}/auth/register",
        json={
            "email": end_user_email,
            "password": "EmployeeStrongPass99!",
            "display_name": "Jane Doe",
        },
    )
    assert reg_user.status_code == 200
    user_data = reg_user.json()["user"]
    user_id = user_data["id"]

    # Step 7: The user verifies their email in the configured test environment
    dev_outbox = EmailService.get_dev_outbox(end_user_email)
    assert len(dev_outbox) >= 1
    verify_token = dev_outbox[-1]["metadata"]["token"]

    verify_res = client.post(
        f"/api/v1/projects/{project_a_id}/auth/verify-email",
        json={"token": verify_token},
    )
    assert verify_res.status_code == 200

    # Step 8: The user logs in
    login_user = client.post(
        f"/api/v1/projects/{project_a_id}/auth/login",
        json={
            "email": end_user_email,
            "password": "EmployeeStrongPass99!",
        },
    )
    assert login_user.status_code == 200
    user_token = login_user.json()["session_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Step 9: The user can access the authenticated-user endpoint
    me_res = client.get(f"/api/v1/projects/{project_a_id}/auth/me", headers=user_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == end_user_email
    assert me_res.json()["is_verified"] is True

    # Step 10: The developer sees the user and relevant authentication events in the dashboard
    users_in_dash = client.get(f"/api/v1/projects/{project_a_id}/users", headers=dev_headers).json()
    assert any(u["email"] == end_user_email for u in users_in_dash)

    events_in_dash = client.get(f"/api/v1/projects/{project_a_id}/events", headers=dev_headers).json()
    event_types = [e["event_type"] for e in events_in_dash]
    assert "register" in event_types
    assert "login_success" in event_types

    # Step 11: The user logs out
    logout_user = client.post(f"/api/v1/projects/{project_a_id}/auth/logout", headers=user_headers)
    assert logout_user.status_code == 200

    # Step 12: Attempts to access protected resources without a valid session are rejected
    unauth_res = client.get(f"/api/v1/projects/{project_a_id}/auth/me")
    assert unauth_res.status_code == 401

    # Step 13: A second project cannot access Project A's users or sessions
    create_proj_b = client.post(
        "/api/v1/projects",
        headers=dev_headers,
        json={"name": "Project Omega"},
    ).json()
    project_b_id = create_proj_b["id"]

    # Verify Project Omega's user list is empty and does not contain Project A's employee
    users_proj_b = client.get(f"/api/v1/projects/{project_b_id}/users", headers=dev_headers).json()
    assert len(users_proj_b) == 0

    # Verify user token from Project A cannot access Project B
    cross_check = client.get(f"/api/v1/projects/{project_b_id}/auth/me", headers=user_headers)
    assert cross_check.status_code in (401, 403)
