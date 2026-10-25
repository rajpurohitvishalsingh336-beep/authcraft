import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def setup_dev_and_project():
    """Helper to register developer and create a project."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"security.tester.{unique_suffix}@example.com"
    password = "SecurePassword123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Security Officer"},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj_resp = client.post(
        "/api/v1/projects",
        json={"name": f"Secured Project {unique_suffix}"},
        headers=headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    return token, headers, project_id


def test_security_center_lifecycle():
    token, headers, project_id = setup_dev_and_project()

    # 1. Check posture score
    posture_resp = client.get(f"/api/v1/security/posture?project_id={project_id}", headers=headers)
    assert posture_resp.status_code == 200
    posture = posture_resp.json()
    assert posture["score"] >= 90
    assert len(posture["checklist"]) >= 4

    # 2. Report incident
    inc_payload = {
        "project_id": project_id,
        "severity": "high",
        "incident_type": "brute_force_spike",
        "title": "Anomalous Login Attempt Burst from 198.51.100.42",
        "description": "Detected 15 consecutive invalid password submissions in 30 seconds.",
    }
    report_resp = client.post("/api/v1/security/incidents", json=inc_payload, headers=headers)
    assert report_resp.status_code == 201
    incident = report_resp.json()
    assert incident["status"] == "open"
    incident_id = incident["id"]

    # 3. List incidents
    list_resp = client.get(f"/api/v1/security/incidents?project_id={project_id}", headers=headers)
    assert list_resp.status_code == 200
    incidents = list_resp.json()
    assert len(incidents) >= 1
    assert incidents[0]["id"] == incident_id

    # 4. Resolve incident
    resolve_resp = client.put(
        f"/api/v1/security/incidents/{incident_id}",
        json={"status": "resolved", "resolution_notes": "Origin rate-limited; IP quarantined for 2 hours."},
        headers=headers,
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"
    assert resolve_resp.json()["resolved_by"] is not None

    # 5. List sessions
    sess_resp = client.get(f"/api/v1/security/sessions?project_id={project_id}", headers=headers)
    assert sess_resp.status_code == 200
    assert isinstance(sess_resp.json(), list)
