import json
import os
import re
import pytest

from app.models.project import Project
from app.models.project_config import ProjectConfiguration


def get_token_for(client, email, password="Password123!"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "V2 Tester"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return res.json()["access_token"]


def test_150_layout_catalog_integrity():
    """Verify that the frontend catalog contains exactly 150 distinct layouts with proper categories and tokens."""
    candidates = [os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "lib", "layouts", "catalog.ts")), os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "lib", "layouts", "catalog.ts"))]
    catalog_path = next((c for c in candidates if os.path.exists(c)), candidates[0])
    assert os.path.exists(catalog_path), f"catalog.ts not found at {catalog_path}"

    with open(catalog_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all layout IDs
    id_matches = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", content)
    # The first matches might be category IDs ('minimal', 'luxury', etc.), filter for layout entries
    layout_ids = [lid for lid in id_matches if "-" in lid and any(c.isdigit() for c in lid)]

    assert len(layout_ids) == 150, f"Expected 150 layout IDs, found {len(layout_ids)}"
    assert len(set(layout_ids)) == 150, f"Duplicate layout IDs found: {len(layout_ids) - len(set(layout_ids))}"

    # Category counts
    expected_categories = {
        "minimal-clean": 15,
        "luxury-premium": 15,
        "modern-saas": 15,
        "corporate-prof": 15,
        "glassmorphism": 10,
        "dark-elegant": 10,
        "gradient-color": 10,
        "split-screen": 10,
        "startup-dev": 10,
        "ecommerce-retail": 10,
        "creative-portfolio": 10,
        "education-community": 10,
        "editorial-typo": 5,
        "compact-mobile": 5,
    }

    for prefix, count in expected_categories.items():
        matched = [lid for lid in layout_ids if lid.startswith(prefix)]
        assert len(matched) == count, f"Category prefix '{prefix}': expected {count}, got {len(matched)}"

    # Check for luxury and distinct family properties in catalog
    assert "The Sovereign Crest" in content
    assert "Monaco Private Wealth" in content
    assert "Linear Obsidian Dark" in content
    assert "Stripe Aurora Flow" in content
    assert "Matrix Terminal Bash CLI" in content
    assert "The Broadsheet Morning Edition" in content


def test_developer_registration_auto_provisions_starter_workspace(client):
    """Verify that developer registration automatically provisions a starter workspace to eliminate empty states."""
    email = "starter.workspace.dev@example.com"
    token = get_token_for(client, email)
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch projects
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1

    starter = projects[0]
    assert "Starter Workspace" in starter["name"] or "Workspace" in starter["name"]
    assert starter["status"] == "active"
    assert starter["hosted_login_url"].startswith("http")

    # Verify initial draft config is attached
    draft_res = client.get(f"/api/v1/projects/{starter['id']}/draft", headers=headers)
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["brand_name"] == starter["name"]
    assert draft["layout_id"] == "minimal-clean-01"


def test_project_duplication_endpoint(client):
    """Verify that POST /api/v1/projects/{project_id}/duplicate clones the project and its layout tokens."""
    token = get_token_for(client, "duplicate.dev@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create base project
    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Luxury Portal", "description": "High net-worth client portal"},
    )
    assert create_res.status_code == 201
    source = create_res.json()
    source_id = source["id"]

    # Customize draft with luxury tokens
    client.put(
        f"/api/v1/projects/{source_id}/draft",
        headers=headers,
        json={
            "brand_name": "Luxury Private Salon",
            "page_title": "Private Client Access",
            "primary_color": "#D97706",
            "layout_id": "luxury-premium-01",
            "layout_tokens": {
                "theme": "luxury",
                "accentColor": "#D97706",
                "fontFamily": "serif",
                "decorations": "gold-border",
            },
        },
    )

    # Duplicate project
    dup_res = client.post(f"/api/v1/projects/{source_id}/duplicate", headers=headers)
    assert dup_res.status_code == 201
    duplicate = dup_res.json()

    assert duplicate["id"] != source_id
    assert duplicate["id"].startswith("prj_")
    assert duplicate["name"] == "Luxury Portal (Copy)"
    assert duplicate["is_published"] is False
    assert duplicate["published_version"] == 0

    # Verify duplicated draft configuration
    dup_draft_res = client.get(f"/api/v1/projects/{duplicate['id']}/draft", headers=headers)
    assert dup_draft_res.status_code == 200
    dup_draft = dup_draft_res.json()
    assert dup_draft["layout_id"] == "luxury-premium-01"
    assert dup_draft["primary_color"] == "#D97706"
    assert dup_draft["layout_tokens"]["decorations"] == "gold-border"


def test_project_config_export_and_import(client):
    """Verify exporting and importing project layout configuration JSON."""
    token = get_token_for(client, "export_import.dev@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Export Demo App"},
    )
    assert create_res.status_code == 201
    project = create_res.json()
    proj_id = project["id"]

    # Export configuration
    export_res = client.get(f"/api/v1/projects/{proj_id}/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()

    assert export_data["export_version"] == "2.0"
    assert "configuration" in export_data
    assert export_data["configuration"]["brand_name"] == "Export Demo App"

    # Modify and import into another project
    target_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Import Target App"},
    )
    target_id = target_res.json()["id"]

    modified_payload = {
        "configuration": {
            **export_data["configuration"],
            "brand_name": "Imported Terminal App",
            "page_title": "Developer Shell Gateway",
            "primary_color": "#22C55E",
            "layout_id": "startup-dev-01",
            "layout_tokens": {
                "theme": "dark",
                "accentColor": "#22C55E",
                "fontFamily": "mono",
                "decorations": "terminal-bar",
            },
        }
    }

    import_res = client.post(
        f"/api/v1/projects/{target_id}/import",
        headers=headers,
        json=modified_payload,
    )
    assert import_res.status_code == 200
    imported_result = import_res.json()
    assert imported_result["brand_name"] == "Imported Terminal App"
    assert imported_result["layout_id"] == "startup-dev-01"
    assert imported_result["primary_color"] == "#22C55E"

    # Verify persisted in draft
    draft_check = client.get(f"/api/v1/projects/{target_id}/draft", headers=headers)
    assert draft_check.status_code == 200
    assert draft_check.json()["brand_name"] == "Imported Terminal App"


def test_public_hosted_config_serves_v2_tokens(client):
    """Verify that public hosted endpoints return layout_id and layout_tokens for dynamic layout rendering."""
    token = get_token_for(client, "public.v2.dev@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Sovereign Vault App"},
    )
    project = create_res.json()
    proj_id = project["id"]
    slug = project["slug"]

    # Configure luxury layout
    client.put(
        f"/api/v1/projects/{proj_id}/draft",
        headers=headers,
        json={
            "brand_name": "Sovereign Vault",
            "page_title": "Vault Access Portal",
            "primary_color": "#D97706",
            "layout_id": "luxury-premium-01",
            "layout_tokens": {"theme": "luxury", "badge": {"text": "PRIVATE VAULT", "variant": "gold"}},
        },
    )

    # Publish project
    pub_res = client.post(f"/api/v1/projects/{proj_id}/publish", headers=headers)
    assert pub_res.status_code == 200

    # Fetch public config
    pub_config_res = client.get(f"/api/v1/public/projects/{slug}/config")
    assert pub_config_res.status_code == 200
    pub_config = pub_config_res.json()

    assert pub_config["status"] == "ready"
    assert pub_config["layout_id"] == "luxury-premium-01"
    assert pub_config["layout_tokens"]["badge"]["text"] == "PRIVATE VAULT"
    assert pub_config["primary_color"] == "#D97706"
