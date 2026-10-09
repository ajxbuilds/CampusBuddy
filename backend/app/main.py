from dotenv import load_dotenv
load_dotenv(override=True)
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.settings_service import get_setting
from app.core.database import AsyncSessionLocal
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
import app.models # ensure all models are registered

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
    # Startup: Ensure upload directory exists
    upload_root = (
    "/tmp/uploads"
    if os.getenv("VERCEL")
    else settings.UPLOAD_DIR
)
os.makedirs(upload_root, exist_ok=True)
    # Automatically create tables in database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'UPVOTE'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE community_posts ADD COLUMN downvotes_count INTEGER DEFAULT 0"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE community_answers ADD COLUMN downvotes_count INTEGER DEFAULT 0"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR DEFAULT 'local'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN provider_user_id VARCHAR"))
        except Exception:
            pass
    yield
    # Shutdown: Dispose engine
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusBuddy Full-Stack College Community & Complaint Resolution Platform",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS Middleware

@app.middleware("http")
async def maintenance_mode_middleware(request: Request, call_next):
    # Exclude admin routes, auth login, and health endpoints so admins aren't locked out
    path = request.url.path
    if not path.startswith("/api/admin") and not path.startswith("/api/auth/") and not path.startswith("/health"):
        async with AsyncSessionLocal() as db:
            maintenance = await get_setting(db, "maintenance_mode")
            if maintenance is True:
                # Need to return JSON response for middleware
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=503,
                    content={"detail": "CampusBuddy is currently in maintenance mode. Please try again later."}
                )
    return await call_next(request)

app.add_middleware(

    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory is ensured to exist, but NOT mounted statically for security.
upload_root = (
    "/tmp/uploads"
    if os.getenv("VERCEL")
    else "uploads"
)
os.makedirs(os.path.join(upload_root, "complaints"), exist_ok=True)
os.makedirs(os.path.join(upload_root, "community"), exist_ok=True)

# Include API Routers
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
        "database": "connected"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to CampusBuddy API. Visit /docs for Swagger documentation."
    }

# Trigger reload
