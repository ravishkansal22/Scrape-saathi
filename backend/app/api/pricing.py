from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.pricing import (
    MaterialReferencePrice,
    ValuationCalculationRequest,
    ValuationCalculationResponse,
)
from app.services.pricing import pricing_service

router = APIRouter(prefix="/api/v1/pricing", tags=["Fair Reference Pricing & Valuation"])

@router.get("/catalog", response_model=List[MaterialReferencePrice])
def get_pricing_catalog():
    """Returns verified market reference prices, grade specifications, sources, and last updated timestamps."""
    return pricing_service.get_all_reference_prices()

@router.post("/calculate", response_model=ValuationCalculationResponse)
def calculate_material_valuation(req: ValuationCalculationRequest):
    """
    Computes fair valuation using actual physical scale measured weight or discrete item count.
    Calculates gross value, handling deduction, and net payable estimate.
    """
    try:
        return pricing_service.calculate_valuation(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Valuation Calculation Error: {str(e)}")
