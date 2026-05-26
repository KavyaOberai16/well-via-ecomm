from functools import lru_cache
from typing import List
from urllib.parse import quote_plus

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Ecommerce API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = False

    # SECRET_KEY also seeds the PASETO v4.local symmetric key (see core/security.py).
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    MYSQL_HOST: str
    MYSQL_PORT: int = 3306
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_DB: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    REDIS_URL: str = "redis://redis:6379/0"

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    STRIPE_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@example.com"

    # Image storage. STORAGE_BACKEND: "local" (dev) or "s3" (AWS S3 / DO Spaces).
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "uploads"
    MEDIA_BASE_URL: str = "http://localhost:8000"
    MAX_IMAGE_SIZE_MB: int = 15
    MAX_PRODUCT_IMAGES: int = 8

    # S3 / DigitalOcean Spaces (both S3-compatible — Spaces just needs an endpoint).
    S3_ENDPOINT_URL: str = ""
    S3_REGION: str = ""
    S3_BUCKET: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_PUBLIC_BASE_URL: str = ""

    # Email — "console" (dev: logs the message) or "smtp" (real delivery).
    EMAIL_BACKEND: str = "console"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    OTP_TTL_MINUTES: int = 10

    # Google OAuth (server-side redirect flow). Blank client id disables it.
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        user = quote_plus(self.MYSQL_USER)
        password = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{user}:{password}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
