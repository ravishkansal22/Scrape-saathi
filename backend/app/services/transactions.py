import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from app.schemas.triage import WasteCategory
from app.schemas.handover import UserRole, LotStatus
from app.schemas.transactions import (
    VerificationStatus,
    PaymentStatus,
    PaymentMethod,
    TransferStatus,
    DiscrepancyReport,
    TransactionAuditRecord,
    TransactionCreateRequest,
    TransactionConfirmReceiptRequest,
    TransactionPaymentUpdateRequest,
    TransactionDisputeRequest,
    Transaction,
)
from app.services.handover import LOTS_DATABASE

TRANSACTIONS_DATABASE: Dict[str, Transaction] = {}

def _init_sample_transactions():
    if TRANSACTIONS_DATABASE:
        return
    now = datetime.now(timezone.utc)
    
    # Sample Completed Transaction
    txn_1 = Transaction(
        transaction_id="TXN-9F8E7D6C",
        lot_id="LOT-4E8F2A10",
        sender_id="kabadi_suresh_02",
        sender_name="Suresh Pal (Collector)",
        sender_role=UserRole.KABADIWALA,
        sender_verification_status=VerificationStatus.VERIFIED,
        receiver_id="vendor_apex_metals_01",
        receiver_name="Apex Scrap Traders (Vendor)",
        receiver_role=UserRole.VENDOR,
        receiver_verification_status=VerificationStatus.VERIFIED,
        material_category=WasteCategory.RECYCLABLE,
        item_title="Baled PET Plastic Bottles & Polypropylene Cans",
        sender_measured_weight_kg=86.0,
        receiver_measured_weight_kg=85.0,
        effective_weight_kg=85.0,
        item_count=None,
        condition="Compacted Bales",
        agreed_unit_price=34.0,
        pricing_unit="INR_PER_KG",
        gross_amount=2890.0,
        deductions_amount=0.0,
        final_payable_amount=2890.0,
        payment_method=PaymentMethod.UPI,
        payment_status=PaymentStatus.PAID,
        payment_reference="UPI/20261009/8923746198",
        amount_paid_so_far=2890.0,
        transfer_status=TransferStatus.CONFIRMED,
        discrepancy=DiscrepancyReport(
            has_discrepancy=True,
            sender_claimed_weight_kg=86.0,
            receiver_measured_weight_kg=85.0,
            weight_difference_kg=-1.0,
            contamination_deduction_kg=0.0,
            reason="Scale calibration variance (-1.0 kg). Mutually agreed to settle on receiver calibrated platform scale.",
            resolved=True,
            resolution_notes="Adjusted total amount to 85.0 kg × ₹34 = ₹2890."
        ),
        location_name="Noida Sector 63 Yard",
        latitude=28.6180,
        longitude=77.3820,
        photos=["https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400"],
        qr_verification_token="TOKEN-VERIFIED-TXN-1",
        secure_verification_url="https://scrapsetu.org/verify-txn/TXN-9F8E7D6C",
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=2),
        confirmed_at=now - timedelta(hours=2),
        audit_history=[
            TransactionAuditRecord(
                audit_id="AUD-001",
                timestamp=now - timedelta(days=1),
                performed_by_user_id="kabadi_suresh_02",
                performed_by_role=UserRole.KABADIWALA,
                previous_transfer_status=None,
                new_transfer_status=TransferStatus.CREATED,
                previous_payment_status=None,
                new_payment_status=PaymentStatus.PENDING,
                change_description="Handover initiated by Suresh Pal with claimed 86.0 kg."
            ),
            TransactionAuditRecord(
                audit_id="AUD-002",
                timestamp=now - timedelta(hours=2),
                performed_by_user_id="vendor_apex_metals_01",
                performed_by_role=UserRole.VENDOR,
                previous_transfer_status=TransferStatus.CREATED,
                new_transfer_status=TransferStatus.CONFIRMED,
                previous_payment_status=PaymentStatus.PENDING,
                new_payment_status=PaymentStatus.PAID,
                change_description="Physical platform scale recorded 85.0 kg. Payment of ₹2890 settled via UPI."
            )
        ]
    )
    TRANSACTIONS_DATABASE[txn_1.transaction_id] = txn_1

_init_sample_transactions()

class TransactionService:
    def create_transaction(self, req: TransactionCreateRequest) -> Transaction:
        txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc)

        # Quantity & Financial Calculations
        weight = req.measured_weight_kg
        count = req.item_count
        unit_price = req.agreed_unit_price

        if weight is not None and weight > 0:
            gross = weight * unit_price
            eff_weight = weight
        elif count is not None and count > 0:
            gross = float(count) * unit_price
            eff_weight = None
        else:
            gross = 0.0
            eff_weight = 0.0

        txn = Transaction(
            transaction_id=txn_id,
            lot_id=req.lot_id,
            sender_id=req.sender_id,
            sender_name=req.sender_name,
            sender_role=req.sender_role,
            sender_verification_status=VerificationStatus.VERIFIED,
            receiver_id=req.receiver_id,
            receiver_name=req.receiver_name,
            receiver_role=req.receiver_role,
            receiver_verification_status=VerificationStatus.VERIFIED,
            material_category=req.material_category,
            item_title=req.item_title,
            sender_measured_weight_kg=weight,
            receiver_measured_weight_kg=None,
            effective_weight_kg=eff_weight,
            item_count=count,
            condition="Standard",
            agreed_unit_price=unit_price,
            pricing_unit=req.pricing_unit,
            gross_amount=round(gross, 2),
            deductions_amount=0.0,
            final_payable_amount=round(gross, 2),
            payment_method=req.payment_method,
            payment_status=PaymentStatus.PENDING,
            payment_reference=None,
            amount_paid_so_far=0.0,
            transfer_status=TransferStatus.OFFERED,
            discrepancy=DiscrepancyReport(),
            location_name=req.location_name,
            latitude=req.latitude,
            longitude=req.longitude,
            photos=req.photos,
            qr_verification_token=f"QR-TXN-{txn_id}",
            secure_verification_url=f"https://scrapsetu.org/verify-txn/{txn_id}",
            created_at=now,
            updated_at=now,
            confirmed_at=None,
            audit_history=[
                TransactionAuditRecord(
                    audit_id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
                    timestamp=now,
                    performed_by_user_id=req.sender_id,
                    performed_by_role=req.sender_role,
                    previous_transfer_status=None,
                    new_transfer_status=TransferStatus.OFFERED,
                    previous_payment_status=None,
                    new_payment_status=PaymentStatus.PENDING,
                    change_description=f"Transaction offer created by {req.sender_name} for {req.item_title}."
                )
            ]
        )

        TRANSACTIONS_DATABASE[txn_id] = txn

        # Update lot status if exists
        if req.lot_id in LOTS_DATABASE:
            lot = LOTS_DATABASE[req.lot_id]
            lot.status = LotStatus.OFFERED
            lot.updated_at = now

        return txn

    def get_all_transactions(self) -> List[Transaction]:
        return list(TRANSACTIONS_DATABASE.values())

    def get_transaction_by_id(self, txn_id: str) -> Optional[Transaction]:
        return TRANSACTIONS_DATABASE.get(txn_id)

    def confirm_receipt(self, txn_id: str, req: TransactionConfirmReceiptRequest) -> Transaction:
        txn = TRANSACTIONS_DATABASE.get(txn_id)
        if not txn:
            raise ValueError(f"Transaction {txn_id} not found.")

        now = datetime.now(timezone.utc)
        prev_transfer = txn.transfer_status

        # Record receiver physical scale measurement
        txn.receiver_measured_weight_kg = req.receiver_measured_weight_kg
        if req.receiver_item_count is not None:
            txn.item_count = req.receiver_item_count

        # Check for weight discrepancy between sender claim & receiver scale
        has_discrepancy = False
        discrepancy_reason = []

        if txn.sender_measured_weight_kg is not None and req.receiver_measured_weight_kg is not None:
            diff = round(req.receiver_measured_weight_kg - txn.sender_measured_weight_kg, 2)
            if abs(diff) > 0.2:  # > 200 grams difference
                has_discrepancy = True
                discrepancy_reason.append(f"Physical scale discrepancy: Sender recorded {txn.sender_measured_weight_kg}kg, Receiver verified {req.receiver_measured_weight_kg}kg (diff: {diff:+}kg).")

        if req.has_contamination and req.contamination_weight_deduction_kg > 0:
            has_discrepancy = True
            discrepancy_reason.append(f"Contamination deduction applied: {req.contamination_weight_deduction_kg}kg.")

        # Compute final effective quantity & recalculate price
        if req.receiver_measured_weight_kg is not None:
            eff_weight = max(0.0, req.receiver_measured_weight_kg - req.contamination_weight_deduction_kg)
            txn.effective_weight_kg = eff_weight
            txn.gross_amount = round(req.receiver_measured_weight_kg * txn.agreed_unit_price, 2)
            txn.deductions_amount = round(req.contamination_weight_deduction_kg * txn.agreed_unit_price, 2)
            txn.final_payable_amount = round(eff_weight * txn.agreed_unit_price, 2)
        elif txn.item_count is not None:
            txn.final_payable_amount = round(float(txn.item_count) * txn.agreed_unit_price, 2)

        txn.discrepancy = DiscrepancyReport(
            has_discrepancy=has_discrepancy,
            sender_claimed_weight_kg=txn.sender_measured_weight_kg,
            receiver_measured_weight_kg=req.receiver_measured_weight_kg,
            weight_difference_kg=round(req.receiver_measured_weight_kg - (txn.sender_measured_weight_kg or 0), 2) if (req.receiver_measured_weight_kg and txn.sender_measured_weight_kg) else None,
            contamination_deduction_kg=req.contamination_weight_deduction_kg,
            reason="; ".join(discrepancy_reason) if discrepancy_reason else "No discrepancy observed.",
            resolved=not has_discrepancy,
            resolution_notes=req.inspection_notes
        )

        txn.transfer_status = TransferStatus.CONFIRMED
        txn.confirmed_at = now
        txn.updated_at = now

        # Add immutable audit log
        txn.audit_history.append(
            TransactionAuditRecord(
                audit_id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
                timestamp=now,
                performed_by_user_id=req.receiver_id,
                performed_by_role=txn.receiver_role,
                previous_transfer_status=prev_transfer,
                new_transfer_status=TransferStatus.CONFIRMED,
                previous_payment_status=txn.payment_status,
                new_payment_status=txn.payment_status,
                change_description=f"Receipt verified by {txn.receiver_name} on calibrated scale ({req.receiver_measured_weight_kg}kg). Final amount: ₹{txn.final_payable_amount}."
            )
        )

        # Update lot custodian & status
        if txn.lot_id in LOTS_DATABASE:
            lot = LOTS_DATABASE[txn.lot_id]
            lot.status = LotStatus.RECEIVED
            lot.current_custodian_id = txn.receiver_id
            lot.current_custodian_name = txn.receiver_name
            lot.current_custodian_role = txn.receiver_role
            lot.measured_weight_kg = txn.effective_weight_kg
            lot.updated_at = now

        return txn

    def update_payment(self, txn_id: str, req: TransactionPaymentUpdateRequest) -> Transaction:
        txn = TRANSACTIONS_DATABASE.get(txn_id)
        if not txn:
            raise ValueError(f"Transaction {txn_id} not found.")

        now = datetime.now(timezone.utc)
        prev_payment = txn.payment_status

        txn.payment_status = req.payment_status
        txn.amount_paid_so_far = req.amount_paid
        txn.payment_method = req.payment_method
        if req.payment_reference:
            txn.payment_reference = req.payment_reference
        txn.updated_at = now

        txn.audit_history.append(
            TransactionAuditRecord(
                audit_id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
                timestamp=now,
                performed_by_user_id=req.updated_by_user_id,
                performed_by_role=txn.receiver_role,
                previous_transfer_status=txn.transfer_status,
                new_transfer_status=txn.transfer_status,
                previous_payment_status=prev_payment,
                new_payment_status=req.payment_status,
                change_description=f"Payment updated to {req.payment_status.value} (Amount: ₹{req.amount_paid}, Ref: {req.payment_reference or 'N/A'}). {req.notes or ''}"
            )
        )

        return txn

    def raise_dispute(self, txn_id: str, req: TransactionDisputeRequest) -> Transaction:
        txn = TRANSACTIONS_DATABASE.get(txn_id)
        if not txn:
            raise ValueError(f"Transaction {txn_id} not found.")

        now = datetime.now(timezone.utc)
        prev_transfer = txn.transfer_status

        txn.transfer_status = TransferStatus.DISPUTED
        txn.updated_at = now
        txn.discrepancy.resolved = False
        txn.discrepancy.resolution_notes = f"Dispute opened: {req.reason}"

        txn.audit_history.append(
            TransactionAuditRecord(
                audit_id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
                timestamp=now,
                performed_by_user_id=req.disputed_by_user_id,
                performed_by_role=req.disputed_by_role,
                previous_transfer_status=prev_transfer,
                new_transfer_status=TransferStatus.DISPUTED,
                previous_payment_status=txn.payment_status,
                new_payment_status=PaymentStatus.DISPUTED,
                change_description=f"DISPUTE RAISED by {req.disputed_by_user_id}: {req.reason}"
            )
        )

        return txn

transaction_service = TransactionService()
