from fastapi import APIRouter, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from starlette.responses import JSONResponse
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    TriageClarificationRequest,
)
from app.services.ai_triage import (
    ai_triage_service, InvalidTriageInput, TriageUnavailable, InvalidVisionResponse,
)

class TriageRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()

        async def handle(request):
            try:
                return await handler(request)
            except RequestValidationError:
                # Default validation errors echo input, which can contain an entire photo.
                return JSONResponse(status_code=422, content={
                    "detail": "Invalid triage request. Provide one listed demo sample or a supported uploaded image; image URLs are not supported."
                })

        return handle


router = APIRouter(prefix="/api/v1/triage", tags=["AI Waste Classification & Segregation"], route_class=TriageRoute)

@router.post("/analyze", response_model=TriageAnalysisResponse)
def analyze_scrap_item(req: TriageAnalysisRequest):
    """
    Classifies waste into 7 standard categories (biodegradable, recyclable, reusable, e-waste, hazardous, mixed, unknown).
    Provides co-storage and segregation matrix, hazard detection, and deterministic safety overrides.
    No model-estimated weight is produced.
    """
    try:
        return ai_triage_service.analyze_scrap(req)
    except InvalidTriageInput as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except TriageUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except InvalidVisionResponse as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

@router.post("/clarify", response_model=TriageAnalysisResponse)
def clarify_triage_item(req: TriageClarificationRequest):
    """
    Records an observation for the explicit cable demo without certifying purity.
    """
    try:
        return ai_triage_service.apply_clarification(req.item_name, req.selected_option_id, req.category)
    except InvalidTriageInput as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
