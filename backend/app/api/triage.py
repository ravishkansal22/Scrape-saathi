from fastapi import APIRouter, HTTPException
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    TriageClarificationRequest,
)
from app.services.ai_triage import ai_triage_service

router = APIRouter(prefix="/api/v1/triage", tags=["AI Multimodal Triage"])

@router.post("/analyze", response_model=TriageAnalysisResponse)
def analyze_scrap_item(req: TriageAnalysisRequest):
    """
    Multimodal Waste Classification API.
    Performs component extraction, 3-Tier Confidence calculation, and Deterministic Hazard Overrides.
    """
    try:
        return ai_triage_service.analyze_scrap(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage Analysis Error: {str(e)}")

@router.post("/clarify", response_model=TriageAnalysisResponse)
def clarify_triage_item(req: TriageClarificationRequest):
    """
    Submits user clarification answer for Medium Confidence (0.60 - 0.84) triage items.
    Promotes item to HIGH confidence tier and adjusts material index valuation.
    """
    try:
        return ai_triage_service.apply_clarification(req.item_name, req.selected_option_id, req.components)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clarification Error: {str(e)}")
