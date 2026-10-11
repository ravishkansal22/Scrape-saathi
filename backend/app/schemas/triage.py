from enum import Enum
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

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
    model_config = ConfigDict(extra="forbid")
    sample_item_id: Optional[str] = Field(default=None, max_length=100)
    image_base64: Optional[str] = Field(default=None, max_length=5_000_100)
    image_url: Optional[str] = None
    collector_notes: Optional[str] = Field(default=None, max_length=2000)
    reported_hazards: HazardMarkers = Field(default_factory=HazardMarkers)

    @model_validator(mode="after")
    def validate_source(self):
        if self.image_url is not None:
            raise ValueError("Image URLs are not supported. Upload a JPEG, PNG, GIF or WebP image.")
        if bool(self.sample_item_id) == bool(self.image_base64):
            raise ValueError("Provide exactly one demo sample ID or uploaded image.")
        return self


class VisionMaterial(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    material_type: str = Field(min_length=1, max_length=200)
    recyclable: bool


class VisionResult(BaseModel):
    """Untrusted model output: required fields, real booleans, no invented defaults."""
    model_config = ConfigDict(strict=True, extra="forbid")
    item_title: str = Field(min_length=1, max_length=300)
    category: Literal["biodegradable", "recyclable", "reusable", "e-waste", "hazardous", "mixed", "unknown"]
    overall_confidence: float = Field(ge=0, le=1, allow_inf_nan=False)
    materials_detected: List[VisionMaterial] = Field(max_length=20)
    contamination_risk: str = Field(min_length=1, max_length=300)
    recycling_potential: str = Field(min_length=1, max_length=300)
    biodegradability_rating: str = Field(min_length=1, max_length=300)
    recommended_pathway: str = Field(min_length=1, max_length=500)
    is_hazardous: bool
    battery_damage: bool
    chemical_leak: bool
    pressurized_canister: bool
    exposed_wiring: bool
    sharp_edges: bool
    hazard_description: Optional[str] = Field(max_length=1000)

class TriageAnalysisResponse(BaseModel):
    analysis_source: Literal["demo", "bedrock"] = "demo"
    model_id: Optional[str] = None
    request_id: Optional[str] = None
    latency_ms: Optional[int] = None
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
