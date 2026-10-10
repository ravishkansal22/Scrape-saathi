const API_BASE_URL = 'http://localhost:8000/api/v1';

export type WasteCategory =
  | 'biodegradable'
  | 'recyclable'
  | 'reusable'
  | 'e-waste'
  | 'hazardous'
  | 'mixed'
  | 'unknown';

export interface MaterialComponent {
  name: string;
  material_type: string;
  purity_grade?: string;
  recyclable: boolean;
  notes?: string;
}

export interface HazardMarkers {
  is_hazardous: boolean;
  battery_damage: boolean;
  chemical_leak: boolean;
  exposed_wiring: boolean;
  pressurized_canister: boolean;
  sharp_edges: boolean;
  hazard_description?: string;
  containment_protocol?: string;
}

export interface SegregationGuidance {
  compatible_materials: string[];
  incompatible_materials: string[];
  segregation_reasoning: string;
  safe_storage_instructions: string;
}

export interface ClarificationOption {
  option_id: string;
  label: string;
  impact_description: string;
}

export interface ClarificationPrompt {
  prompt_id: string;
  question: string;
  options: ClarificationOption[];
}

export interface TriageAnalysisResponse {
  item_title: string;
  category: WasteCategory;
  overall_confidence: number;
  confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  materials_detected: MaterialComponent[];
  contamination_risk: string;
  recycling_potential: string;
  biodegradability_rating: string;
  recommended_pathway: string;
  segregation_guidance: SegregationGuidance;
  hazard_analysis: HazardMarkers;
  safe_handling_guidance: string;
  requires_manual_inspection: boolean;
  manual_inspection_reason?: string;
  clarification_prompt?: ClarificationPrompt;
}

export interface MaterialReferencePrice {
  material_id: string;
  category: string;
  material_name: string;
  grade: string;
  reference_price: number;
  unit: string;
  price_source: string;
  source_type: string;
  is_live_verified: boolean;
  last_updated: string;
  notes?: string;
}

export interface ValuationCalculationResponse {
  material_name: string;
  category: string;
  quantity_type: string;
  measured_quantity: number;
  unit: string;
  reference_unit_price: number;
  effective_unit_price: number;
  is_indicative: boolean;
  price_source: string;
  total_estimated_value: number;
  handling_deduction: number;
  net_payable_estimate: number;
  calculation_breakdown: string;
}

export interface DigitalWasteLot {
  lot_id: string;
  creator_id: string;
  creator_name: string;
  creator_role: string;
  current_custodian_id: string;
  current_custodian_name: string;
  current_custodian_role: string;
  item_title: string;
  category: WasteCategory;
  measured_weight_kg?: number;
  item_count?: number;
  condition: string;
  estimated_reference_value: number;
  hazard_status: HazardMarkers;
  status: string;
  origin_location: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  custody_history: Array<{
    event_id: string;
    timestamp: string;
    from_user_id: string;
    from_user_role: string;
    to_user_id: string;
    to_user_role: string;
    action: string;
    measured_weight_kg?: number;
    notes?: string;
    verification_hash: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface HandoverQRGenerateResponse {
  lot_id: string;
  qr_token: string;
  qr_image_base64: string;
  verification_url: string;
  expires_at: string;
}

export interface QRVerificationResult {
  is_valid: boolean;
  lot_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  item_title: string;
  category: WasteCategory;
  measured_weight_kg?: number;
  item_count?: number;
  lot_status: string;
  hazard_status: HazardMarkers;
  verification_time: string;
  message: string;
}

export interface DiscrepancyReport {
  has_discrepancy: boolean;
  sender_claimed_weight_kg?: number;
  receiver_measured_weight_kg?: number;
  weight_difference_kg?: number;
  contamination_deduction_kg: number;
  reason?: string;
  resolved: boolean;
  resolution_notes?: string;
}

export interface TransactionAuditRecord {
  audit_id: string;
  timestamp: string;
  performed_by_user_id: string;
  performed_by_role: string;
  previous_transfer_status?: string;
  new_transfer_status?: string;
  previous_payment_status?: string;
  new_payment_status?: string;
  change_description: string;
  evidence_url?: string;
}

export interface Transaction {
  transaction_id: string;
  lot_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_verification_status: string;
  receiver_id: string;
  receiver_name: string;
  receiver_role: string;
  receiver_verification_status: string;
  material_category: WasteCategory;
  item_title: string;
  sender_measured_weight_kg?: number;
  receiver_measured_weight_kg?: number;
  effective_weight_kg?: number;
  item_count?: number;
  condition: string;
  agreed_unit_price: number;
  pricing_unit: string;
  gross_amount: number;
  deductions_amount: number;
  final_payable_amount: number;
  payment_method: string;
  payment_status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED' | 'REFUNDED' | 'DISPUTED';
  payment_reference?: string;
  amount_paid_so_far: number;
  transfer_status: 'CREATED' | 'OFFERED' | 'ACCEPTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'DISPUTED';
  discrepancy: DiscrepancyReport;
  location_name: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  qr_verification_token?: string;
  secure_verification_url?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  audit_history: TransactionAuditRecord[];
}

export interface InventoryItem {
  inventory_id: string;
  material_category: WasteCategory;
  material_name: string;
  current_stock_kg: number;
  item_count: number;
  average_procured_price_per_kg: number;
  storage_bay_location: string;
  segregation_compliant: boolean;
  co_storage_notes: string;
  last_restocked: string;
}

export interface VendorDashboardSummary {
  vendor_id: string;
  business_name: string;
  verification_status: string;
  total_inventory_weight_kg: number;
  total_inventory_value_inr: number;
  pending_incoming_lots_count: number;
  active_transactions_count: number;
  completed_handover_count: number;
  inventory_by_category: InventoryItem[];
}

export interface RecyclerPermit {
  recycler_id: string;
  name: string;
  permit_number: string;
  permit_category: string;
  authorized_waste_categories: WasteCategory[];
  verification_status: string;
  rating: number;
  distance_km: number;
  latitude: number;
  longitude: number;
  facility_address: string;
  contact_phone: string;
  active_epr_accreditation: boolean;
}

export interface ChainOfCustodyNode {
  step_number: number;
  custodian_id: string;
  custodian_name: string;
  custodian_role: string;
  action: string;
  timestamp: string;
  location: string;
  recorded_weight_kg?: number;
  transaction_id?: string;
  verification_status: string;
}

export interface FullTraceabilityGraph {
  lot_id: string;
  item_title: string;
  category: WasteCategory;
  initial_recorded_weight_kg?: number;
  final_recycler_measured_weight_kg?: number;
  origin_collector_name: string;
  intermediary_vendor_name?: string;
  final_recycler_name?: string;
  current_lifecycle_state: string;
  treatment_outcome?: string;
  recovery_yield_percentage?: number;
  epr_audit_hash?: string;
  custody_timeline: ChainOfCustodyNode[];
}

// ==========================================
// API Client Functions
// ==========================================

export async function analyzeTriage(sampleItemId?: string, imageBase64?: string): Promise<TriageAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/triage/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_item_id: sampleItemId, image_base64: imageBase64 }),
  });
  if (!res.ok) throw new Error(`Triage API error: ${res.statusText}`);
  return res.json();
}

export async function submitClarification(
  itemName: string,
  selectedOptionId: string,
  category: WasteCategory
): Promise<TriageAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/triage/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_name: itemName,
      selected_option_id: selectedOptionId,
      category,
    }),
  });
  if (!res.ok) throw new Error(`Clarification API error: ${res.statusText}`);
  return res.json();
}

export async function fetchPricingCatalog(): Promise<MaterialReferencePrice[]> {
  const res = await fetch(`${API_BASE_URL}/pricing/catalog`);
  if (!res.ok) throw new Error(`Pricing Catalog error: ${res.statusText}`);
  return res.json();
}

export async function calculateMeasuredValuation(
  materialName: string,
  category: string,
  measuredWeightKg?: number,
  itemCount?: number,
  customUnitPrice?: number
): Promise<ValuationCalculationResponse> {
  const res = await fetch(`${API_BASE_URL}/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_name: materialName,
      category,
      measured_weight_kg: measuredWeightKg,
      item_count: itemCount,
      custom_unit_price: customUnitPrice,
    }),
  });
  if (!res.ok) throw new Error(`Valuation error: ${res.statusText}`);
  return res.json();
}

export async function createWasteLot(
  creatorId: string,
  creatorName: string,
  itemTitle: string,
  category: WasteCategory,
  measuredWeightKg?: number,
  itemCount?: number,
  condition: string = 'Standard',
  hazardStatus?: HazardMarkers
): Promise<DigitalWasteLot> {
  const res = await fetch(`${API_BASE_URL}/lots/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator_id: creatorId,
      creator_name: creatorName,
      creator_role: 'KABADIWALA',
      item_title: itemTitle,
      category,
      measured_weight_kg: measuredWeightKg,
      item_count: itemCount,
      condition,
      hazard_status: hazardStatus,
      origin_location: 'New Delhi',
    }),
  });
  if (!res.ok) throw new Error(`Create Lot error: ${res.statusText}`);
  return res.json();
}

export async function fetchAllLots(): Promise<DigitalWasteLot[]> {
  const res = await fetch(`${API_BASE_URL}/lots`);
  if (!res.ok) throw new Error(`Fetch Lots error: ${res.statusText}`);
  return res.json();
}

export async function generateHandoverQR(lotId: string, senderId: string, senderRole: string = 'KABADIWALA'): Promise<HandoverQRGenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/handover/generate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lot_id: lotId, sender_id: senderId, sender_role: senderRole }),
  });
  if (!res.ok) throw new Error(`Generate QR error: ${res.statusText}`);
  return res.json();
}

export async function verifyHandoverQR(qrToken: string): Promise<QRVerificationResult> {
  const res = await fetch(`${API_BASE_URL}/handover/verify-qr?qr_token=${encodeURIComponent(qrToken)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Verify QR error: ${res.statusText}`);
  return res.json();
}

export async function createTransaction(req: any): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Create Transaction error: ${res.statusText}`);
  return res.json();
}

export async function fetchAllTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE_URL}/transactions`);
  if (!res.ok) throw new Error(`Fetch Transactions error: ${res.statusText}`);
  return res.json();
}

export async function confirmTransactionReceipt(txnId: string, req: any): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/${txnId}/confirm-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Confirm Receipt error: ${res.statusText}`);
  return res.json();
}

export async function updateTransactionPayment(txnId: string, req: any): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/${txnId}/update-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Update Payment error: ${res.statusText}`);
  return res.json();
}

export async function fetchVendorDashboard(): Promise<VendorDashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/vendor/dashboard`);
  if (!res.ok) throw new Error(`Vendor Dashboard error: ${res.statusText}`);
  return res.json();
}

export async function fetchVendorIncomingLots(): Promise<DigitalWasteLot[]> {
  const res = await fetch(`${API_BASE_URL}/vendor/incoming-lots`);
  if (!res.ok) throw new Error(`Vendor Incoming Lots error: ${res.statusText}`);
  return res.json();
}

export async function vendorInspectLot(req: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/vendor/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Vendor Inspect error: ${res.statusText}`);
  return res.json();
}

export async function vendorCreateOnwardLot(req: any): Promise<DigitalWasteLot> {
  const res = await fetch(`${API_BASE_URL}/vendor/create-onward-lot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Vendor Onward Lot error: ${res.statusText}`);
  return res.json();
}

export async function fetchRecyclers(category: string = 'recyclable'): Promise<RecyclerPermit[]> {
  const res = await fetch(`${API_BASE_URL}/recyclers/match?category=${category}`);
  if (!res.ok) throw new Error(`Recycler API error: ${res.statusText}`);
  return res.json();
}

export async function recyclerIntakeConfirm(req: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/recyclers/intake-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Recycler Intake error: ${res.statusText}`);
  return res.json();
}

export async function recyclerRecordOutcome(req: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/recyclers/record-outcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Recycler Outcome error: ${res.statusText}`);
  return res.json();
}

export async function fetchLotTraceability(lotId: string): Promise<FullTraceabilityGraph> {
  const res = await fetch(`${API_BASE_URL}/recyclers/traceability/${lotId}`);
  if (!res.ok) throw new Error(`Traceability error: ${res.statusText}`);
  return res.json();
}
