import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import triage, valuation, handover, recyclers, fleet

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("scrapsetu.main")

app = FastAPI(
    title=settings.APP_NAME,
    description="ScrapSetu — AI-Driven Circular Economy & Resource Intelligence Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(triage.router)
app.include_router(valuation.router)
app.include_router(handover.router)
app.include_router(recyclers.router)
app.include_router(fleet.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "architecture": "AWS Serverless (FastAPI / Mangum / Bedrock / PostGIS / IoT Core)"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.APP_ENV}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
