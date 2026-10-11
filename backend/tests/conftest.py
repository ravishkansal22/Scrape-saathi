import pytest
from app.config import settings

@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    for key,value in {'DATA_DIR':str(tmp_path),'SECRET_KEY':'test-only-secret-key-with-at-least-32-bytes','AUTH_MODE':'local','STORE_BACKEND':'sqlite','LOCAL_DEMO_PASSWORD':'scrapsetu-local','AWS_S3_BUCKET':'','POLLY_ENABLED':False,'LOCATION_ENABLED':False,'AWS_IOT_ENDPOINT':''}.items():
        monkeypatch.setattr(settings,key,value)
