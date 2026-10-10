import json
import os
from typing import Union, List, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "ScrapSetu"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "info"
    DEBUG: bool = True

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:5173", "*"]

    # Secret key for QR cryptographic signing
    SECRET_KEY: str = "scrapsetutokensecretkey2026circularintelligence"

    # AWS Configuration
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "scrapsetudb-scrap-images"
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [x.strip() for x in v_stripped.split(",") if x.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
