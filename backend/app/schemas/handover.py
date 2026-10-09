from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.triage import SubComponent, HazardMarkers

class RecyclerPermit(BaseModel):
    recycler_id: str
    name: str
    permit_category: str
    rating: float
    distance_km: float
    latitude: float
    longitude: float
    contact_phone: str

class DigitalWasteLotCreate(BaseModel):
    collector_id: str
    item_title: str
    category: str
    components: List[SubComponent]
    total_weight_kg: float
    net_valuation: float
    latitude: float
    longitude: float
    hazard_status: HazardMarkers

class DigitalWasteLot(BaseModel):
    lot_id: str
    collector_id: str
    item_title: str
    category: str
    components: List[SubComponent]
    total_weight_kg: float
    net_valuation: float
    status: str = Field(..., description="CREATED, MATCHED, IN_TRANSIT, RECEIVED, REJECTED")
    created_at: datetime
    updated_at: datetime
    latitude: float
    longitude: float
    hazard_status: HazardMarkers
    assigned_recycler: Optional[RecyclerPermit] = None

class HandoverQRGenerateRequest(BaseModel):
    lot_id: str
    collector_id: str

class HandoverQRGenerateResponse(BaseModel):
    lot_id: str
    qr_token: str
    qr_image_base64: str
    expires_at: str

class HandoverVerifyRequest(BaseModel):
    qr_token: str
    recycler_id: str
    scanned_latitude: float
    scanned_longitude: float

class EPRReceiptResponse(BaseModel):
    receipt_id: str
    lot_id: str
    collector_id: str
    recycler_id: str
    recycler_name: str
    verified_at: datetime
    total_weight_kg: float
    category: str
    components_breakdown: List[SubComponent]
    digital_signature: str
    epr_compliance_status: str = "VERIFIED_VALID"
