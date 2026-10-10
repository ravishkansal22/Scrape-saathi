import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "ScrapSetu"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "info"
    DEBUG: bool = True

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "*"]

    # Secret key for QR cryptographic signing
    SECRET_KEY: str = "scrapsetutokensecretkey2026circularintelligence"

    # AWS Configuration
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "scrapsetudb-scrap-images"
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
