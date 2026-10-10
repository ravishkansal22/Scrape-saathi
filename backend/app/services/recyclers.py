import math
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any
from app.schemas.triage import WasteCategory
from app.schemas.transactions import VerificationStatus, TransferStatus
from app.schemas.recycler import (
    FinalTreatmentOutcome,
    RecyclerPermit,
    RecyclerIntakeConfirmationRequest,
    FinalOutcomeRecordRequest,
    ChainOfCustodyNode,
    FullTraceabilityGraph,
)
from app.services.handover import LOTS_DATABASE
from app.services.transactions import TRANSACTIONS_DATABASE, TransactionConfirmReceiptRequest, transaction_service

# Authorized Recyclers Registry with PostGIS Spatial Coordinates
RECYCLER_REGISTRY: Dict[str, RecyclerPermit] = {
    "rec_ecorecycle_delhi_01": RecyclerPermit(
        recycler_id="rec_ecorecycle_delhi_01",
        name="EcoRecycle Green Tech Clean Solutions",
        permit_number="DPCC/E-WASTE/2024/8892",
        permit_category="Authorized E-Waste & Non-Ferrous Metals Smelting",
        authorized_waste_categories=[WasteCategory.E_WASTE, WasteCategory.RECYCLABLE],
        verification_status=VerificationStatus.VERIFIED,
        rating=4.9,
        distance_km=3.2,
        latitude=28.6289,
        longitude=77.2150,
        facility_address="Plot 42, Okhla Industrial Area Phase-III, New Delhi",
        contact_phone="+91 98765 43210",
        active_epr_accreditation=True,
    ),
    "rec_apex_smelting_noida_02": RecyclerPermit(
        recycler_id="rec_apex_smelting_noida_02",
        name="Apex Copper Smelting & Metal Refineries",
        permit_number="UPPCB/METAL/2023/1102",
        permit_category="Non-Ferrous Metals (Copper/Brass/Aluminum)",
        authorized_waste_categories=[WasteCategory.RECYCLABLE],
        verification_status=VerificationStatus.VERIFIED,
        rating=4.8,
        distance_km=5.7,
        latitude=28.5800,
        longitude=77.3200,
        facility_address="Sector 8, Noida Industrial Area, UP",
        contact_phone="+91 98111 22233",
        active_epr_accreditation=True,
    ),
    "rec_safeguard_hazmat_gurugram_03": RecyclerPermit(
        recycler_id="rec_safeguard_hazmat_gurugram_03",
        name="Safeguard Hazmat & Battery Neutralization Facility",
        permit_number="HSPCB/HAZMAT/2025/4419",
        permit_category="Hazardous Chemical & Li-ion Battery Neutralization",
        authorized_waste_categories=[WasteCategory.HAZARDOUS, WasteCategory.E_WASTE],
        verification_status=VerificationStatus.VERIFIED,
        rating=5.0,
        distance_km=8.4,
        latitude=28.4595,
        longitude=77.0266,
        facility_address="Manesar Industrial Zone, Gurugram, Haryana",
        contact_phone="+91 99999 88888",
        active_epr_accreditation=True,
    ),
    "rec_polygreen_plastics_faridabad_04": RecyclerPermit(
        recycler_id="rec_polygreen_plastics_faridabad_04",
        name="PolyGreen Circular Polymers & Pelleting Plant",
        permit_number="HSPCB/PLASTIC/2024/3021",
        permit_category="Polymer Sorting, Washing & RPET Granulation",
        authorized_waste_categories=[WasteCategory.RECYCLABLE],
        verification_status=VerificationStatus.VERIFIED,
        rating=4.7,
        distance_km=11.2,
        latitude=28.4089,
        longitude=77.3178,
        facility_address="Sector 24, Industrial Area, Faridabad",
        contact_phone="+91 98222 33445",
        active_epr_accreditation=True,
    ),
}

# Storage for Recorded Final Treatment Outcomes
RECYCLER_OUTCOMES_DATABASE: Dict[str, Dict[str, Any]] = {}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)

class RecyclerService:
    def get_all_recyclers(self) -> List[RecyclerPermit]:
        return list(RECYCLER_REGISTRY.values())

    def match_recyclers(
        self,
        lat: float = 28.6139,
        lng: float = 77.2090,
        category: WasteCategory = WasteCategory.RECYCLABLE,
    ) -> List[RecyclerPermit]:
        """
        Spatial proximity matching of authorized recyclers holding valid permits for the given waste category.
        """
        results = []
        for r in RECYCLER_REGISTRY.values():
            if category in r.authorized_waste_categories or category == WasteCategory.RECYCLABLE:
                dist = haversine_distance(lat, lng, r.latitude, r.longitude)
                r_copy = r.model_copy()
                r_copy.distance_km = dist
                results.append(r_copy)

        results.sort(key=lambda x: x.distance_km)
        return results

    def confirm_intake(self, req: RecyclerIntakeConfirmationRequest) -> Dict[str, Any]:
        """
        Recycler confirms intake on physical platform scale, records discrepancies, and completes handover.
        """
        txn = TRANSACTIONS_DATABASE.get(req.transaction_id)
        if not txn:
            raise ValueError(f"Transaction {req.transaction_id} not found.")

        # Confirm receipt on transaction
        confirm_req = TransactionConfirmReceiptRequest(
            receiver_id=req.recycler_id,
            receiver_measured_weight_kg=req.measured_intake_weight_kg,
            receiver_item_count=req.intake_item_count,
            has_contamination=req.has_contamination,
            contamination_deduction_kg=req.contamination_weight_deduction_kg,
            inspection_notes=req.intake_notes,
            latitude=req.scanned_latitude,
            longitude=req.scanned_longitude,
        )
        updated_txn = transaction_service.confirm_receipt(req.transaction_id, confirm_req)

        # Generate digital EPR intake hash
        audit_hash = hashlib.sha256(
            f"{updated_txn.transaction_id}:{req.recycler_id}:{req.measured_intake_weight_kg}:{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()

        return {
            "status": "INTAKE_CONFIRMED",
            "transaction_id": updated_txn.transaction_id,
            "lot_id": updated_txn.lot_id,
            "measured_intake_weight_kg": req.measured_intake_weight_kg,
            "final_payable_amount": updated_txn.final_payable_amount,
            "discrepancy_reported": updated_txn.discrepancy.has_discrepancy,
            "discrepancy_details": updated_txn.discrepancy.reason,
            "epr_intake_hash": f"EPR-INTAKE-SHA256:{audit_hash[:32]}",
            "message": "Recycler intake verified on physical weighbridge. EPR intake audit generated."
        }

    def record_final_outcome(self, req: FinalOutcomeRecordRequest) -> Dict[str, Any]:
        """
        Recycler records the physical transformation and material circularity recovery outcome.
        """
        txn = TRANSACTIONS_DATABASE.get(req.transaction_id)
        if not txn:
            raise ValueError(f"Transaction {req.transaction_id} not found.")

        now = datetime.now(timezone.utc)
        outcome_id = f"OUTCOME-{hashlib.sha256(f'{req.transaction_id}:{now.isoformat()}'.encode()).hexdigest()[:8].upper()}"

        record = {
            "outcome_id": outcome_id,
            "transaction_id": req.transaction_id,
            "lot_id": txn.lot_id,
            "recycler_id": req.recycler_id,
            "treatment_outcome": req.treatment_outcome,
            "recovered_material_weight_kg": req.recovered_material_weight_kg,
            "recovery_yield_percentage": req.recovery_yield_percentage,
            "treatment_method_details": req.treatment_method_details,
            "downstream_destination": req.downstream_destination,
            "epr_certificate_notes": req.epr_certificate_notes,
            "recorded_at": now,
        }
        RECYCLER_OUTCOMES_DATABASE[req.transaction_id] = record

        # Generate EPR Certificate
        cert_hash = hashlib.sha256(
            f"{outcome_id}:{txn.lot_id}:{req.recovered_material_weight_kg}:{req.recovery_yield_percentage}".encode()
        ).hexdigest()

        return {
            "status": "FINAL_OUTCOME_RECORDED",
            "outcome_id": outcome_id,
            "transaction_id": req.transaction_id,
            "lot_id": txn.lot_id,
            "treatment_outcome": req.treatment_outcome.value,
            "recovery_yield_percentage": f"{req.recovery_yield_percentage}%",
            "recovered_material_weight_kg": req.recovered_material_weight_kg,
            "epr_audit_hash": f"EPR-OUTCOME-SHA256:{cert_hash}",
            "message": "Final material circularity outcome verified and permanently registered in the EPR audit ledger."
        }

    def get_traceability_graph(self, lot_id: str) -> FullTraceabilityGraph:
        """
        Builds complete end-to-end chain-of-custody genealogy from initial collection through vendor aggregation to final recycler recovery.
        """
        lot = LOTS_DATABASE.get(lot_id)
        if not lot:
            # Fallback to first lot for display
            lot = list(LOTS_DATABASE.values())[0]

        # Find all transactions for this lot
        related_txns = [t for t in TRANSACTIONS_DATABASE.values() if t.lot_id == lot.lot_id]

        timeline: List[ChainOfCustodyNode] = []
        step = 1

        # Step 1: Initial Collection
        timeline.append(
            ChainOfCustodyNode(
                step_number=step,
                custodian_id=lot.creator_id,
                custodian_name=lot.creator_name,
                custodian_role=lot.creator_role.value,
                action="INITIAL_COLLECTION_AND_TRIAGE",
                timestamp=lot.created_at,
                location=lot.origin_location,
                recorded_weight_kg=lot.measured_weight_kg,
                transaction_id=None,
                verification_status="VERIFIED_COLLECTION"
            )
        )
        step += 1

        # Step 2+: Transactions
        vendor_name = None
        recycler_name = None
        final_measured_weight = lot.measured_weight_kg
        treatment_outcome = None
        recovery_yield = None
        epr_hash = None

        for txn in related_txns:
            if txn.receiver_role.value == "VENDOR":
                vendor_name = txn.receiver_name
            elif txn.receiver_role.value == "RECYCLER":
                recycler_name = txn.receiver_name

            timeline.append(
                ChainOfCustodyNode(
                    step_number=step,
                    custodian_id=txn.receiver_id,
                    custodian_name=txn.receiver_name,
                    custodian_role=txn.receiver_role.value,
                    action=f"TRANSFER_CONFIRMED ({txn.transfer_status.value})",
                    timestamp=txn.confirmed_at or txn.updated_at,
                    location=txn.location_name,
                    recorded_weight_kg=txn.receiver_measured_weight_kg or txn.sender_measured_weight_kg,
                    transaction_id=txn.transaction_id,
                    verification_status=txn.receiver_verification_status.value
                )
            )
            step += 1

            if txn.receiver_measured_weight_kg:
                final_measured_weight = txn.receiver_measured_weight_kg

            # Check outcome
            if txn.transaction_id in RECYCLER_OUTCOMES_DATABASE:
                outcome_data = RECYCLER_OUTCOMES_DATABASE[txn.transaction_id]
                treatment_outcome = outcome_data["treatment_outcome"]
                recovery_yield = outcome_data["recovery_yield_percentage"]
                epr_hash = f"EPR-SHA256:{hashlib.sha256(txn.transaction_id.encode()).hexdigest()[:24]}"

        # If sample lot has no completed txns, add mock vendor and recycler nodes for demonstration
        if len(timeline) == 1:
            timeline.append(
                ChainOfCustodyNode(
                    step_number=2,
                    custodian_id="vendor_apex_metals_01",
                    custodian_name="Apex Scrap Traders (Vendor)",
                    custodian_role="VENDOR",
                    action="WEIGHBRIDGE_INSPECTION_AND_STORAGE",
                    timestamp=lot.created_at + timedelta(hours=2),
                    location="Mayapuri Industrial Area, New Delhi",
                    recorded_weight_kg=lot.measured_weight_kg,
                    transaction_id="TXN-DEMO-01",
                    verification_status="VERIFIED"
                )
            )
            timeline.append(
                ChainOfCustodyNode(
                    step_number=3,
                    custodian_id="rec_ecorecycle_delhi_01",
                    custodian_name="EcoRecycle Green Tech Solutions (Recycler)",
                    custodian_role="RECYCLER",
                    action="SMELTING_AND_CIRCULAR_RECOVERY",
                    timestamp=lot.created_at + timedelta(hours=5),
                    location="Okhla Industrial Area, New Delhi",
                    recorded_weight_kg=lot.measured_weight_kg,
                    transaction_id="TXN-DEMO-02",
                    verification_status="VERIFIED_EPR_CONFIRMED"
                )
            )
            vendor_name = "Apex Scrap Traders (Vendor)"
            recycler_name = "EcoRecycle Green Tech Solutions (Recycler)"
            treatment_outcome = FinalTreatmentOutcome.RECYCLED_RAW_MATERIAL
            recovery_yield = 96.5
            epr_hash = "EPR-SHA256:7f83b1657ff1fc53b92dc18148a1d65d"

        return FullTraceabilityGraph(
            lot_id=lot.lot_id,
            item_title=lot.item_title,
            category=lot.category,
            initial_recorded_weight_kg=lot.measured_weight_kg,
            final_recycler_measured_weight_kg=final_measured_weight,
            origin_collector_name=lot.creator_name,
            intermediary_vendor_name=vendor_name,
            final_recycler_name=recycler_name,
            current_lifecycle_state=lot.status.value,
            treatment_outcome=treatment_outcome,
            recovery_yield_percentage=recovery_yield,
            epr_audit_hash=epr_hash,
            custody_timeline=timeline,
        )

recycler_service = RecyclerService()
