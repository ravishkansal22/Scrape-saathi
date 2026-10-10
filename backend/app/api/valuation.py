from fastapi import APIRouter, HTTPException
from app.schemas.valuation import ValuationRequest, ValuationResponse
from app.services.arbitrage import arbitrage_engine_service

router = APIRouter(prefix="/api/v1/valuation", tags=["Disassembly Arbitrage & Valuation"])

@router.post("/calculate", response_model=ValuationResponse)
def calculate_arbitrage_valuation(req: ValuationRequest):
    """
    Computes dynamic material recovery value using NetValue = sum(W_i * P_i * Q_i) - C_handling
    and advises whether to sell bulk or disassemble with net gain breakdown.
    """
    try:
        return arbitrage_engine_service.calculate_valuation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation Error: {str(e)}")
