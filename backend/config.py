import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database - Railway sets DATABASE_URL automatically
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./station_ops.db")
    
    # Security - Use environment variable in production
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    
    # CORS - simple string that we'll split
    cors_origins_str: str = os.getenv("CORS_ORIGINS_STR", "http://localhost:3000,http://127.0.0.1:3000")
    
    # API
    api_v1_str: str = "/api/v1"
    
    # Environment
    environment: str = "development"
    
    @property
    def cors_origins(self) -> List[str]:
        return self.cors_origins_str.split(",")
    
    class Config:
        case_sensitive = False
        env_file = ".env"


settings = Settings()