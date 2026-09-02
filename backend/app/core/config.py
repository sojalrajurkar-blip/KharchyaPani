from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"
    APP_PORT: int = 8000
    DATABASE_URL: str = "postgresql://postgres:password@127.0.0.1:5432/kharchyapani_db"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"
    CONTACT_NAME: str = "KharchyaPani Support"
    CONTACT_EMAIL: str = "support@kharchyapani.local"

    # JWT & Auth Security Settings
    JWT_SECRET_KEY: str = "kharchyapani-super-secure-jwt-secret-key-production-change-me-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    RATE_LIMIT_ENABLED: bool = True

    # Email Settings (SMTP for Local Development, Resend for Production)
    EMAIL_PROVIDER: str = "auto"  # "auto", "smtp", or "resend"
    EMAIL_FROM: str = "noreply@kharchyapani.com"
    EMAIL_FROM_NAME: str = "KharchyaPani"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    RESEND_API_KEY: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v:
                return []
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def get_effective_email_provider(self) -> str:
        """Determines active email provider based on configuration."""
        provider = self.EMAIL_PROVIDER.lower().strip()
        if provider in ("smtp", "resend"):
            return provider
        if self.RESEND_API_KEY or self.APP_ENV.lower() == "production":
            return "resend"
        return "smtp"

settings = Settings()
