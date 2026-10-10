import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from app.schemas.triage import WasteCategory
from app.schemas.handover import UserRole, LotStatus, DigitalWasteLot
from app.schemas.transactions import PaymentStatus, TransferStatus, PaymentMethod
from app.schemas.vendor import (
    InventoryItem,
    VendorInspectionRequest,
    VendorCounterOfferRequest,
    OnwardLotCreationRequest,
    VendorDashboardSummary,
)
from app.services.handover import LOTS_DATABASE
from app.services.transactions import TRANSACTIONS_DATABASE, transaction_service, TransactionCreateRequest

# In-memory Vendor Warehouse Inventory
VENDOR_INVENTORY: Dict[str, InventoryItem] = {
    "INV-CU-01": InventoryItem(
        inventory_id="INV-CU-01",
        material_category=WasteCategory.RECYCLABLE,
        material_name="Grade-A Copper Scrap (Stripped Wire / Windings)",
        current_stock_kg=145.5,
        item_count=0,
        average_procured_price_per_kg=685.0,
        storage_bay_location="Bay A-1 (Secure Non-Ferrous Lockup)",
        segregation_compliant=True,
        co_storage_notes="Segregated in covered moisture-proof steel bins. Separated from ferrous materials.",
        last_restocked=datetime.now(timezone.utc) - timedelta(hours=6)
    ),
    "INV-AL-01": InventoryItem(
        inventory_id="INV-AL-01",
        material_category=WasteCategory.RECYCLABLE,
        material_name="Clean Cast Aluminum Scrap",
        current_stock_kg=320.0,
        item_count=0,
        average_procured_price_per_kg=168.0,
        storage_bay_location="Bay A-2 (Heavy Metals Sorting Deck)",
        segregation_compliant=True,
        co_storage_notes="Stored on wooden pallets away from chemical drums.",
        last_restocked=datetime.now(timezone.utc) - timedelta(days=1)
    ),
    "INV-PL-01": InventoryItem(
        inventory_id="INV-PL-01",
        material_category=WasteCategory.RECYCLABLE,
        material_name="Compacted Clear PET Plastic Bales",
        current_stock_kg=850.0,
        item_count=0,
        average_procured_price_per_kg=32.5,
        storage_bay_location="Bay C-1 (Baled Polymer Dry Shed)",
        segregation_compliant=True,
        co_storage_notes="Protected from UV sunlight and moisture.",
        last_restocked=datetime.now(timezone.utc) - timedelta(days=2)
    ),
    "INV-EW-01": InventoryItem(
        inventory_id="INV-EW-01",
        material_category=WasteCategory.E_WASTE,
        material_name="Dismantled Circuit Boards (PCBs)",
        current_stock_kg=48.0,
        item_count=65,
        average_procured_price_per_kg=390.0,
        storage_bay_location="Bay E-1 (Anti-Static E-Waste Vault)",
        segregation_compliant=True,
        co_storage_notes="Anti-static containers. Batteries strictly isolated in Hazmat Shed.",
        last_restocked=datetime.now(timezone.utc) - timedelta(hours=12)
    ),
}

class VendorService:
    def get_dashboard_summary(self, vendor_id: str = "vendor_apex_metals_01") -> VendorDashboardSummary:
        inv_list = list(VENDOR_INVENTORY.values())
        total_weight = sum(item.current_stock_kg for item in inv_list)
        total_value = sum(item.current_stock_kg * item.average_procured_price_per_kg for item in inv_list)

        # Incoming lots awaiting vendor inspection
        incoming_lots = [
            lot for lot in LOTS_DATABASE.values()
            if lot.status in [LotStatus.CREATED, LotStatus.OFFERED] and lot.current_custodian_id != vendor_id
        ]

        # Active transactions
        active_txns = [
            t for t in TRANSACTIONS_DATABASE.values()
            if t.transfer_status not in [TransferStatus.CONFIRMED, TransferStatus.CANCELLED]
        ]
        completed_txns = [
            t for t in TRANSACTIONS_DATABASE.values()
            if t.transfer_status == TransferStatus.CONFIRMED
        ]

        return VendorDashboardSummary(
            vendor_id=vendor_id,
            business_name="Apex Scrap Traders & Aggregators (Vendor)",
            verification_status="VERIFIED_TIER_1_AGGREGATOR",
            total_inventory_weight_kg=round(total_weight, 1),
            total_inventory_value_inr=round(total_value, 2),
            pending_incoming_lots_count=len(incoming_lots),
            active_transactions_count=len(active_txns),
            completed_handover_count=len(completed_txns),
            inventory_by_category=inv_list,
        )

    def get_incoming_lots_queue(self) -> List[DigitalWasteLot]:
        return [
            lot for lot in LOTS_DATABASE.values()
            if lot.status in [LotStatus.CREATED, LotStatus.OFFERED]
        ]

    def inspect_and_offer(self, req: VendorInspectionRequest) -> Dict[str, Any]:
        """
        Vendor performs physical scale inspection of incoming lot,
        records scale weight, adjusts contamination, and creates a formal purchase offer transaction.
        """
        lot = LOTS_DATABASE.get(req.lot_id)
        if not lot:
            raise ValueError(f"Lot {req.lot_id} not found.")

        eff_weight = max(0.0, req.physical_scale_weight_kg - req.contamination_weight_deduction_kg)

        # Create Transaction
        txn_req = TransactionCreateRequest(
            lot_id=req.lot_id,
            sender_id=lot.creator_id,
            sender_name=lot.creator_name,
            sender_role=lot.creator_role,
            receiver_id=req.vendor_id,
            receiver_name="Apex Scrap Traders (Vendor)",
            receiver_role=UserRole.VENDOR,
            material_category=lot.category,
            item_title=lot.item_title,
            measured_weight_kg=eff_weight,
            item_count=req.actual_item_count,
            agreed_unit_price=req.offered_price_per_kg,
            pricing_unit="INR_PER_KG",
            payment_method=req.payment_method,
            location_name="Apex Warehouse Weighbridge, Mayapuri",
            notes=f"Physical inspection completed: Scale measured {req.physical_scale_weight_kg}kg, Contamination deduction: {req.contamination_weight_deduction_kg}kg. Condition: {req.condition_grade}."
        )

        txn = transaction_service.create_transaction(txn_req)

        # Update lot measured scale weight and status
        lot.measured_weight_kg = eff_weight
        lot.status = LotStatus.OFFERED
        lot.updated_at = datetime.now(timezone.utc)

        return {
            "status": "OFFER_SUBMITTED",
            "transaction_id": txn.transaction_id,
            "lot_id": lot.lot_id,
            "inspected_scale_weight_kg": req.physical_scale_weight_kg,
            "effective_payable_weight_kg": eff_weight,
            "offered_rate_per_kg": req.offered_price_per_kg,
            "total_offered_amount": round(eff_weight * req.offered_price_per_kg, 2),
            "message": f"Physical inspection verified. Purchase offer of ₹{round(eff_weight * req.offered_price_per_kg, 2)} sent to collector {lot.creator_name}."
        }

    def create_onward_lot_for_recycler(self, req: OnwardLotCreationRequest) -> DigitalWasteLot:
        """
        Vendor aggregates inventory and creates an onward bulk lot for sale to an authorized recycler.
        """
        lot_id = f"LOT-BULK-{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now(timezone.utc)

        lot = DigitalWasteLot(
            lot_id=lot_id,
            creator_id=req.vendor_id,
            creator_name="Apex Scrap Traders (Vendor)",
            creator_role=UserRole.VENDOR,
            current_custodian_id=req.vendor_id,
            current_custodian_name="Apex Scrap Traders (Vendor)",
            current_custodian_role=UserRole.VENDOR,
            item_title=f"Aggregated Commercial Batch: {req.material_name}",
            category=req.material_category,
            measured_weight_kg=req.aggregated_weight_kg,
            item_count=None,
            condition="Aggregated Industrial Grade",
            estimated_reference_value=round(req.aggregated_weight_kg * req.asking_price_per_kg, 2),
            status=LotStatus.CREATED,
            origin_location=req.storage_origin_bay,
            latitude=28.6328,
            longitude=77.1232,
            created_at=now,
            updated_at=now,
        )

        LOTS_DATABASE[lot_id] = lot
        return lot

vendor_service = VendorService()
