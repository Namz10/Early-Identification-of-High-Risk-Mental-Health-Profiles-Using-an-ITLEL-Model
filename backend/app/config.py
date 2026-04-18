from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"
    LOGIN_RATE_LIMIT: str = "5/minute"
    COOKIE_SECURE: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
