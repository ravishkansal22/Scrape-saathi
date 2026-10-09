const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface SubComponent {
  name: string;
  estimated_weight_kg: number;
  index_price_per_kg: number;
  purity_factor: number;
  disassembly_ease: string;
}

export interface HazardMarkers {
  is_hazardous: boolean;
  battery_swollen: boolean;
  thermal_venting: boolean;
  puncture_detected: boolean;
  chemical_leak: boolean;
  hazard_description?: string;
  containment_protocol?: string;
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
  category: string;
  overall_confidence: number;
  confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  components: SubComponent[];
  hazard_analysis: HazardMarkers;
  clarification_prompt?: ClarificationPrompt;
  depot_inspection_required: boolean;
  depot_reason?: string;
  recommended_pathway: string;
}

export interface DisassemblyStep {
  step_number: number;
  action: string;
  target_component: string;
  tool_required: string;
  safety_warning?: string;
}

export interface ValuationResponse {
  item_title: string;
  bulk_sale_value: number;
  disassembled_gross_value: number;
  handling_overhead: number;
  disassembly_labor_cost: number;
  disassembled_net_value: number;
  arbitrage_net_gain: number;
  recommendation: 'DISASSEMBLE' | 'SELL_BULK';
  recommendation_summary: string;
  disassembly_steps: DisassemblyStep[];
}

export interface RecyclerPermit {
  recycler_id: string;
  name: string;
  permit_category: string;
  rating: number;
  distance_km: number;
  latitude: number;
  longitude: number;
  contact_phone: string;
}

export interface DigitalWasteLot {
  lot_id: string;
  collector_id: string;
  item_title: string;
  category: string;
  components: SubComponent[];
  total_weight_kg: number;
  net_valuation: number;
  status: string;
  created_at: string;
  updated_at: string;
  latitude: number;
  longitude: number;
  hazard_status: HazardMarkers;
  assigned_recycler?: RecyclerPermit;
}

export interface HandoverQRGenerateResponse {
  lot_id: string;
  qr_token: string;
  qr_image_base64: string;
  expires_at: string;
}

export interface EPRReceiptResponse {
  receipt_id: string;
  lot_id: string;
  collector_id: string;
  recycler_id: string;
  recycler_name: string;
  verified_at: string;
  total_weight_kg: number;
  category: string;
  components_breakdown: SubComponent[];
  digital_signature: string;
  epr_compliance_status: string;
}

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
  route_polyline_coords: number[][];
}

// API functions
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
  components: SubComponent[]
): Promise<TriageAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/triage/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      item_name: itemName,
      selected_option_id: selectedOptionId,
      components,
    }),
  });
  if (!res.ok) throw new Error(`Clarification API error: ${res.statusText}`);
  return res.json();
}

export async function calculateValuation(
  itemTitle: string,
  totalWeightKg: number,
  components: SubComponent[]
): Promise<ValuationResponse> {
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
  if (!res.ok) throw new Error(`Valuation API error: ${res.statusText}`);
  return res.json();
}

export async function createWasteLot(
  collectorId: string,
  itemTitle: string,
  category: string,
  components: SubComponent[],
  totalWeightKg: number,
  netValuation: number,
  hazardStatus: HazardMarkers
): Promise<DigitalWasteLot> {
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
  if (!res.ok) throw new Error(`Create Lot error: ${res.statusText}`);
  return res.json();
}

export async function generateHandoverQR(lotId: string, collectorId: string): Promise<HandoverQRGenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/handover/generate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lot_id: lotId, collector_id: collectorId }),
  });
  if (!res.ok) throw new Error(`Generate QR error: ${res.statusText}`);
  return res.json();
}

export async function verifyHandover(qrToken: string, recyclerId: string): Promise<EPRReceiptResponse> {
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
  if (!res.ok) throw new Error(`Verify Handover error: ${res.statusText}`);
  return res.json();
}

export async function fetchRecyclers(): Promise<RecyclerPermit[]> {
  const res = await fetch(`${API_BASE_URL}/recyclers/match`);
  if (!res.ok) throw new Error(`Recycler API error: ${res.statusText}`);
  return res.json();
}

export async function fetchSmartBins(): Promise<SmartBin[]> {
  const res = await fetch(`${API_BASE_URL}/fleet/bins`);
  if (!res.ok) throw new Error(`Fleet bins API error: ${res.statusText}`);
  return res.json();
}

export async function simulateTelemetryTick(): Promise<SmartBin[]> {
  const res = await fetch(`${API_BASE_URL}/fleet/simulate-tick`, { method: 'POST' });
  if (!res.ok) throw new Error(`Simulate telemetry error: ${res.statusText}`);
  return res.json();
}

export async function solveCVRPRoute(capacityKg: number = 350.0): Promise<CVRPRouteResponse> {
  const res = await fetch(`${API_BASE_URL}/fleet/optimize-route?vehicle_capacity_kg=${capacityKg}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`CVRP Route error: ${res.statusText}`);
  return res.json();
}
