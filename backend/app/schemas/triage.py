from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ConfidenceTier(str, Enum):
    HIGH = "HIGH"         # >= 0.85 Autonomous classification
    MEDIUM = "MEDIUM"     # 0.60 - 0.84 Interactive user prompt required
    LOW = "LOW"           # < 0.60 Physical depot holding / manual inspection

class SubComponent(BaseModel):
    name: str = Field(..., description="Sub-component material (e.g. Copper Windings, Aluminum Casing, ABS Plastic)")
    estimated_weight_kg: float = Field(..., description="Estimated weight of sub-material in kg")
    index_price_per_kg: float = Field(..., description="Current commodity index market price in ₹/kg")
    purity_factor: float = Field(..., ge=0.0, le=1.0, description="Purity / condition degradation factor Q_i (0.0 to 1.0)")
    disassembly_ease: str = Field(default="Medium", description="Ease of extraction: Easy, Medium, Hard")

class HazardMarkers(BaseModel):
    is_hazardous: bool = False
    battery_swollen: bool = False
    thermal_venting: bool = False
    puncture_detected: bool = False
    chemical_leak: bool = False
    hazard_description: Optional[str] = None
    containment_protocol: Optional[str] = None

class ClarificationOption(BaseModel):
    option_id: str
    label: str
    impact_description: str

class ClarificationPrompt(BaseModel):
    prompt_id: str
    question: str
    options: List[ClarificationOption]

class TriageAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    sample_item_id: Optional[str] = None  # E.g. 'electric_motor', 'swollen_laptop', 'copper_cable', 'mixed_e_waste'
    user_latitude: Optional[float] = 28.6139
    user_longitude: Optional[float] = 77.2090

class TriageClarificationRequest(BaseModel):
    item_name: str
    selected_option_id: str
    components: List[SubComponent]

class TriageAnalysisResponse(BaseModel):
    item_title: str
    category: str
    overall_confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_tier: ConfidenceTier
    components: List[SubComponent]
    hazard_analysis: HazardMarkers
    clarification_prompt: Optional[ClarificationPrompt] = None
    depot_inspection_required: bool = False
    depot_reason: Optional[str] = None
    recommended_pathway: str = Field(..., description="Reuse, Refurbish, Harvest for components, or Material Recovery")
