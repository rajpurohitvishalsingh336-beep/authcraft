from fastapi import APIRouter

from app.api.v1.admin_metrics import router as admin_router
from app.api.v1.developer_auth import router as dev_auth_router
from app.api.v1.hosted_auth import router as hosted_auth_router
from app.api.v1.project_config import router as project_config_router
from app.api.v1.projects import router as projects_router

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
