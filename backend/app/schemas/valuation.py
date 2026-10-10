from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.triage import SubComponent

class DisassemblyStep(BaseModel):
    step_number: int
    action: str
    target_component: str
    tool_required: str
    safety_warning: Optional[str] = None

class ValuationRequest(BaseModel):
    item_title: str
    components: List[SubComponent]
    bulk_sale_price_per_kg: float = 40.0
    total_gross_weight_kg: float
    handling_overhead_cost: float = 30.0
    disassembly_labor_cost: float = 50.0

class ValuationResponse(BaseModel):
    item_title: str
    bulk_sale_value: float
    disassembled_gross_value: float
    handling_overhead: float
    disassembly_labor_cost: float
    disassembled_net_value: float
    arbitrage_net_gain: float
    recommendation: str  # e.g., "DISASSEMBLE" or "SELL_BULK"
    recommendation_summary: str
    disassembly_steps: List[DisassemblyStep]
