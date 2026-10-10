from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.triage import WasteCategory
from app.schemas.transactions import VerificationStatus

class FinalTreatmentOutcome(str, Enum):
    RECYCLED_RAW_MATERIAL = "RECYCLED_RAW_MATERIAL"
    REFURBISHED_COMPONENTS = "REFURBISHED_COMPONENTS"
    SAFE_CHEMICAL_NEUTRALIZATION = "SAFE_CHEMICAL_NEUTRALIZATION"
    ENERGY_RECOVERY = "ENERGY_RECOVERY"
    NON_RECOVERABLE_RESIDUE = "NON_RECOVERABLE_RESIDUE"

class RecyclerPermit(BaseModel):
    recycler_id: str
    name: str
    permit_number: str
    permit_category: str
    authorized_waste_categories: List[WasteCategory]
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    rating: float = 4.8
    distance_km: float = 3.5
    latitude: float = 28.6289
    longitude: float = 77.2150
    facility_address: str
    contact_phone: str
    active_epr_accreditation: bool = True

class RecyclerIntakeConfirmationRequest(BaseModel):
    transaction_id: str
    recycler_id: str
    measured_intake_weight_kg: float = Field(ge=0.0)
    intake_item_count: Optional[int] = None
    has_contamination: bool = False
    contamination_weight_deduction_kg: float = 0.0
    intake_notes: Optional[str] = None
    scanned_latitude: Optional[float] = 28.6289
    scanned_longitude: Optional[float] = 77.2150

class FinalOutcomeRecordRequest(BaseModel):
    transaction_id: str
    recycler_id: str
    treatment_outcome: FinalTreatmentOutcome
    recovered_material_weight_kg: float = Field(ge=0.0)
    recovery_yield_percentage: float = Field(ge=0.0, le=100.0)
    treatment_method_details: str
    downstream_destination: str
    epr_certificate_notes: Optional[str] = None

class ChainOfCustodyNode(BaseModel):
    step_number: int
    custodian_id: str
    custodian_name: str
    custodian_role: str
    action: str
    timestamp: datetime
    location: str
    recorded_weight_kg: Optional[float] = None
    transaction_id: Optional[str] = None
    verification_status: str

class FullTraceabilityGraph(BaseModel):
    lot_id: str
    item_title: str
    category: WasteCategory
    initial_recorded_weight_kg: Optional[float] = None
    final_recycler_measured_weight_kg: Optional[float] = None
    origin_collector_name: str
    intermediary_vendor_name: Optional[str] = None
    final_recycler_name: Optional[str] = None
    current_lifecycle_state: str
    treatment_outcome: Optional[FinalTreatmentOutcome] = None
    recovery_yield_percentage: Optional[float] = None
    epr_audit_hash: Optional[str] = None
    custody_timeline: List[ChainOfCustodyNode] = Field(default_factory=list)
