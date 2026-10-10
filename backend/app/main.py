import sys
from pathlib import Path

# Ensure root backend directory is in sys.path so 'app' module imports resolve correctly
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import triage, pricing, handover, transactions, vendor, recyclers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("scrapsetu.main")

app = FastAPI(
    title=settings.APP_NAME,
    description="ScrapSetu — AI-Powered Waste Segregation, Fair Transactions & End-to-End Traceability Platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Domain API Routers
app.include_router(triage.router)
app.include_router(pricing.router)
app.include_router(handover.router)
app.include_router(transactions.router)
app.include_router(vendor.router)
app.include_router(recyclers.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "description": "AI-Powered Waste Segregation, Fair Transactions & End-to-End Traceability",
        "subsystems": [
            "AI Waste Classification & Segregation (7 Categories)",
            "Fair Reference Pricing Catalog",
            "Digital Waste Lots & Custody Tracking",
            "Traceable Transactions & Dual-Key Payment Ledger",
            "Vendor Portal (Physical Inspection, Scale Weights & Warehouse Inventory)",
            "Authorized Recycler Portal & Final Outcome Recovery Certificates",
            "Full Chain-of-Custody Traceability"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.APP_ENV, "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True, app_dir=str(BACKEND_DIR))
