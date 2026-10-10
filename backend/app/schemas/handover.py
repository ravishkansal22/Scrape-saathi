from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.triage import WasteCategory, HazardMarkers

class LotStatus(str, Enum):
    CREATED = "CREATED"
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    IN_TRANSIT = "IN_TRANSIT"
    RECEIVED = "RECEIVED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    DISPUTED = "DISPUTED"
    PROCESSED = "PROCESSED"

class UserRole(str, Enum):
    KABADIWALA = "KABADIWALA"
    VENDOR = "VENDOR"
    RECYCLER = "RECYCLER"
    GENERATOR = "GENERATOR"

class CustodyEvent(BaseModel):
    event_id: str
    timestamp: datetime
    from_user_id: str
    from_user_role: UserRole
    to_user_id: str
    to_user_role: UserRole
    action: str
    measured_weight_kg: Optional[float] = None
    notes: Optional[str] = None
    verification_hash: str

class DigitalWasteLot(BaseModel):
    lot_id: str
    creator_id: str
    creator_name: str
    creator_role: UserRole
    current_custodian_id: str
    current_custodian_name: str
    current_custodian_role: UserRole
    item_title: str
    category: WasteCategory
    measured_weight_kg: Optional[float] = Field(default=None, description="Actual physical scale measured weight")
    item_count: Optional[int] = Field(default=None, description="Physical item count")
    condition: str = "Standard"
    estimated_reference_value: float = 0.0
    hazard_status: HazardMarkers = Field(default_factory=HazardMarkers)
    status: LotStatus = LotStatus.CREATED
    origin_location: str = "New Delhi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: List[str] = Field(default_factory=list)
    custody_history: List[CustodyEvent] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

class DigitalWasteLotCreate(BaseModel):
    creator_id: str
    creator_name: str
    creator_role: UserRole = UserRole.KABADIWALA
    item_title: str
    category: WasteCategory
    measured_weight_kg: Optional[float] = Field(default=None, ge=0.0, description="Scale measured weight")
    item_count: Optional[int] = Field(default=None, ge=0, description="Item count")
    condition: str = "Standard"
    origin_location: str = "New Delhi"
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    hazard_status: Optional[HazardMarkers] = None
    photos: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class HandoverQRGenerateRequest(BaseModel):
    lot_id: str
    sender_id: str
    sender_role: UserRole
    receiver_id: Optional[str] = None

class HandoverQRGenerateResponse(BaseModel):
    lot_id: str
    qr_token: str
    qr_image_base64: str
    verification_url: str
    expires_at: str

class QRVerificationResult(BaseModel):
    is_valid: bool
    lot_id: str
    sender_id: str
    sender_name: str
    sender_role: UserRole
    item_title: str
    category: WasteCategory
    measured_weight_kg: Optional[float]
    item_count: Optional[int]
    lot_status: LotStatus
    hazard_status: HazardMarkers
    verification_time: datetime
    message: str
