from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PricingUnit(str, Enum):
    INR_PER_KG = "INR_PER_KG"
    INR_PER_UNIT = "INR_PER_UNIT"

class PricingSourceType(str, Enum):
    MANDI_INDEX = "MANDI_INDEX"
    RECYCLER_BENCHMARK = "RECYCLER_BENCHMARK"
    GOVERNMENT_EPR_RATE = "GOVERNMENT_EPR_RATE"
    MANUAL_INDICATIVE = "MANUAL_INDICATIVE"

class MaterialReferencePrice(BaseModel):
    material_id: str
    category: str
    material_name: str
    grade: str
    reference_price: float = Field(description="Price in INR per unit")
    unit: PricingUnit = PricingUnit.INR_PER_KG
    price_source: str
    source_type: PricingSourceType
    is_live_verified: bool = False
    last_updated: datetime
    notes: Optional[str] = None

class ValuationCalculationRequest(BaseModel):
    material_name: str
    category: str
    measured_weight_kg: Optional[float] = Field(default=None, ge=0.0, description="Actual physical scale measured weight")
    item_count: Optional[int] = Field(default=None, ge=0, description="Discrete item quantity if sold per unit")
    condition_grade: str = "Standard"
    custom_unit_price: Optional[float] = Field(default=None, ge=0.0, description="Collector/Vendor proposed price if overriding index")

class ValuationCalculationResponse(BaseModel):
    material_name: str
    category: str
    quantity_type: str = "WEIGHT"  # "WEIGHT" or "UNIT_COUNT"
    measured_quantity: float
    unit: PricingUnit
    reference_unit_price: float
    effective_unit_price: float
    is_indicative: bool
    price_source: str
    total_estimated_value: float
    handling_deduction: float = 0.0
    net_payable_estimate: float
    calculation_breakdown: str
