import logging
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from botocore.exceptions import BotoCoreError, ClientError
from app.config import settings
from app.api import triage
from app.platform.api import router as workflow
from app.platform.fleet import router as fleet
from app.platform.auth import actor
from app.services.ai_triage import InvalidTriageInput, TriageUnavailable, InvalidVisionResponse

logging.basicConfig(level=settings.LOG_LEVEL.upper(), format='%(asctime)s %(levelname)s %(name)s %(message)s')
app = FastAPI(title=settings.APP_NAME, version='3.0.0', description='Persistent, authenticated scrap handovers and recovery records')
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in settings.CORS_ORIGINS.split(',') if s.strip()],
                   allow_credentials=False, allow_methods=['GET', 'POST', 'PUT', 'OPTIONS'],
                   allow_headers=['Authorization', 'Content-Type', 'Idempotency-Key'])
# Legacy in-memory mutation routers are intentionally not mounted.
app.include_router(triage.router, dependencies=[Depends(actor)])
app.include_router(workflow)
app.include_router(fleet)

@app.exception_handler(InvalidTriageInput)
async def invalid_image(request: Request, error: InvalidTriageInput):
    return JSONResponse(status_code=422, content={'detail': str(error)})

@app.exception_handler(TriageUnavailable)
async def unavailable(request: Request, error: TriageUnavailable):
    return JSONResponse(status_code=503, content={'detail': str(error)})

@app.exception_handler(InvalidVisionResponse)
async def invalid_model(request: Request, error: InvalidVisionResponse):
    return JSONResponse(status_code=502, content={'detail': str(error)})

async def aws_error(request: Request, error):
    logging.getLogger('scrapsetu').warning('AWS operation failed: %s', type(error).__name__)
    return JSONResponse(status_code=503, content={'detail': 'AWS service unavailable. Check configuration, permissions and region; retry with the same operation ID.'})
app.add_exception_handler(BotoCoreError, aws_error)
app.add_exception_handler(ClientError, aws_error)

@app.get('/')
def root():
    return {'app': settings.APP_NAME, 'version': '3.0.0', 'status': 'online', 'docs': '/docs'}

@app.get('/health')
def health():
    return {'status': 'healthy', 'version': '3.0.0', 'environment': settings.APP_ENV,
            'storage': settings.STORE_BACKEND, 'auth': settings.AUTH_MODE, 'aws_inference_verified': False}

from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_error(request, error):
    return JSONResponse(status_code=422, content={"detail": [{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in error.errors()]})
