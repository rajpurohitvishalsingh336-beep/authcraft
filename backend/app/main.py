import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from app.api.v1.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("authcraft")


def auto_migrate_schema(db_engine):
    """Ensure newly added columns exist in database tables automatically."""
    try:
        inspector = inspect(db_engine)
        if inspector.has_table("project_configurations"):
            cols = [c["name"] for c in inspector.get_columns("project_configurations")]
            with db_engine.connect() as conn:
                if "layout_id" not in cols:
                    conn.execute(text("ALTER TABLE project_configurations ADD COLUMN layout_id VARCHAR(50) DEFAULT 'minimal-clean-01'"))
                    conn.commit()
                    logger.info("Migrated project_configurations table: added layout_id column.")
                if "layout_tokens" not in cols:
                    conn.execute(text("ALTER TABLE project_configurations ADD COLUMN layout_tokens TEXT"))
                    conn.commit()
                    logger.info("Migrated project_configurations table: added layout_tokens column.")
                if "allow_otp_login" not in cols:
                    conn.execute(text("ALTER TABLE project_configurations ADD COLUMN allow_otp_login BOOLEAN DEFAULT 1"))
                    conn.commit()
                    logger.info("Migrated project_configurations table: added allow_otp_login column.")
        if inspector.has_table("projects"):
            cols = [c["name"] for c in inspector.get_columns("projects")]
            with db_engine.connect() as conn:
                if "allow_otp_login" not in cols:
                    conn.execute(text("ALTER TABLE projects ADD COLUMN allow_otp_login BOOLEAN DEFAULT 1"))
                    conn.commit()
                    logger.info("Migrated projects table: added allow_otp_login column.")
    except Exception as e:
        logger.warning(f"Auto-migration notice: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    logger.info("Initializing AuthCraft database schema...")
    Base.metadata.create_all(bind=engine)
    auto_migrate_schema(engine)
    logger.info("Database schema initialized and migrated successfully.")
    yield
    logger.info("AuthCraft backend shutting down.")


app = FastAPI(
    title="AuthCraft API",
    version=settings.VERSION,
    description="No-Code Authentication-as-a-Service Platform Backend API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
origins = list(settings.BACKEND_CORS_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System Health"])
def health_check():
    """Application health endpoint with live database connectivity verification."""
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "authcraft-backend",
        "version": settings.VERSION,
        "database": db_status,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["System Information"])
def root_info():
    """Service landing page and API documentation pointer."""
    return {
        "name": "AuthCraft API",
        "description": "No-Code Authentication-as-a-Service Platform",
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "status": "online",
    }


# Mount API V1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to prevent leaking sensitive stack traces in production."""
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
