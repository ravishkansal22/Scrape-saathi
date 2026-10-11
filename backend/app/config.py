from pathlib import Path
from typing import Literal
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[1]

from dotenv import load_dotenv
load_dotenv(BACKEND_ROOT / ".env", override=False)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BACKEND_ROOT / '.env'), extra='ignore')
    APP_NAME: str = 'ScrapSetu'
    APP_ENV: str = 'development'
    LOG_LEVEL: str = 'info'
    DEBUG: bool = False
    HOST: str = '127.0.0.1'
    PORT: int = 8001
    CORS_ORIGINS: str = 'http://localhost:5173,http://127.0.0.1:5173'
    FRONTEND_URL: str = 'http://localhost:5173'
    SECRET_KEY: str = ''
    DATA_DIR: str = str(BACKEND_ROOT / 'data')
    STORE_BACKEND: Literal['sqlite', 'dynamodb'] = 'sqlite'
    DYNAMODB_TABLE: str = ''
    AUTH_MODE: Literal['local', 'cognito'] = 'local'
    LOCAL_DEMO_PASSWORD: str = 'scrapsetu-local'
    COGNITO_USER_POOL_ID: str = ''
    COGNITO_CLIENT_ID: str = ''
    COGNITO_DOMAIN: str = ''
    AWS_REGION: str = 'us-east-1'
    AWS_S3_BUCKET: str = ''
    BEDROCK_MODEL_ID: str = 'amazon.nova-lite-v1:0'
    POLLY_ENABLED: bool = False
    LOCATION_ENABLED: bool = False
    AWS_IOT_ENDPOINT: str = ''
    AWS_IOT_TOPIC: str = 'scrapsetu/bins'
    LOG_RETENTION_DAYS: int = 7

    @model_validator(mode='after')
    def deployment_requirements(self):
        if self.STORE_BACKEND == 'dynamodb' and not self.DYNAMODB_TABLE:
            raise ValueError('DYNAMODB_TABLE is required for DynamoDB storage')
        if self.AUTH_MODE == 'cognito' and not (self.COGNITO_USER_POOL_ID and self.COGNITO_CLIENT_ID):
            raise ValueError('Cognito pool and client IDs are required')
        if self.APP_ENV == 'production':
            if self.AUTH_MODE != 'cognito' or len(self.SECRET_KEY) < 32:
                raise ValueError('Production requires Cognito and a unique SECRET_KEY of at least 32 characters')
            if self.STORE_BACKEND != 'dynamodb' or not self.AWS_S3_BUCKET:
                raise ValueError('Production requires DynamoDB and private S3 storage')
            if '*' in self.CORS_ORIGINS or not self.FRONTEND_URL.startswith('https://'):
                raise ValueError('Production requires explicit CORS origins and an HTTPS frontend')
        return self

settings = Settings()
