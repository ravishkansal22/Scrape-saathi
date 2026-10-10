from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.transactions import (
    Transaction,
    TransactionCreateRequest,
    TransactionConfirmReceiptRequest,
    TransactionPaymentUpdateRequest,
    TransactionDisputeRequest,
)
from app.services.transactions import transaction_service

router = APIRouter(prefix="/api/v1/transactions", tags=["Traceable Transactions & Payment Ledger"])

@router.post("/create", response_model=Transaction)
def create_handover_transaction(req: TransactionCreateRequest):
    """
    Initiates a formal digital waste transaction with unique Transaction ID,
    recording sender/receiver roles, agreed price, payment method, and physical weight.
    """
    try:
        return transaction_service.create_transaction(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction Creation Error: {str(e)}")

@router.get("", response_model=List[Transaction])
def get_all_transactions():
    """Retrieves all transactions and their current transfer and payment states."""
    return transaction_service.get_all_transactions()

@router.get("/{txn_id}", response_model=Transaction)
def get_transaction_by_id(txn_id: str):
    """Retrieves complete transaction record including audit trail and discrepancy logs."""
    txn = transaction_service.get_transaction_by_id(txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found.")
    return txn

@router.post("/{txn_id}/confirm-receipt", response_model=Transaction)
def confirm_material_receipt(txn_id: str, req: TransactionConfirmReceiptRequest):
    """
    Receiver confirms physical intake on scale, records discrepancy or contamination deductions,
    and transitions state to CONFIRMED.
    """
    try:
        return transaction_service.confirm_receipt(txn_id, req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Confirm Receipt Error: {str(e)}")

@router.post("/{txn_id}/update-payment", response_model=Transaction)
def update_transaction_payment(txn_id: str, req: TransactionPaymentUpdateRequest):
    """
    Updates payment status (Pending, Partially Paid, Paid, Failed, Refunded, Disputed)
    with reference number and audit log entry.
    """
    try:
        return transaction_service.update_payment(txn_id, req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update Payment Error: {str(e)}")

@router.post("/{txn_id}/dispute", response_model=Transaction)
def raise_transaction_dispute(txn_id: str, req: TransactionDisputeRequest):
    """
    Records an authorized user dispute without overwriting previous transaction history.
    """
    try:
        return transaction_service.raise_dispute(txn_id, req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dispute Error: {str(e)}")
