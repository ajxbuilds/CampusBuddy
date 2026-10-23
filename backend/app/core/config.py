import json
import os
from typing import List, Any
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Load .env from cwd or backend/.env if present
load_dotenv()
_backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusBuddy"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-only-fallback-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database: Async SQLite fallback by default for instant evaluation, or Postgres if DATABASE_URL is set
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./campusbuddy.db"
    )

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://campus-buddy-xi-tan.vercel.app",
        "https://campus-buddy-1zpk8ccv8-ajinkya-ef89.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        return v

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = 10

    # AI Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # auto, gemini, openai, mock
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Google OAuth 2.0 Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/auth/google/callback"
    )


    # Email / SMTP Configuration
    SMTP_ENABLED: str = "false"
    SMTP_HOST: str = ""
    SMTP_PORT: str = "587"
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = ""
    SMTP_USE_TLS: str = "true"


    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.is_production and (not self.SECRET_KEY or self.SECRET_KEY == "dev-only-fallback-secret-key"):
            raise ValueError("SECRET_KEY must be explicitly configured in production environment!")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
