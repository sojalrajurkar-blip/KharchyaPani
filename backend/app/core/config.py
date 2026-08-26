from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    DATABASE_URL: str = "postgresql://postgres:password@127.0.0.1:5432/kharchyapani_db"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "password"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000"
    CONTACT_NAME: str = "KharchyaPani Support"
    CONTACT_EMAIL: str = "support@kharchyapani.local"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v:
                return []
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
