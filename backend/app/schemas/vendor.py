from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.triage import WasteCategory
from app.schemas.transactions import PaymentStatus, TransferStatus, PaymentMethod

class InventoryItem(BaseModel):
    inventory_id: str
    material_category: WasteCategory
    material_name: str
    current_stock_kg: float = 0.0
    item_count: int = 0
    average_procured_price_per_kg: float = 0.0
    storage_bay_location: str
    segregation_compliant: bool = True
    co_storage_notes: str
    last_restocked: datetime

class VendorInspectionRequest(BaseModel):
    lot_id: str
    vendor_id: str
    physical_scale_weight_kg: float = Field(ge=0.0)
    actual_item_count: Optional[int] = None
    condition_grade: str = "Standard"
    contamination_detected: bool = False
    contamination_weight_deduction_kg: float = 0.0
    offered_price_per_kg: float = Field(ge=0.0)
    payment_method: PaymentMethod = PaymentMethod.UPI
    inspection_notes: Optional[str] = None

class VendorCounterOfferRequest(BaseModel):
    transaction_id: str
    vendor_id: str
    counter_price_per_kg: float = Field(ge=0.0)
    revised_effective_weight_kg: float = Field(ge=0.0)
    reason: str

class OnwardLotCreationRequest(BaseModel):
    vendor_id: str
    material_category: WasteCategory
    material_name: str
    aggregated_weight_kg: float = Field(gt=0.0)
    target_recycler_id: Optional[str] = None
    asking_price_per_kg: float = Field(ge=0.0)
    storage_origin_bay: str
    destination_facility: str

class VendorDashboardSummary(BaseModel):
    vendor_id: str
    business_name: str
    verification_status: str
    total_inventory_weight_kg: float
    total_inventory_value_inr: float
    pending_incoming_lots_count: int
    active_transactions_count: int
    completed_handover_count: int
    inventory_by_category: List[InventoryItem]
