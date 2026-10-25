import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def get_auth_token():
    """Helper to register and login a test developer."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"workflow.tester.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Automation Engineer"},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


def test_workflow_engine_full_lifecycle():
    """Verify templates, workflow creation, execution, and step logs."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch templates
    tpl_resp = client.get("/api/v1/workflows/templates")
    assert tpl_resp.status_code == 200
    templates = tpl_resp.json()
    assert len(templates) >= 3
    selected_tpl = templates[0]

    # 2. Create workflow from blueprint template
    create_resp = client.post(
        "/api/v1/workflows",
        json={
            "name": "Production Onboarding Auto-Flow",
            "template_id": selected_tpl["id"],
        },
        headers=headers,
    )
    assert create_resp.status_code == 201
    wf = create_resp.json()
    assert wf["name"] == "Production Onboarding Auto-Flow"
    assert len(wf["definition"]["nodes"]) == len(selected_tpl["nodes"])
    workflow_id = wf["id"]

    # 3. Trigger execution run
    run_resp = client.post(f"/api/v1/workflows/{workflow_id}/run", headers=headers)
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["status"] == "completed"
    assert len(run_data["logs"]) == len(selected_tpl["nodes"])
    for step_log in run_data["logs"]:
        assert step_log["status"] == "success"
        assert "verified" in step_log["output"]

    # 4. Fetch execution history
    hist_resp = client.get(f"/api/v1/workflows/{workflow_id}/executions", headers=headers)
    assert hist_resp.status_code == 200
    executions = hist_resp.json()
    assert len(executions) >= 1
    assert executions[0]["id"] == run_data["execution_id"]
