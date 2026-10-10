from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.handover import (
    DigitalWasteLot,
    DigitalWasteLotCreate,
    HandoverQRGenerateRequest,
    HandoverQRGenerateResponse,
    QRVerificationResult,
)
from app.services.handover import handover_service

router = APIRouter(prefix="/api/v1", tags=["Digital Waste Lots & Handover QR"])

@router.post("/lots/create", response_model=DigitalWasteLot)
def create_waste_lot(req: DigitalWasteLotCreate):
    """Creates a new digital waste lot with physical scale measured weight or item count."""
    try:
        return handover_service.create_lot(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lot Creation Error: {str(e)}")

@router.get("/lots", response_model=List[DigitalWasteLot])
def get_all_lots():
    """Returns all active digital waste lots in the registry."""
    return handover_service.get_all_lots()

@router.get("/lots/{lot_id}", response_model=DigitalWasteLot)
def get_waste_lot_by_id(lot_id: str):
    """Retrieves a specific digital waste lot by UUID."""
    lot = handover_service.get_lot_by_id(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail=f"Lot {lot_id} not found.")
    return lot

@router.post("/handover/generate-qr", response_model=HandoverQRGenerateResponse)
def generate_handover_qr_code(req: HandoverQRGenerateRequest):
    """Generates an HMAC-SHA256 signed dynamic QR code for material handover."""
    try:
        return handover_service.generate_handover_qr(req.lot_id, req.sender_id, req.sender_role)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QR Generation Error: {str(e)}")

@router.post("/handover/verify-qr", response_model=QRVerificationResult)
def verify_handover_qr_code(qr_token: str):
    """Verifies HMAC signature, timestamp validity, and retrieves waste lot details."""
    try:
        return handover_service.verify_qr_token(qr_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QR Verification Failed: {str(e)}")
