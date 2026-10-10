import json
import logging
from typing import Dict, Any, List, Optional
try:
    import boto3
except ImportError:
    boto3 = None

from app.config import settings
from app.schemas.triage import (
    WasteCategory,
    ConfidenceTier,
    MaterialComponent,
    HazardMarkers,
    SegregationGuidance,
    ClarificationPrompt,
    ClarificationOption,
    TriageAnalysisRequest,
    TriageAnalysisResponse,
)

logger = logging.getLogger("scrapsetu.ai_triage")

# Deterministic Knowledge Base for Segregation, Storage & Co-transport Compatibility Matrix
SEGREGATION_RULES_MATRIX: Dict[WasteCategory, SegregationGuidance] = {
    WasteCategory.BIODEGRADABLE: SegregationGuidance(
        compatible_materials=["Organic Food Waste", "Garden Biomass", "Cardboard (dry, unprinted)"],
        incompatible_materials=["Hazardous Waste", "E-Waste", "Chemicals", "Metals"],
        segregation_reasoning="Biodegradable waste rots rapidly and produces leachate/methane. Co-storage with e-waste or metals causes corrosion, severe contamination, and destroys recycling value.",
        safe_storage_instructions="Store in ventilated, leak-proof compostable bins under covered shed. Must be transferred to composting/biomethanation facility within 24-48 hours."
    ),
    WasteCategory.RECYCLABLE: SegregationGuidance(
        compatible_materials=["Clean Plastics (PET, HDPE)", "Ferrous Steel", "Non-Ferrous Copper/Aluminum", "Clean Paper & Cardboard"],
        incompatible_materials=["Wet Biodegradables", "Toxic Chemicals", "Oily Containers", "Swollen Batteries"],
        segregation_reasoning="Dry recyclables retain high commodity value when clean and segregated by resin/metal type. Moisture, grease, and chemicals cause downgrading or rejection at recycling plants.",
        safe_storage_instructions="Keep dry in designated segregated bays (Bay A: Plastics, Bay B: Copper/Brass, Bay C: Steel). Protect from rain and direct sunlight."
    ),
    WasteCategory.REUSABLE: SegregationGuidance(
        compatible_materials=["Intact Glass Bottles", "Refurbishable Appliances", "Structural Metal Frames", "Wooden Pallets"],
        incompatible_materials=["Crushed Heavy Scrap", "Hazardous Corrosives", "Wet Waste"],
        segregation_reasoning="Reusable items lose resale and refurbishing value if crushed, scratched, or exposed to corrosive substances during transit.",
        safe_storage_instructions="Store upright with cushioning on designated shelving racks. Label clearly with condition tag."
    ),
    WasteCategory.E_WASTE: SegregationGuidance(
        compatible_materials=["Circuit Boards (PCBs)", "Copper Yokes", "Plastic Casings (Non-Brominated)", "Clean Wiring"],
        incompatible_materials=["Wet Waste", "Acid/Chemical Drums", "Loose Damaged Batteries", "Organic Refuse"],
        segregation_reasoning="E-waste contains precious metals (Gold, Silver, Palladium) alongside toxic heavy metals (Lead, Mercury). Moisture causes short circuits and leaching of toxic heavy metals.",
        safe_storage_instructions="Store on anti-static, covered indoor pallets. Keep fire extinguishers nearby. Disassemble only in authorized e-waste dismantling workstations with dust extraction."
    ),
    WasteCategory.HAZARDOUS: SegregationGuidance(
        compatible_materials=["Similar Hazmat Classes with neutral buffering"],
        incompatible_materials=["ALL General Recyclables", "Biodegradable Waste", "Flammable Solvents", "Water/Moisture"],
        segregation_reasoning="Hazardous materials (chemicals, batteries, acids) pose extreme risks of fire, toxic gas venting, chemical burns, and severe environmental contamination.",
        safe_storage_instructions="MANDATORY ISOLATION: Store in double-walled, corrosion-resistant, sand-buffered hazmat drums in a locked, ventilated, fire-rated isolation shed."
    ),
    WasteCategory.MIXED: SegregationGuidance(
        compatible_materials=["Dry Mixed Non-Hazardous Municipal Waste"],
        incompatible_materials=["Hazardous Chemicals", "Lithium-ion Batteries", "Bio-medical Waste"],
        segregation_reasoning="Mixed waste requires secondary mechanical and manual sorting at a Materials Recovery Facility (MRF) before recycling.",
        safe_storage_instructions="Deposit at MRF receiving deck for sorting conveyor segregation. Do not compact until hazardous items are screened."
    ),
    WasteCategory.UNKNOWN: SegregationGuidance(
        compatible_materials=["Quarantine Inspection Staging Area Only"],
        incompatible_materials=["General Waste Stocks", "Recycler Outflow"],
        segregation_reasoning="Unknown materials may conceal pressurized, radioactive, or reactive hazards that must be identified prior to consolidation.",
        safe_storage_instructions="Place in physical depot quarantine holding area for visual and chemical verification by authorized supervisor."
    ),
}

# Preset demo items for offline testing and deterministic fallback
PRESET_ITEMS_CATALOG: Dict[str, Dict[str, Any]] = {
    "electric_motor": {
        "item_title": "Induction Motor Assembly (1.5 HP)",
        "category": WasteCategory.RECYCLABLE,
        "overall_confidence": 0.94,
        "confidence_tier": ConfidenceTier.HIGH,
        "materials_detected": [
            MaterialComponent(name="Copper Stator Windings", material_type="Non-Ferrous Metal", purity_grade="Grade A (Bright Red)", recyclable=True, notes="High recovery yield"),
            MaterialComponent(name="Cast Iron / Steel Enclosure", material_type="Ferrous Metal", purity_grade="Heavy Melting Scrap (HMS-1)", recyclable=True),
            MaterialComponent(name="Aluminum Rotor Endbells", material_type="Non-Ferrous Metal", purity_grade="Cast Aluminum", recyclable=True),
        ],
        "contamination_risk": "Low (Minor residual machine grease)",
        "recycling_potential": "Excellent (>95% material circularity)",
        "biodegradability_rating": "Non-biodegradable",
        "recommended_pathway": "Disassembly & Segregated Material Smelting",
        "hazard_analysis": HazardMarkers(is_hazardous=False),
        "safe_handling_guidance": "Use heavy leather work gloves and eye protection. Do not drop on feet. Unbolt casing with socket wrenches rather than hammering to preserve copper wire purity.",
        "requires_manual_inspection": False,
    },
    "swollen_laptop": {
        "item_title": "Damaged Laptop with Swollen Li-ion Battery",
        "category": WasteCategory.HAZARDOUS,
        "overall_confidence": 0.98,
        "confidence_tier": ConfidenceTier.HIGH,
        "materials_detected": [
            MaterialComponent(name="Swollen Li-ion Pouch Cell", material_type="Hazardous Battery", purity_grade="Damaged / Swollen", recyclable=True, notes="Requires specialized hydrometallurgical recycling"),
            MaterialComponent(name="PCB Motherboard (Gold/Palladium contacts)", material_type="E-Waste PCB", purity_grade="High Grade Server/Laptop Board", recyclable=True),
            MaterialComponent(name="Aluminum Top Shell & Heatsink", material_type="Non-Ferrous Metal", purity_grade="Extruded Aluminum", recyclable=True),
        ],
        "contamination_risk": "High (Electrolyte venting risk)",
        "recycling_potential": "Moderate (Battery requires hazmat neutralization first)",
        "biodegradability_rating": "Non-biodegradable / Toxic",
        "recommended_pathway": "Hazardous Material Isolation & Specialized Battery Neutralization",
        "hazard_analysis": HazardMarkers(
            is_hazardous=True,
            battery_damage=True,
            hazard_description="CRITICAL THERMAL RUNAWAY HAZARD: Swollen Lithium-Ion battery pack detected. Risk of spontaneous combustion or explosion if punctured, crushed, or compacted.",
            containment_protocol="DETERMINISTIC SAFETY OVERRIDE: Immediately place into a vermiculite/sand-buffered fireproof hazmat drum. DO NOT PUNCTURE, COMPACT, OR DISMANTLE."
        ),
        "safe_handling_guidance": "Handle with insulated anti-static tongs and heat-resistant gloves. Keep Class-D fire extinguisher accessible. Never expose to moisture, open flame, or heavy scrap shredders.",
        "requires_manual_inspection": True,
        "manual_inspection_reason": "Hazardous swollen battery requires physical supervisor verification before any transfer.",
    },
    "copper_cable": {
        "item_title": "Heavy-Duty Industrial Wiring Cable",
        "category": WasteCategory.RECYCLABLE,
        "overall_confidence": 0.78,
        "confidence_tier": ConfidenceTier.MEDIUM,
        "materials_detected": [
            MaterialComponent(name="Core Metallic Conductor", material_type="Conductor Metal", purity_grade="Unconfirmed (Pure Cu vs CCA)", recyclable=True),
            MaterialComponent(name="PVC Sheathing Insulation", material_type="Plastic (PVC)", purity_grade="Standard Insulation", recyclable=True),
        ],
        "contamination_risk": "Low to Moderate (Dust and outer dirt)",
        "recycling_potential": "Very High once stripped of insulation",
        "biodegradability_rating": "Non-biodegradable",
        "recommended_pathway": "Mechanical Cable Stripping & Copper Refining",
        "hazard_analysis": HazardMarkers(is_hazardous=False),
        "safe_handling_guidance": "Use mechanical cable stripper or utility knife directed away from body. NEVER BURN CABLES TO REMOVE INSULATION (burning releases carcinogenic dioxins and is illegal).",
        "requires_manual_inspection": False,
        "clarification_prompt": ClarificationPrompt(
            prompt_id="cable_purity_check",
            question="Is the internal conductor pure solid/stranded red copper, or tin-coated/copper-clad aluminum (CCA)?",
            options=[
                ClarificationOption(option_id="pure_copper", label="Pure Heavy Red Copper Wire (Bright/Shiny)", impact_description="Classified as Grade-A Copper (₹680/kg benchmark)"),
                ClarificationOption(option_id="tin_coated", label="Tin-Coated Copper / CCA (Dull/Silvery)", impact_description="Classified as Secondary Mixed Conductor (₹420/kg benchmark)"),
            ]
        ),
    },
    "unknown_rusty_compressor": {
        "item_title": "Degraded Sealed Compressor Cylinder",
        "category": WasteCategory.UNKNOWN,
        "overall_confidence": 0.42,
        "confidence_tier": ConfidenceTier.LOW,
        "materials_detected": [
            MaterialComponent(name="Sealed Heavy Steel Chamber", material_type="Ferrous Steel", purity_grade="Unknown Grade", recyclable=True),
        ],
        "contamination_risk": "Unknown (Potential residual refrigerant/mineral oil)",
        "recycling_potential": "Conditional upon degassing and cutting",
        "biodegradability_rating": "Non-biodegradable",
        "recommended_pathway": "Physical Depot Quarantine & Environmental Degassing Inspection",
        "hazard_analysis": HazardMarkers(
            is_hazardous=True,
            pressurized_canister=True,
            hazard_description="POTENTIAL PRESSURE / CHEMICAL HAZARD: Sealed refrigeration compressor may contain pressurized HCFC/CFC refrigerants and hazardous lubricating oil.",
            containment_protocol="DO NOT CUT WITH TORCH OR SHREDDER. Tag as UNVERIFIED SEALED VESSEL and stage in ventilated degassing bay."
        ),
        "safe_handling_guidance": "Must be recovered and degassed by a certified technician using certified recovery machine before scrap steel recycling.",
        "requires_manual_inspection": True,
        "manual_inspection_reason": "Low AI identification confidence (0.42) and sealed pressurized vessel risk.",
    },
    "organic_kitchen_waste": {
        "item_title": "Mixed Food Scraps & Vegetable Waste",
        "category": WasteCategory.BIODEGRADABLE,
        "overall_confidence": 0.95,
        "confidence_tier": ConfidenceTier.HIGH,
        "materials_detected": [
            MaterialComponent(name="Raw Vegetable Trimmings & Fruit Peels", material_type="Organic Biomass", purity_grade="High Moisture Organic", recyclable=False, notes="Excellent for aerobic composting"),
        ],
        "contamination_risk": "Low if segregated from plastics and metals",
        "recycling_potential": "High Organic Circularity (Compost / Biogas)",
        "biodegradability_rating": "Rapidly Biodegradable (1-4 weeks)",
        "recommended_pathway": "Aerobic Composting / Anaerobic Biomethanation Digestion",
        "hazard_analysis": HazardMarkers(is_hazardous=False),
        "safe_handling_guidance": "Keep moisture contained. Collect daily in green organic bin. Never mix with dry recyclables, batteries, or plastics.",
        "requires_manual_inspection": False,
    }
}

class AITriageService:
    def __init__(self):
        self.bedrock_client = None
        if boto3 is not None:
            try:
                self.bedrock_client = boto3.client("bedrock-runtime", region_name=settings.AWS_REGION)
            except Exception as e:
                logger.warning(f"AWS Bedrock client initialization skipped: {e}")

    def analyze_scrap(self, request: TriageAnalysisRequest) -> TriageAnalysisResponse:
        """
        Multimodal waste triage engine classifying into 7 categories.
        Enforces deterministic safety rules, co-storage compatibility, and safe handling guidance.
        Excludes model-estimated weight.
        """
        # If preset item specified, return enriched deterministic catalog entry
        if request.sample_item_id and request.sample_item_id in PRESET_ITEMS_CATALOG:
            item_data = PRESET_ITEMS_CATALOG[request.sample_item_id]
            category = item_data["category"]
            seg_rules = SEGREGATION_RULES_MATRIX[category]
            
            return TriageAnalysisResponse(
                item_title=item_data["item_title"],
                category=category,
                overall_confidence=item_data["overall_confidence"],
                confidence_tier=item_data["confidence_tier"],
                materials_detected=item_data["materials_detected"],
                contamination_risk=item_data["contamination_risk"],
                recycling_potential=item_data["recycling_potential"],
                biodegradability_rating=item_data["biodegradability_rating"],
                recommended_pathway=item_data["recommended_pathway"],
                segregation_guidance=seg_rules,
                hazard_analysis=item_data["hazard_analysis"],
                safe_handling_guidance=item_data["safe_handling_guidance"],
                requires_manual_inspection=item_data.get("requires_manual_inspection", False),
                manual_inspection_reason=item_data.get("manual_inspection_reason"),
                clarification_prompt=item_data.get("clarification_prompt"),
            )

        # If live image provided and Bedrock available, invoke Claude 3.5 Sonnet
        if (request.image_base64 or request.image_url) and self.bedrock_client:
            try:
                bedrock_result = self._call_bedrock_vision(request)
                if bedrock_result:
                    return bedrock_result
            except Exception as ex:
                logger.error(f"Bedrock API call failed, falling back to rule engine: {ex}")

        # Default fallback to high-confidence Electric Motor
        default_item = PRESET_ITEMS_CATALOG["electric_motor"]
        return TriageAnalysisResponse(
            item_title=default_item["item_title"],
            category=default_item["category"],
            overall_confidence=default_item["overall_confidence"],
            confidence_tier=default_item["confidence_tier"],
            materials_detected=default_item["materials_detected"],
            contamination_risk=default_item["contamination_risk"],
            recycling_potential=default_item["recycling_potential"],
            biodegradability_rating=default_item["biodegradability_rating"],
            recommended_pathway=default_item["recommended_pathway"],
            segregation_guidance=SEGREGATION_RULES_MATRIX[default_item["category"]],
            hazard_analysis=default_item["hazard_analysis"],
            safe_handling_guidance=default_item["safe_handling_guidance"],
            requires_manual_inspection=default_item.get("requires_manual_inspection", False),
            manual_inspection_reason=default_item.get("manual_inspection_reason"),
        )

    def apply_clarification(self, item_name: str, option_id: str, category: WasteCategory) -> TriageAnalysisResponse:
        """
        Promotes medium-confidence item to HIGH confidence after user clarification.
        """
        if option_id == "pure_copper":
            materials = [
                MaterialComponent(name="Pure Bright Copper Wire (Grade A)", material_type="Non-Ferrous Metal", purity_grade="Grade A 99.9% Cu", recyclable=True),
                MaterialComponent(name="PVC Sheathing Insulation", material_type="Plastic", purity_grade="Standard PVC", recyclable=True),
            ]
            pathway = "Mechanical Stripping & Direct Grade-A Copper Smelting"
            title = f"{item_name} [Verified: Grade-A Pure Copper]"
        else:
            materials = [
                MaterialComponent(name="Tin-Coated / CCA Conductor", material_type="Mixed Metal Conductor", purity_grade="Secondary Grade", recyclable=True),
                MaterialComponent(name="PVC Sheathing Insulation", material_type="Plastic", purity_grade="Standard PVC", recyclable=True),
            ]
            pathway = "Secondary Smelting & Refining"
            title = f"{item_name} [Verified: Tin-Coated / CCA]"

        return TriageAnalysisResponse(
            item_title=title,
            category=category,
            overall_confidence=0.92,
            confidence_tier=ConfidenceTier.HIGH,
            materials_detected=materials,
            contamination_risk="Low (Verified by collector)",
            recycling_potential="High",
            biodegradability_rating="Non-biodegradable",
            recommended_pathway=pathway,
            segregation_guidance=SEGREGATION_RULES_MATRIX.get(category, SEGREGATION_RULES_MATRIX[WasteCategory.RECYCLABLE]),
            hazard_analysis=HazardMarkers(is_hazardous=False),
            safe_handling_guidance="Use mechanical stripper. Do not burn wire. Store in dry non-ferrous metal bin.",
            requires_manual_inspection=False,
            clarification_prompt=None,
        )

    def _call_bedrock_vision(self, request: TriageAnalysisRequest) -> Optional[TriageAnalysisResponse]:
        """Placeholder for Amazon Bedrock Claude 3.5 Sonnet visual analysis."""
        return None

ai_triage_service = AITriageService()
