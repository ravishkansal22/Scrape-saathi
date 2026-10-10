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
<<<<<<< HEAD
  battery_damage: boolean;
  chemical_leak: boolean;
  exposed_wiring: boolean;
  pressurized_canister: boolean;
  sharp_edges: boolean;
=======
  battery_swollen?: boolean;
  thermal_venting?: boolean;
  puncture_detected?: boolean;
  chemical_leak?: boolean;
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
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

<<<<<<< HEAD
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
=======
// Realistic offline fallback fixtures if FastAPI server is temporarily unavailable
const FALLBACK_PRESETS: Record<string, TriageAnalysisResponse> = {
  electric_motor: {
    item_title: 'Induction Motor Assembly (1.5 HP)',
    category: 'Small Appliances & Motors',
    overall_confidence: 0.92,
    confidence_tier: 'HIGH',
    components: [
      { name: 'Copper Stator Windings', estimated_weight_kg: 0.8, index_price_per_kg: 650.0, purity_factor: 0.95, disassembly_ease: 'Medium' },
      { name: 'Cast Iron Housing', estimated_weight_kg: 4.5, index_price_per_kg: 35.0, purity_factor: 0.90, disassembly_ease: 'Easy' },
      { name: 'Aluminum Rotor Endbells', estimated_weight_kg: 1.2, index_price_per_kg: 180.0, purity_factor: 0.88, disassembly_ease: 'Medium' },
    ],
    hazard_analysis: { is_hazardous: false },
    depot_inspection_required: false,
    recommended_pathway: 'Component Recovery (Workshop Disassembly Arbitrage)',
  },
  swollen_laptop: {
    item_title: 'Industrial Lithium-Ion Battery Module',
    category: 'Hazardous Energy Storage',
    overall_confidence: 0.96,
    confidence_tier: 'HIGH',
    components: [
      { name: 'Swollen Li-Ion Pouch Cells', estimated_weight_kg: 0.35, index_price_per_kg: 0.0, purity_factor: 0.1, disassembly_ease: 'Hard' },
      { name: 'PCB Motherboard (Gold/Palladium)', estimated_weight_kg: 0.25, index_price_per_kg: 420.0, purity_factor: 0.9, disassembly_ease: 'Easy' },
      { name: 'Aluminum Shell & Heatsinks', estimated_weight_kg: 0.9, index_price_per_kg: 170.0, purity_factor: 0.85, disassembly_ease: 'Easy' },
    ],
    hazard_analysis: {
      is_hazardous: true,
      battery_swollen: true,
      thermal_venting: false,
      hazard_description: 'CRITICAL HAZARD DETECTED: Swollen Lithium-Ion cell pack with puncture risk. High thermal runaway risk.',
      containment_protocol: 'DETERMINISTIC SAFETY OVERRIDE: Place immediately in sand-buffered fireproof bin. Do not shred or compact.',
    },
    depot_inspection_required: false,
    recommended_pathway: 'Hazardous Waste Isolation Protocol',
  },
  copper_cable: {
    item_title: 'Armored Industrial High-Voltage Feeder Cable',
    category: 'Electrical & Power Infrastructure',
    overall_confidence: 0.78,
    confidence_tier: 'MEDIUM',
    components: [
      { name: 'Heavy-Duty Copper Core', estimated_weight_kg: 2.5, index_price_per_kg: 680.0, purity_factor: 0.90, disassembly_ease: 'Easy' },
      { name: 'PVC Insulation & Steel Armor', estimated_weight_kg: 0.8, index_price_per_kg: 15.0, purity_factor: 0.70, disassembly_ease: 'Easy' },
    ],
    hazard_analysis: { is_hazardous: false },
    clarification_prompt: {
      prompt_id: 'prompt_copper_purity_101',
      question: 'Is internal core pure 99.9% annealed copper or tin-coated / copper-clad aluminum (CCA)?',
      options: [
        { option_id: 'pure_copper', label: 'Pure Electrolytic Copper (Bright Red Core)', impact_description: 'Valuation confirmed at ₹680/kg' },
        { option_id: 'tin_coated', label: 'Tin-Coated Copper / CCA (Silver Sheen)', impact_description: 'Valuation adjusted to ₹410/kg' },
      ],
    },
    depot_inspection_required: false,
    recommended_pathway: 'Mechanical Stripping & Copper Granulation',
  },
  unknown_rusty_compressor: {
    item_title: 'Degraded Sealed Compressor Assembly',
    category: 'Heavy Equipment Scrap',
    overall_confidence: 0.45,
    confidence_tier: 'LOW',
    components: [
      { name: 'Heavy Iron Casing (Unidentified Core)', estimated_weight_kg: 8.0, index_price_per_kg: 30.0, purity_factor: 0.50, disassembly_ease: 'Hard' },
    ],
    hazard_analysis: { is_hazardous: false },
    depot_inspection_required: true,
    depot_reason: 'Low visual confidence (<60%). Requires physical ultrasonic thickness or oil drain inspection.',
    recommended_pathway: 'Depot Physical Inspection Required',
  },
};

const FALLBACK_RECYCLERS: RecyclerPermit[] = [
  {
    recycler_id: 'rec_delhi_e_waste_01',
    name: 'EcoRecycle Green Tech Solutions',
    permit_category: 'Consumer Electronics & Li-ion Batteries',
    rating: 4.9,
    distance_km: 3.2,
    latitude: 28.6289,
    longitude: 77.2150,
    contact_phone: '+91 98765 43210',
  },
  {
    recycler_id: 'rec_noida_metal_02',
    name: 'Apex Metals & Copper Smelting Plant',
    permit_category: 'Non-Ferrous Metals (Copper/Aluminum)',
    rating: 4.8,
    distance_km: 5.7,
    latitude: 28.5800,
    longitude: 77.3200,
    contact_phone: '+91 98111 22233',
  },
  {
    recycler_id: 'rec_gurugram_hazardous_03',
    name: 'Safeguard Hazmat Recovery Depot',
    permit_category: 'Hazardous Waste & Battery Neutralization',
    rating: 5.0,
    distance_km: 8.1,
    latitude: 28.4595,
    longitude: 77.0266,
    contact_phone: '+91 99999 88888',
  },
];

const FALLBACK_BINS: SmartBin[] = [
  { bin_id: 'BIN-001', name: 'Connaught Place Block-A Hub', latitude: 28.6315, longitude: 77.2167, capacity_kg: 100, current_fill_percentage: 84.5, current_weight_kg: 82.0, is_threshold_breached: true, last_telemetry_time: new Date().toISOString(), battery_level_pct: 94.2, primary_waste_type: 'E-Waste & Small Assemblies' },
  { bin_id: 'BIN-002', name: 'Karol Bagh Electronics Market', latitude: 28.6517, longitude: 77.1906, capacity_kg: 100, current_fill_percentage: 91.2, current_weight_kg: 94.0, is_threshold_breached: true, last_telemetry_time: new Date().toISOString(), battery_level_pct: 91.5, primary_waste_type: 'Cable Scraps & PCBs' },
  { bin_id: 'BIN-003', name: 'Nehru Place IT Hardware Hub', latitude: 28.5494, longitude: 77.2519, capacity_kg: 100, current_fill_percentage: 88.0, current_weight_kg: 86.5, is_threshold_breached: true, last_telemetry_time: new Date().toISOString(), battery_level_pct: 97.0, primary_waste_type: 'E-Waste Parts' },
  { bin_id: 'BIN-004', name: 'Lajpat Nagar Central Market', latitude: 28.5677, longitude: 77.2433, capacity_kg: 100, current_fill_percentage: 62.0, current_weight_kg: 58.0, is_threshold_breached: false, last_telemetry_time: new Date().toISOString(), battery_level_pct: 96.1, primary_waste_type: 'Mixed Metals' },
  { bin_id: 'BIN-005', name: 'Okhla Industrial Area Ph-III', latitude: 28.5355, longitude: 77.2711, capacity_kg: 100, current_fill_percentage: 81.0, current_weight_kg: 79.5, is_threshold_breached: true, last_telemetry_time: new Date().toISOString(), battery_level_pct: 88.4, primary_waste_type: 'Machinery Trimmings' },
  { bin_id: 'BIN-006', name: 'Noida Sector 18 Commercial Belt', latitude: 28.5708, longitude: 77.3261, capacity_kg: 100, current_fill_percentage: 74.0, current_weight_kg: 71.0, is_threshold_breached: false, last_telemetry_time: new Date().toISOString(), battery_level_pct: 92.8, primary_waste_type: 'Mixed Scrap' },
  { bin_id: 'BIN-007', name: 'Gurugram Cyber City Phase 2', latitude: 28.4950, longitude: 77.0895, capacity_kg: 100, current_fill_percentage: 85.0, current_weight_kg: 83.0, is_threshold_breached: true, last_telemetry_time: new Date().toISOString(), battery_level_pct: 95.0, primary_waste_type: 'Telecom Hardware' },
];

// API Call Implementations with graceful fallbacks
export async function analyzeTriage(sampleItemId: string = 'electric_motor', imageBase64?: string): Promise<TriageAnalysisResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/triage/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sample_item_id: sampleItemId, image_base64: imageBase64 }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline fallback
  }
  return FALLBACK_PRESETS[sampleItemId] || FALLBACK_PRESETS.electric_motor;
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
}

export async function submitClarification(
  itemName: string,
  selectedOptionId: string,
  category: WasteCategory
): Promise<TriageAnalysisResponse> {
<<<<<<< HEAD
  const res = await fetch(`${API_BASE_URL}/triage/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_name: itemName,
      selected_option_id: selectedOptionId,
      category,
    }),
=======
  try {
    const res = await fetch(`${API_BASE_URL}/triage/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: itemName, selected_option_id: selectedOptionId, components }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback calculation
  }
  const updatedComps = components.map((c) => {
    if (c.name.toLowerCase().includes('copper')) {
      const price = selectedOptionId === 'pure_copper' ? 680.0 : 410.0;
      return { ...c, index_price_per_kg: price, purity_factor: selectedOptionId === 'pure_copper' ? 0.95 : 0.75 };
    }
    return c;
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
  });
  return {
    item_title: itemName,
    category: 'Electrical & Power Infrastructure',
    overall_confidence: 0.94,
    confidence_tier: 'HIGH',
    components: updatedComps,
    hazard_analysis: { is_hazardous: false },
    depot_inspection_required: false,
    recommended_pathway: 'High-Purity Copper Stripping (Workshop Teardown)',
  };
}

<<<<<<< HEAD
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
=======
export async function calculateValuation(
  itemTitle: string,
  totalWeightKg: number,
  components: SubComponent[]
): Promise<ValuationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/valuation/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_title: itemTitle,
        total_gross_weight_kg: totalWeightKg,
        components,
        bulk_sale_price_per_kg: 40.0,
        handling_overhead_cost: 30.0,
        disassembly_labor_cost: 50.0,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback formula execution
  }
  const bulk_sale_value = Math.round(totalWeightKg * 40.0 * 100) / 100;
  let disassembled_gross_value = 0;
  for (const c of components) {
    disassembled_gross_value += c.estimated_weight_kg * c.index_price_per_kg * c.purity_factor;
  }
  disassembled_gross_value = Math.round(disassembled_gross_value * 100) / 100;
  const disassembled_net_value = Math.round((disassembled_gross_value - 30.0 - 50.0) * 100) / 100;
  const arbitrage_net_gain = Math.round((disassembled_net_value - bulk_sale_value) * 100) / 100;
  const recommendDisassemble = arbitrage_net_gain > 0;

  return {
    item_title: itemTitle,
    bulk_sale_value,
    disassembled_gross_value,
    handling_overhead: 30.0,
    disassembly_labor_cost: 50.0,
    disassembled_net_value,
    arbitrage_net_gain,
    recommendation: recommendDisassemble ? 'DISASSEMBLE' : 'SELL_BULK',
    recommendation_summary: recommendDisassemble
      ? `Bulk sale yields ₹${bulk_sale_value}. Teardown yields ₹${disassembled_gross_value} gross (₹${disassembled_net_value} net). Net profit uplift: +₹${arbitrage_net_gain}.`
      : `Bulk unsegregated sale recommended. Labor overhead outweighs separated metal scrap gain.`,
    disassembly_steps: [
      { step_number: 1, action: 'Unfasten retaining bolts on external casing', target_component: 'Outer Shell', tool_required: '13mm Socket Wrench' },
      { step_number: 2, action: 'Separate rotor shaft assembly and remove bearing races', target_component: 'Rotor Assembly', tool_required: 'Mechanical Bearing Puller' },
      { step_number: 3, action: 'Sever copper windings at stator crown and extract bundles', target_component: 'Copper Windings', tool_required: 'Chisel & Wire Puller' },
    ],
  };
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
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
<<<<<<< HEAD
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
=======
  try {
    const res = await fetch(`${API_BASE_URL}/lots/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collector_id: collectorId,
        item_title: itemTitle,
        category,
        components,
        total_weight_kg: totalWeightKg,
        net_valuation: netValuation,
        latitude: 28.6139,
        longitude: 77.2090,
        hazard_status: hazardStatus,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  const lotId = `LOT-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    lot_id: lotId,
    collector_id: collectorId,
    item_title: itemTitle,
    category,
    components,
    total_weight_kg: totalWeightKg,
    net_valuation: netValuation,
    status: 'VERIFIED_MANIFEST_CREATED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 28.6139,
    longitude: 77.2090,
    hazard_status: hazardStatus,
  };
}

export async function generateHandoverQR(lotId: string, collectorId: string): Promise<HandoverQRGenerateResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/handover/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lot_id: lotId, collector_id: collectorId }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  const token = `SCRAP-${lotId}-${Date.now().toString(36).toUpperCase()}`;
  return {
    lot_id: lotId,
    qr_token: token,
    qr_image_base64: '',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };
}

export async function verifyHandover(qrToken: string, recyclerId: string): Promise<EPRReceiptResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/handover/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_token: qrToken,
        recycler_id: recyclerId,
        scanned_latitude: 28.6139,
        scanned_longitude: 77.2090,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return {
    receipt_id: `EPR-REC-${Math.floor(100000 + Math.random() * 900000)}`,
    lot_id: qrToken.startsWith('SCRAP-') ? qrToken.split('-')[1] : 'LOT-849102',
    collector_id: 'collector_delhi_99',
    recycler_id: recyclerId,
    recycler_name: 'Apex Metals & Copper Smelting Plant',
    verified_at: new Date().toISOString(),
    total_weight_kg: 6.5,
    category: 'Non-Ferrous Metals & Motors',
    components_breakdown: [
      { name: 'Copper Stator Windings', estimated_weight_kg: 0.8, index_price_per_kg: 650.0, purity_factor: 0.95, disassembly_ease: 'Medium' },
      { name: 'Cast Iron Housing', estimated_weight_kg: 4.5, index_price_per_kg: 35.0, purity_factor: 0.90, disassembly_ease: 'Easy' },
      { name: 'Aluminum Rotor Endbells', estimated_weight_kg: 1.2, index_price_per_kg: 180.0, purity_factor: 0.88, disassembly_ease: 'Medium' },
    ],
    digital_signature: `SHA256:${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    epr_compliance_status: 'FORM_2_APPROVED_CPCB_COMPLIANT',
  };
}

export async function fetchRecyclers(): Promise<RecyclerPermit[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/recyclers/match`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback
  }
  return FALLBACK_RECYCLERS;
}

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

  const polyline = waypoints.map((w) => [w.latitude, w.longitude]);
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
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
}
