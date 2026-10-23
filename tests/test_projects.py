def get_dev_token(client, email="project.dev@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "Project Dev"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return res.json()["access_token"]


def test_project_lifecycle_and_builder_config(client):
    token = get_dev_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create project
    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Acme SaaS",
            "description": "B2B Authentication Portal",
            "allow_registration": True,
            "session_duration_minutes": 720,
            "password_min_length": 8,
        },
    )
    assert create_res.status_code == 201
    project = create_res.json()
    assert project["id"].startswith("prj_")
    assert "acme-saas" in project["slug"]
    assert project["is_published"] is False
    assert project["published_version"] == 0
    project_id = project["id"]

    # 2. Retrieve draft config
    draft_res = client.get(f"/api/v1/projects/{project_id}/draft", headers=headers)
    assert draft_res.status_code == 200
    config = draft_res.json()
    assert config["brand_name"] == "Acme SaaS"
    assert config["primary_color"] == "#4F46E5"

    # 3. Update draft config via Visual Builder
    update_res = client.put(
        f"/api/v1/projects/{project_id}/draft",
        headers=headers,
        json={
            "brand_name": "Acme Cloud",
            "page_title": "Sign In to Acme Cloud",
            "primary_color": "#10B981",
            "secondary_color": "#059669",
            "background_color": "#F0FDF4",
            "card_background_color": "#FFFFFF",
            "text_color": "#064E3B",
            "theme_mode": "light",
            "template_name": "startup",
            "layout_style": "card",
            "form_width": "md",
            "form_alignment": "center",
            "button_style": "pill",
            "input_style": "outline",
            "font_family": "Poppins",
            "border_radius": 16,
            "welcome_message": "Welcome to Acme Cloud! Let's get building.",
            "login_text": "Access your workspace",
            "register_text": "Create your Acme Cloud account",
            "email_label": "Work Email",
            "password_label": "Secure Password",
            "footer_text": "Protected by AuthCraft Enterprise",
            "show_password_toggle": True,
            "show_forgot_password": True,
            "show_registration": True,
        },
    )
    assert update_res.status_code == 200
    updated_config = update_res.json()
    assert updated_config["brand_name"] == "Acme Cloud"
    assert updated_config["primary_color"] == "#10B981"
    assert updated_config["button_style"] == "pill"

    # 4. Check that public hosted resolver still returns "unpublished" prior to publishing
    pub_check = client.get(f"/api/v1/public/projects/{project['slug']}/config")
    assert pub_check.status_code == 200
    assert pub_check.json()["status"] == "unpublished"

    # 5. Publish the project
    publish_res = client.post(f"/api/v1/projects/{project_id}/publish", headers=headers)
    assert publish_res.status_code == 200
    published_proj = publish_res.json()
    assert published_proj["is_published"] is True
    assert published_proj["published_version"] == 1

    # 6. Now public hosted config returns "ready" with our customized branding
    pub_ready = client.get(f"/api/v1/public/projects/{project['slug']}/config")
    assert pub_ready.status_code == 200
    ready_data = pub_ready.json()
    assert ready_data["status"] == "ready"
    assert ready_data["brand_name"] == "Acme Cloud"
    assert ready_data["primary_color"] == "#10B981"


def test_project_ownership_isolation(client):
    # Dev A creates a project
    token_a = get_dev_token(client, email="dev.a@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    create_res = client.post(
        "/api/v1/projects",
        headers=headers_a,
        json={"name": "Dev A Secret Project"},
    )
    assert create_res.status_code == 201
    proj_a_id = create_res.json()["id"]

    # Dev B logs in
    token_b = get_dev_token(client, email="dev.b@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Dev B attempts to read Dev A's project
    get_res = client.get(f"/api/v1/projects/{proj_a_id}", headers=headers_b)
    assert get_res.status_code == 404

    # Dev B attempts to modify Dev A's project
    update_res = client.put(
        f"/api/v1/projects/{proj_a_id}",
        headers=headers_b,
        json={"name": "Hacked Name"},
    )
    assert update_res.status_code == 404

    # Dev B attempts to delete Dev A's project
    del_res = client.delete(f"/api/v1/projects/{proj_a_id}", headers=headers_b)
    assert del_res.status_code == 404
