from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaMailer"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Database URL - supports SQLite, PostgreSQL, MySQL
    # Railway provides DATABASE_URL automatically for PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///./novamailer.db"
    # CORS origins - comma-separated list
    CORS_ORIGINS: str = "http://localhost:3000"
    # Frontend URL for email links
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    def get_database_url(self) -> str:
        """Convert DATABASE_URL to async version if needed"""
        url = self.DATABASE_URL
        # Railway PostgreSQL URL starts with postgres://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        # Always allow frontend URL
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

settings = Settings()
