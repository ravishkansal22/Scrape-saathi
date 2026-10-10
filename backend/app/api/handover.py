from fastapi import APIRouter, HTTPException
from app.schemas.handover import (
    DigitalWasteLot,
    DigitalWasteLotCreate,
    HandoverQRGenerateRequest,
    HandoverQRGenerateResponse,
    HandoverVerifyRequest,
    EPRReceiptResponse,
)
from app.services.handover import handover_service

router = APIRouter(prefix="/api/v1", tags=["Digital Waste Lots & Dual-Key Handover"])

@router.post("/lots/create", response_model=DigitalWasteLot)
def create_digital_waste_lot(req: DigitalWasteLotCreate):
    """Creates a digital waste lot token with spatial recycler permit matching."""
    try:
        return handover_service.create_lot(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lot Creation Error: {str(e)}")

@router.get("/lots/{lot_id}", response_model=DigitalWasteLot)
def get_digital_waste_lot(lot_id: str):
    """Retrieves digital waste lot details by UUID."""
    try:
        return handover_service.get_lot(lot_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Lot Not Found: {str(e)}")

@router.post("/handover/generate-qr", response_model=HandoverQRGenerateResponse)
def generate_handover_qr_code(req: HandoverQRGenerateRequest):
    """Generates a cryptographically signed dynamic QR code payload for collector handover."""
    try:
        return handover_service.generate_handover_qr(req.lot_id, req.collector_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR Generation Error: {str(e)}")

@router.post("/handover/verify", response_model=EPRReceiptResponse)
def verify_dual_key_handover(req: HandoverVerifyRequest):
    """Scans and verifies signed QR token, updates lot status to RECEIVED, and issues EPR compliance receipt."""
    try:
        return handover_service.verify_handover(
            req.qr_token, req.recycler_id, req.scanned_latitude, req.scanned_longitude
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification Failed: {str(e)}")
