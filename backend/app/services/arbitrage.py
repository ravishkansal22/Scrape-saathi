import logging
from app.schemas.valuation import (
    ValuationRequest,
    ValuationResponse,
    DisassemblyStep,
)

logger = logging.getLogger("scrapsetu.arbitrage")

class ArbitrageEngineService:
    def calculate_valuation(self, req: ValuationRequest) -> ValuationResponse:
        """
        Computes dynamic scrap valuation & disassembly arbitrage advice.
        Formula: NetValue = sum(W_i * P_i * Q_i) - C_handling
        """
        # 1. Bulk sale value
        bulk_sale_value = round(req.total_gross_weight_kg * req.bulk_sale_price_per_kg, 2)

        # 2. Sum of disassembled fractions
        disassembled_gross_value = 0.0
        disassembly_breakdown_parts = []

        for comp in req.components:
            part_val = comp.estimated_weight_kg * comp.index_price_per_kg * comp.purity_factor
            disassembled_gross_value += part_val
            disassembly_breakdown_parts.append(f"{comp.estimated_weight_kg:.1f} kg {comp.name}")

        disassembled_gross_value = round(disassembled_gross_value, 2)
        
        # 3. Disassembled net value after labor & overhead
        disassembled_net_value = round(
            disassembled_gross_value - req.handling_overhead_cost - req.disassembly_labor_cost, 2
        )

        # 4. Arbitrage gain calculation
        arbitrage_net_gain = round(disassembled_net_value - bulk_sale_value, 2)

        parts_summary_str = " + ".join(disassembly_breakdown_parts)

        if arbitrage_net_gain > 0:
            recommendation = "DISASSEMBLE"
            recommendation_summary = (
                f"Bulk sale value: ₹{bulk_sale_value:.0f}. "
                f"Disassembled yield ({parts_summary_str}): ₹{disassembled_gross_value:.0f}. "
                f"Net gain after labor & overhead: +₹{arbitrage_net_gain:.0f}."
            )
        else:
            recommendation = "SELL_BULK"
            recommendation_summary = (
                f"Bulk sale value: ₹{bulk_sale_value:.0f}. "
                f"Disassembly labor overhead outweighs constituent component gain. Recommend bulk unsegregated sale."
            )

        # Generate step-by-step disassembly guide
        steps = [
            DisassemblyStep(
                step_number=1,
                action="Unscrew external casing bolts and remove housing cover.",
                target_component="Outer Housing / Shell",
                tool_required="Standard Screwdriver / Hex Key",
                safety_warning="Wear protective leather gloves to prevent cut injuries from sharp metal edges."
            ),
            DisassemblyStep(
                step_number=2,
                action="Extract copper stator / wire coils using wire snippers or press.",
                target_component="Copper Windings",
                tool_required="Wire Snips & Pliers",
                safety_warning="Ensure no electrical residual capacitors remain charged before cutting."
            ),
            DisassemblyStep(
                step_number=3,
                action="Separate aluminum heat sinks & rotor endbells from steel core.",
                target_component="Aluminum & Steel Components",
                tool_required="Rubber Mallet",
                safety_warning=None
            ),
        ]

        return ValuationResponse(
            item_title=req.item_title,
            bulk_sale_value=bulk_sale_value,
            disassembled_gross_value=disassembled_gross_value,
            handling_overhead=req.handling_overhead_cost,
            disassembly_labor_cost=req.disassembly_labor_cost,
            disassembled_net_value=disassembled_net_value,
            arbitrage_net_gain=arbitrage_net_gain,
            recommendation=recommendation,
            recommendation_summary=recommendation_summary,
            disassembly_steps=steps,
        )

arbitrage_engine_service = ArbitrageEngineService()
