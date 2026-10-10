from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.handover import DigitalWasteLot
from app.schemas.vendor import (
    VendorDashboardSummary,
    VendorInspectionRequest,
    OnwardLotCreationRequest,
)
from app.services.vendor import vendor_service

router = APIRouter(prefix="/api/v1/vendor", tags=["Vendor Workbench & Warehouse Inventory"])

@router.get("/dashboard", response_model=VendorDashboardSummary)
def get_vendor_dashboard(vendor_id: str = "vendor_apex_metals_01"):
    """
    Returns vendor inventory summary, total warehouse valuation,
    segregation compliance status, and incoming lot metrics.
    """
    try:
        return vendor_service.get_dashboard_summary(vendor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor Dashboard Error: {str(e)}")

@router.get("/incoming-lots", response_model=List[DigitalWasteLot])
def get_incoming_lots_queue():
    """Returns all incoming waste lots awaiting physical inspection and purchase offers."""
    try:
        return vendor_service.get_incoming_lots_queue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incoming Lots Queue Error: {str(e)}")

@router.post("/inspect")
def inspect_lot_and_offer(req: VendorInspectionRequest) -> Dict[str, Any]:
    """
    Vendor records physical scale weight, checks contamination, and issues purchase offer transaction.
    """
    try:
        return vendor_service.inspect_and_offer(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inspection Error: {str(e)}")

@router.post("/create-onward-lot", response_model=DigitalWasteLot)
def create_onward_bulk_lot(req: OnwardLotCreationRequest):
    """
    Vendor aggregates inventory stock into a commercial bulk lot for sale to an authorized recycler.
    """
    try:
        return vendor_service.create_onward_lot_for_recycler(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Onward Lot Error: {str(e)}")
