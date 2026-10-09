
from dotenv import load_dotenv

load_dotenv()

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.services.settings_service import get_setting
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base

import app.models  # Ensure all models are registered

# Import routers
from app.api.auth import router as auth_router
from app.api.complaints import router as complaints_router
from app.api.escalations import router as escalations_router
from app.api.community import router as community_router
from app.api.gamification import router as gamification_router
from app.api.ai_assistant import router as ai_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router
from app.api.analytics import router as analytics_router
from app.api.study_buddy import router as study_buddy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure upload directories exist
    upload_root = (
        "/tmp/uploads"
        if os.getenv("VERCEL")
        else settings.UPLOAD_DIR
    )

    os.makedirs(os.path.join(upload_root, "complaints"), exist_ok=True)
    os.makedirs(os.path.join(upload_root, "community"), exist_ok=True)

    # Create database tables and apply existing column additions
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def run_migrations(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)

            # Map of table_name -> dict of column definitions to ensure
            migrations = {
                "votes": {"vote_type": "VARCHAR(10) DEFAULT 'UPVOTE'"},
                "community_posts": {"downvotes_count": "INTEGER DEFAULT 0"},
                "community_answers": {"downvotes_count": "INTEGER DEFAULT 0"},
                "users": {
                    "auth_provider": "VARCHAR DEFAULT 'local'",
                    "provider_user_id": "VARCHAR"
                },
                "student_profiles": {
                    "year": "VARCHAR",
                    "division": "VARCHAR",
                    "program": "VARCHAR DEFAULT 'B.Tech Computer Science'",
                    "skills": "VARCHAR",
                    "interests": "VARCHAR",
                    "help_areas": "VARCHAR",
                    "goals": "TEXT"
                }
            }

            for table_name, columns in migrations.items():
                if inspector.has_table(table_name):
                    existing_cols = [c["name"] for c in inspector.get_columns(table_name)]
                    for col_name, col_def in columns.items():
                        if col_name not in existing_cols:
                            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}"))

        await conn.run_sync(run_migrations)

    yield

    # Shutdown
    await engine.dispose()


# FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusBuddy Full-Stack College Community & Complaint Resolution Platform",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)


# Maintenance mode middleware
@app.middleware("http")
async def maintenance_mode_middleware(request: Request, call_next):
    path = request.url.path

    # Keep admin, authentication, and health endpoints accessible.
    if (
        not path.startswith("/api/admin")
        and not path.startswith("/api/auth/")
        and not path.startswith("/health")
    ):
        async with AsyncSessionLocal() as db:
            maintenance = await get_setting(db, "maintenance_mode")

            if maintenance is True:
                return JSONResponse(
                    status_code=503,
                    content={
                        "detail": (
                            "CampusBuddy is currently in maintenance mode. "
                            "Please try again later."
                        )
                    },
                )

    return await call_next(request)


# Normalize and deduplicate CORS origins
raw_origins = settings.BACKEND_CORS_ORIGINS + [settings.FRONTEND_URL]
cleaned_origins = []
for origin in raw_origins:
    if origin and origin.strip():
        cleaned_origins.append(origin.strip().rstrip("/"))

origins = list(set(cleaned_origins))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(escalations_router, prefix=settings.API_V1_STR)
app.include_router(community_router, prefix=settings.API_V1_STR)
app.include_router(gamification_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(study_buddy_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "database": "connected",
    }


@app.get("/")
async def root():
    return {
        "message": (
            "Welcome to CampusBuddy API. "
            "Visit /docs for Swagger documentation."
        )
    }
