from fastapi import APIRouter, HTTPException
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    TriageClarificationRequest,
)
from app.services.ai_triage import ai_triage_service

router = APIRouter(prefix="/api/v1/triage", tags=["AI Waste Classification & Segregation"])

@router.post("/analyze", response_model=TriageAnalysisResponse)
def analyze_scrap_item(req: TriageAnalysisRequest):
    """
    Classifies waste into 7 standard categories (biodegradable, recyclable, reusable, e-waste, hazardous, mixed, unknown).
    Provides co-storage and segregation matrix, hazard detection, and deterministic safety overrides.
    No model-estimated weight is produced.
    """
    try:
        return ai_triage_service.analyze_scrap(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage Analysis Error: {str(e)}")

@router.post("/clarify", response_model=TriageAnalysisResponse)
def clarify_triage_item(req: TriageClarificationRequest):
    """
    Applies user clarification for medium-confidence items and promotes to HIGH confidence.
    """
    try:
        return ai_triage_service.apply_clarification(req.item_name, req.selected_option_id, req.category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clarification Error: {str(e)}")
