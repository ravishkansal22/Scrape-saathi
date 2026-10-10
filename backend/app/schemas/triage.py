from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class WasteCategory(str, Enum):
    BIODEGRADABLE = "biodegradable"
    RECYCLABLE = "recyclable"
    REUSABLE = "reusable"
    E_WASTE = "e-waste"
    HAZARDOUS = "hazardous"
    MIXED = "mixed"
    UNKNOWN = "unknown"

class ConfidenceTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class MaterialComponent(BaseModel):
    name: str
    material_type: str
    purity_grade: Optional[str] = "Standard"
    recyclable: bool = True
    notes: Optional[str] = None

class HazardMarkers(BaseModel):
    is_hazardous: bool = False
    battery_damage: bool = False
    chemical_leak: bool = False
    exposed_wiring: bool = False
    pressurized_canister: bool = False
    sharp_edges: bool = False
    hazard_description: Optional[str] = None
    containment_protocol: Optional[str] = None

class SegregationGuidance(BaseModel):
    compatible_materials: List[str] = Field(default_factory=list, description="Materials that can be stored/transported together")
    incompatible_materials: List[str] = Field(default_factory=list, description="Materials that must strictly remain separate")
    segregation_reasoning: str
    safe_storage_instructions: str

class ClarificationOption(BaseModel):
    option_id: str
    label: str
    impact_description: str

class ClarificationPrompt(BaseModel):
    prompt_id: str
    question: str
    options: List[ClarificationOption]

class TriageAnalysisRequest(BaseModel):
    sample_item_id: Optional[str] = None
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    collector_notes: Optional[str] = None

class TriageAnalysisResponse(BaseModel):
    item_title: str
    category: WasteCategory
    overall_confidence: float = Field(ge=0.0, le=1.0)
    confidence_tier: ConfidenceTier
    materials_detected: List[MaterialComponent] = Field(default_factory=list)
    contamination_risk: str
    recycling_potential: str
    biodegradability_rating: str
    recommended_pathway: str
    segregation_guidance: SegregationGuidance
    hazard_analysis: HazardMarkers
    safe_handling_guidance: str
    requires_manual_inspection: bool = False
    manual_inspection_reason: Optional[str] = None
    clarification_prompt: Optional[ClarificationPrompt] = None

class TriageClarificationRequest(BaseModel):
    item_name: str
    selected_option_id: str
    category: WasteCategory
