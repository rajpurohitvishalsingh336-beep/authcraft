from fastapi import APIRouter

from app.api.v1.admin_metrics import router as admin_router
from app.api.v1.developer_auth import router as dev_auth_router
from app.api.v1.developer_platform import router as dev_platform_router
from app.api.v1.hosted_auth import router as hosted_auth_router
from app.api.v1.presentations import router as presentations_router
from app.api.v1.project_config import router as project_config_router
from app.api.v1.projects import router as projects_router
from app.api.v1.security_center import router as security_router
from app.api.v1.super_admin import router as super_admin_router
from app.api.v1.workflows import router as workflows_router

api_router = APIRouter()

# Developer account authentication
api_router.include_router(dev_auth_router, prefix="/auth", tags=["Developer Authentication"])

# Project management & configuration
api_router.include_router(projects_router, prefix="/projects", tags=["Project Management"])
api_router.include_router(project_config_router, prefix="/projects", tags=["Project Customization & Themes"])

# Hosted End-User Auth & Public Resolver
api_router.include_router(hosted_auth_router, tags=["Hosted End-User Authentication"])

# Project Analytics, Users & Audit Events
api_router.include_router(admin_router, tags=["Project Management & Audit"])

# AI Presentation Studio
api_router.include_router(presentations_router, prefix="/presentations", tags=["AI Presentation Studio"])

# Interactive Workflow Automation Engine
api_router.include_router(workflows_router, prefix="/workflows", tags=["Workflow Automation Engine"])

# Developer Platform: API Keys & Webhooks
api_router.include_router(dev_platform_router, prefix="/developer", tags=["Developer Platform & APIs"])

# Security Intelligence & Threat Radar
api_router.include_router(security_router, prefix="/security", tags=["Security Intelligence Center"])

# Private Super Admin Console (Isolated Authentication & Operations)
api_router.include_router(super_admin_router, prefix="/super-admin", tags=["Private Super Admin Console"])





