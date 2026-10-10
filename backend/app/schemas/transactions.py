from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.triage import WasteCategory
from app.schemas.handover import UserRole

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNVERIFIED = "UNVERIFIED"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    DISPUTED = "DISPUTED"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT_LEDGER = "CREDIT_LEDGER"

class TransferStatus(str, Enum):
    CREATED = "CREATED"
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    IN_TRANSIT = "IN_TRANSIT"
    RECEIVED = "RECEIVED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"

class DiscrepancyReport(BaseModel):
    has_discrepancy: bool = False
    sender_claimed_weight_kg: Optional[float] = None
    receiver_measured_weight_kg: Optional[float] = None
    weight_difference_kg: Optional[float] = None
    contamination_deduction_kg: float = 0.0
    reason: Optional[str] = None
    resolved: bool = False
    resolution_notes: Optional[str] = None

class TransactionAuditRecord(BaseModel):
    audit_id: str
    timestamp: datetime
    performed_by_user_id: str
    performed_by_role: UserRole
    previous_transfer_status: Optional[TransferStatus] = None
    new_transfer_status: Optional[TransferStatus] = None
    previous_payment_status: Optional[PaymentStatus] = None
    new_payment_status: Optional[PaymentStatus] = None
    change_description: str
    evidence_url: Optional[str] = None

class TransactionCreateRequest(BaseModel):
    lot_id: str
    sender_id: str
    sender_name: str
    sender_role: UserRole
    receiver_id: str
    receiver_name: str
    receiver_role: UserRole
    material_category: WasteCategory
    item_title: str
    measured_weight_kg: Optional[float] = Field(default=None, ge=0.0)
    item_count: Optional[int] = Field(default=None, ge=0)
    agreed_unit_price: float = Field(ge=0.0, description="Agreed price per kg or per unit")
    pricing_unit: str = "INR_PER_KG"
    payment_method: PaymentMethod = PaymentMethod.UPI
    location_name: str = "Mayapuri Scrap Yard, New Delhi"
    latitude: Optional[float] = 28.6328
    longitude: Optional[float] = 77.1232
    photos: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class TransactionConfirmReceiptRequest(BaseModel):
    receiver_id: str
    receiver_measured_weight_kg: Optional[float] = Field(default=None, ge=0.0)
    receiver_item_count: Optional[int] = Field(default=None, ge=0)
    has_contamination: bool = False
    contamination_weight_deduction_kg: float = 0.0
    contamination_deduction_kg: float = 0.0
    inspection_notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TransactionPaymentUpdateRequest(BaseModel):
    updated_by_user_id: str
    payment_status: PaymentStatus
    amount_paid: float = Field(ge=0.0)
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    notes: Optional[str] = None

class TransactionDisputeRequest(BaseModel):
    disputed_by_user_id: str
    disputed_by_role: UserRole
    reason: str
    evidence_urls: List[str] = Field(default_factory=list)

class Transaction(BaseModel):
    transaction_id: str
    lot_id: str
    # Parties
    sender_id: str
    sender_name: str
    sender_role: UserRole
    sender_verification_status: VerificationStatus
    receiver_id: str
    receiver_name: str
    receiver_role: UserRole
    receiver_verification_status: VerificationStatus
    # Material Specs
    material_category: WasteCategory
    item_title: str
    sender_measured_weight_kg: Optional[float] = None
    receiver_measured_weight_kg: Optional[float] = None
    effective_weight_kg: Optional[float] = None
    item_count: Optional[int] = None
    condition: str = "Standard"
    # Pricing & Financials
    agreed_unit_price: float
    pricing_unit: str
    gross_amount: float
    deductions_amount: float = 0.0
    final_payable_amount: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    payment_reference: Optional[str] = None
    amount_paid_so_far: float = 0.0
    # Transfer State
    transfer_status: TransferStatus
    discrepancy: DiscrepancyReport = Field(default_factory=DiscrepancyReport)
    # Geolocation & Verification
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: List[str] = Field(default_factory=list)
    qr_verification_token: Optional[str] = None
    secure_verification_url: Optional[str] = None
    # Timestamps & Audit
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    audit_history: List[TransactionAuditRecord] = Field(default_factory=list)
