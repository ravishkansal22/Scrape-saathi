from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.triage import WasteCategory
from app.schemas.recycler import (
    RecyclerPermit,
    RecyclerIntakeConfirmationRequest,
    FinalOutcomeRecordRequest,
    FullTraceabilityGraph,
)
from app.services.recyclers import recycler_service

router = APIRouter(prefix="/api/v1/recyclers", tags=["Authorized Recyclers & Traceability"])

@router.get("/match", response_model=List[RecyclerPermit])
def match_authorized_recyclers(
    lat: float = 28.6139,
    lng: float = 77.2090,
    category: WasteCategory = WasteCategory.RECYCLABLE,
):
    """
    Computes spatial proximity (PostGIS distance) to authorized recyclers holding active regulatory permits.
    """
    return recycler_service.match_recyclers(lat, lng, category)

@router.get("/all", response_model=List[RecyclerPermit])
def get_all_registered_recyclers():
    """Returns all authorized recycling facilities in the registry."""
    return recycler_service.get_all_recyclers()

@router.post("/intake-confirm")
def confirm_recycler_intake(req: RecyclerIntakeConfirmationRequest) -> Dict[str, Any]:
    """
    Recycler confirms intake on physical platform scale, logs discrepancies, and updates lot status.
    """
    try:
        return recycler_service.confirm_intake(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Intake Confirmation Error: {str(e)}")

@router.post("/record-outcome")
def record_final_circular_outcome(req: FinalOutcomeRecordRequest) -> Dict[str, Any]:
    """
    Records physical material transformation, recovery yield percentage, and issues immutable EPR audit certificate.
    """
    try:
        return recycler_service.record_final_outcome(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Record Outcome Error: {str(e)}")

@router.get("/traceability/{lot_id}", response_model=FullTraceabilityGraph)
def get_lot_traceability_graph(lot_id: str):
    """
    Returns complete chain-of-custody genealogy from original collector collection through vendor to recycler.
    """
    try:
        return recycler_service.get_traceability_graph(lot_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Traceability Graph Error: {str(e)}")
