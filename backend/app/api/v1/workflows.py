import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_developer
from app.core.database import get_db
from app.models.developer import Developer
from app.models.workflow import Workflow, WorkflowExecution
from app.services.workflow_engine import WorkflowEngine

router = APIRouter()


class WorkflowCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    project_id: Optional[str] = None
    trigger_type: str = Field("manual", max_length=50)
    status: str = Field("active", max_length=20)
    template_id: Optional[str] = None
    definition_json: Optional[str] = None


class WorkflowUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    definition_json: Optional[str] = None


def format_workflow_response(workflow: Workflow, include_executions: bool = False) -> Dict[str, Any]:
    resp = {
        "id": workflow.id,
        "name": workflow.name,
        "description": workflow.description,
        "project_id": workflow.project_id,
        "trigger_type": workflow.trigger_type,
        "status": workflow.status,
        "definition": json.loads(workflow.definition_json) if workflow.definition_json else {"nodes": [], "edges": []},
        "execution_count": len(workflow.executions) if workflow.executions else 0,
        "created_at": workflow.created_at.isoformat() if workflow.created_at else None,
        "updated_at": workflow.updated_at.isoformat() if workflow.updated_at else None,
    }
    if include_executions and workflow.executions:
        resp["recent_executions"] = [
            {
                "id": ex.id,
                "status": ex.status,
                "duration_ms": ex.duration_ms,
                "trigger_event": ex.trigger_event,
                "started_at": ex.started_at.isoformat() if ex.started_at else None,
                "completed_at": ex.completed_at.isoformat() if ex.completed_at else None,
                "logs": json.loads(ex.logs_json) if ex.logs_json else [],
            }
            for ex in workflow.executions[:10]
        ]
    return resp


@router.get("/templates", tags=["Workflow Automation Engine"])
def get_workflow_templates():
    """Retrieve predefined enterprise workflow blueprints."""
    return WorkflowEngine.get_preset_templates()


@router.get("", tags=["Workflow Automation Engine"])
def list_workflows(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """List all automated workflows owned by current developer."""
    query = db.query(Workflow).filter(Workflow.developer_id == current_dev.id)
    if project_id:
        query = query.filter(Workflow.project_id == project_id)

    workflows = query.order_by(Workflow.updated_at.desc()).all()
    return [format_workflow_response(w) for w in workflows]


@router.post("", tags=["Workflow Automation Engine"], status_code=status.HTTP_201_CREATED)
def create_workflow(
    payload: WorkflowCreateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Create a new workflow from a blueprint or custom node graph."""
    definition_str = payload.definition_json
    trigger = payload.trigger_type

    # If template_id supplied, populate definition from blueprint
    if payload.template_id:
        templates = WorkflowEngine.get_preset_templates()
        matched = next((t for t in templates if t["id"] == payload.template_id), None)
        if matched:
            definition_str = json.dumps({"nodes": matched["nodes"], "edges": matched["edges"]})
            trigger = matched["trigger_type"]
            if not payload.name:
                payload.name = matched["name"]
            if not payload.description:
                payload.description = matched["description"]

    if not definition_str:
        definition_str = json.dumps({"nodes": [], "edges": []})

    workflow = Workflow(
        developer_id=current_dev.id,
        project_id=payload.project_id,
        name=payload.name,
        description=payload.description,
        trigger_type=trigger,
        status=payload.status,
        definition_json=definition_str,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return format_workflow_response(workflow)


@router.get("/{workflow_id}", tags=["Workflow Automation Engine"])
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Get full workflow graph structure and recent execution runs."""
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.developer_id == current_dev.id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    return format_workflow_response(workflow, include_executions=True)


@router.put("/{workflow_id}", tags=["Workflow Automation Engine"])
def update_workflow(
    workflow_id: str,
    payload: WorkflowUpdateRequest,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Update workflow name, status, or node/edge graph definition."""
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.developer_id == current_dev.id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    if payload.name is not None:
        workflow.name = payload.name
    if payload.description is not None:
        workflow.description = payload.description
    if payload.status is not None:
        workflow.status = payload.status
    if payload.definition_json is not None:
        workflow.definition_json = payload.definition_json

    db.commit()
    db.refresh(workflow)
    return format_workflow_response(workflow)


@router.delete("/{workflow_id}", tags=["Workflow Automation Engine"])
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Delete a workflow and its execution audit logs."""
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.developer_id == current_dev.id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}


@router.post("/{workflow_id}/run", tags=["Workflow Automation Engine"])
def run_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Trigger an execution run of the workflow graph."""
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.developer_id == current_dev.id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    execution = WorkflowEngine.execute_workflow(workflow, db)

    return {
        "execution_id": execution.id,
        "workflow_id": workflow.id,
        "status": execution.status,
        "duration_ms": execution.duration_ms,
        "started_at": execution.started_at.isoformat(),
        "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
        "logs": json.loads(execution.logs_json) if execution.logs_json else [],
    }


@router.get("/{workflow_id}/executions", tags=["Workflow Automation Engine"])
def get_workflow_executions(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer),
):
    """Fetch all execution audit logs for a workflow."""
    workflow = (
        db.query(Workflow)
        .filter(Workflow.id == workflow_id, Workflow.developer_id == current_dev.id)
        .first()
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    executions = (
        db.query(WorkflowExecution)
        .filter(WorkflowExecution.workflow_id == workflow.id)
        .order_by(WorkflowExecution.started_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": ex.id,
            "status": ex.status,
            "duration_ms": ex.duration_ms,
            "trigger_event": ex.trigger_event,
            "started_at": ex.started_at.isoformat(),
            "completed_at": ex.completed_at.isoformat() if ex.completed_at else None,
            "logs": json.loads(ex.logs_json) if ex.logs_json else [],
        }
        for ex in executions
    ]
