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

// Municipal Telemetry & Smart Bin Interfaces
export interface SmartBin {
  bin_id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity_kg: number;
  current_fill_percentage: number;
  current_weight_kg: number;
  is_threshold_breached: boolean;
  last_telemetry_time: string;
  battery_level_pct: number;
  primary_waste_type: string;
  installed_ward?: string;
}

export interface CVRPRouteWaypoint {
  step_number: number;
  bin_id: string;
  bin_name: string;
  latitude: number;
  longitude: number;
  fill_percentage: number;
  weight_to_collect_kg: number;
  cumulative_vehicle_load_kg: number;
  distance_from_prev_km: number;
}

export interface CVRPRouteResponse {
  vehicle_id: string;
  vehicle_capacity_kg: number;
  total_bins_visited: number;
  total_weight_collected_kg: number;
  total_distance_km: number;
  estimated_duration_minutes: number;
  waypoints: CVRPRouteWaypoint[];
  route_polyline_coords: [number, number][];
}

// Fallback Mock Data
export const FALLBACK_RECYCLERS: RecyclerPermit[] = [
  {
    recycler_id: 'REC-DEL-01',
    name: 'Apex Circular Smelting & E-Waste Refining',
    permit_number: 'CPCB-REG-DL-2024-0089',
    permit_category: 'NON_FERROUS_SMELTING',
    authorized_waste_categories: ['recyclable', 'e-waste'],
    verification_status: 'VERIFIED_ACTIVE',
    rating: 4.9,
    distance_km: 4.2,
    latitude: 28.6289,
    longitude: 77.2185,
    facility_address: 'Plot 42, Okhla Industrial Area Phase-III, New Delhi',
    contact_phone: '+91 98110 23411',
    active_epr_accreditation: true,
  },
  {
    recycler_id: 'REC-NOI-02',
    name: 'Indraprastha Battery Hydrometallurgical Hub',
    permit_number: 'UPPCB-HAZ-2023-1102',
    permit_category: 'BATTERY_HYDROMETALLURGY',
    authorized_waste_categories: ['hazardous', 'e-waste'],
    verification_status: 'VERIFIED_ACTIVE',
    rating: 4.8,
    distance_km: 7.8,
    latitude: 28.5355,
    longitude: 77.3910,
    facility_address: 'Sector 63, Electronic City, Noida',
    contact_phone: '+91 99104 88390',
    active_epr_accreditation: true,
  },
  {
    recycler_id: 'REC-GZB-03',
    name: 'Shree Krishna Polymers & Reprocessing Works',
    permit_number: 'UPPCB-PLAS-2024-5541',
    permit_category: 'POLYMER_REPROCESSING',
    authorized_waste_categories: ['recyclable'],
    verification_status: 'VERIFIED_ACTIVE',
    rating: 4.7,
    distance_km: 9.5,
    latitude: 28.6692,
    longitude: 77.4538,
    facility_address: 'Loni Industrial Area, Ghaziabad',
    contact_phone: '+91 98712 34567',
    active_epr_accreditation: true,
  },
];

export const FALLBACK_BINS: SmartBin[] = [
  { bin_id: 'BIN-DEL-101', name: 'Connaught Place Outer Circle', latitude: 28.6328, longitude: 77.2197, capacity_kg: 100, current_fill_percentage: 88.5, current_weight_kg: 84.9, is_threshold_breached: true, last_telemetry_time: '2026-10-10T12:00:00Z', battery_level_pct: 92, primary_waste_type: 'Metals & Mixed Electronics', installed_ward: 'Ward 24 - Central' },
  { bin_id: 'BIN-DEL-102', name: 'Khan Market South Parking', latitude: 28.6003, longitude: 77.2273, capacity_kg: 100, current_fill_percentage: 82.0, current_weight_kg: 78.7, is_threshold_breached: true, last_telemetry_time: '2026-10-10T12:00:00Z', battery_level_pct: 88, primary_waste_type: 'Plastic & Packaging', installed_ward: 'Ward 31 - New Delhi' },
  { bin_id: 'BIN-DEL-103', name: 'Lajpat Nagar Central Market', latitude: 28.5700, longitude: 77.2435, capacity_kg: 100, current_fill_percentage: 94.0, current_weight_kg: 90.2, is_threshold_breached: true, last_telemetry_time: '2026-10-10T12:00:00Z', battery_level_pct: 79, primary_waste_type: 'Appliance Scrap & Motors', installed_ward: 'Ward 45 - South' },
  { bin_id: 'BIN-DEL-104', name: 'Nehru Place Metro Hub', latitude: 28.5492, longitude: 77.2527, capacity_kg: 100, current_fill_percentage: 54.0, current_weight_kg: 51.8, is_threshold_breached: false, last_telemetry_time: '2026-10-10T12:00:00Z', battery_level_pct: 95, primary_waste_type: 'E-Waste Cables & Boards', installed_ward: 'Ward 58 - South' },
  { bin_id: 'BIN-DEL-105', name: 'Karol Bagh Ajmal Khan Rd', latitude: 28.6514, longitude: 77.1907, capacity_kg: 100, current_fill_percentage: 91.0, current_weight_kg: 87.3, is_threshold_breached: true, last_telemetry_time: '2026-10-10T12:00:00Z', battery_level_pct: 84, primary_waste_type: 'Mixed Ferrous Metals', installed_ward: 'Ward 12 - Karol Bagh' },
];

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
  try {
    const res = await fetch(`${API_BASE_URL}/pricing/catalog`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return [];
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
  try {
    const res = await fetch(`${API_BASE_URL}/recyclers/match?category=${category}`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return FALLBACK_RECYCLERS;
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

// Fleet / Smart Bins API functions (for Municipal Fleet Dashboard)
export async function fetchSmartBins(): Promise<SmartBin[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/fleet/bins`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return FALLBACK_BINS;
}

export async function simulateTelemetryTick(): Promise<SmartBin[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/fleet/simulate-tick`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return FALLBACK_BINS.map((b) => {
    const delta = Math.floor(Math.random() * 8) - 1;
    const newFill = Math.min(100, Math.max(20, b.current_fill_percentage + delta));
    return {
      ...b,
      current_fill_percentage: Math.round(newFill * 10) / 10,
      current_weight_kg: Math.round(newFill * 0.96 * 10) / 10,
      is_threshold_breached: newFill >= 80,
      last_telemetry_time: new Date().toISOString(),
    };
  });
}

export async function solveCVRPRoute(capacityKg: number = 350.0): Promise<CVRPRouteResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/fleet/optimize-route?vehicle_capacity_kg=${capacityKg}`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  const breached = FALLBACK_BINS.filter((b) => b.is_threshold_breached);
  let cumulative = 0;
  const waypoints: CVRPRouteWaypoint[] = breached.map((b, idx) => {
    cumulative += b.current_weight_kg;
    return {
      step_number: idx + 1,
      bin_id: b.bin_id,
      bin_name: b.name,
      latitude: b.latitude,
      longitude: b.longitude,
      fill_percentage: b.current_fill_percentage,
      weight_to_collect_kg: b.current_weight_kg,
      cumulative_vehicle_load_kg: Math.round(cumulative * 10) / 10,
      distance_from_prev_km: Math.round((2.4 + idx * 1.8) * 10) / 10,
    };
  });

  const polyline: [number, number][] = waypoints.map((w) => [w.latitude, w.longitude]);
  return {
    vehicle_id: 'EV-CANTER-DL01-9421',
    vehicle_capacity_kg: capacityKg,
    total_bins_visited: waypoints.length,
    total_weight_collected_kg: Math.round(cumulative * 10) / 10,
    total_distance_km: 18.4,
    estimated_duration_minutes: 42,
    waypoints,
    route_polyline_coords: polyline,
  };
}
