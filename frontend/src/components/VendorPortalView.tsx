import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  CheckCircle2,
  PackageCheck,
  Building,
  RefreshCw,
  Boxes,
  Send,
  Scale,
  ShieldCheck,
  CircleDollarSign,
} from 'lucide-react';
import {
  fetchVendorDashboard,
  fetchVendorIncomingLots,
  vendorInspectLot,
  vendorCreateOnwardLot,
} from '../services/api';
import type {
  VendorDashboardSummary,
  DigitalWasteLot,
} from '../services/api';

export const VendorPortalView: React.FC = () => {
  const [dashboard, setDashboard] = useState<VendorDashboardSummary | null>(null);
  const [incomingLots, setIncomingLots] = useState<DigitalWasteLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<DigitalWasteLot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Inspection Form State
  const [physicalScaleWeight, setPhysicalScaleWeight] = useState<number>(14.0);
  const [contaminationDeduction, setContaminationDeduction] = useState<number>(0.0);
  const [conditionGrade, setConditionGrade] = useState<string>('Standard Recyclable Grade');
  const [offeredRatePerKg, setOfferedRatePerKg] = useState<number>(680.0);
  const [inspectionNotes, setInspectionNotes] = useState<string>('Tested on platform scale, moisture check passed.');
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);

  // Onward Lot Form State
  const [onwardCategory, setOnwardCategory] = useState<string>('recyclable');
  const [onwardMaterialName, setOnwardMaterialName] = useState<string>('Grade-A Copper Wire Scrap');
  const [onwardWeightKg, setOnwardWeightKg] = useState<number>(250.0);
  const [onwardAskingPrice, setOnwardAskingPrice] = useState<number>(720.0);
  const [onwardBay, setOnwardBay] = useState<string>('Bay A-1 (Secure Lockup)');
  const [onwardSuccess, setOnwardSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, lots] = await Promise.all([
        fetchVendorDashboard(),
        fetchVendorIncomingLots(),
      ]);
      setDashboard(dash);
      setIncomingLots(lots);
      if (lots.length > 0 && !selectedLot) {
        setSelectedLot(lots[0]);
        if (lots[0].measured_weight_kg) {
          setPhysicalScaleWeight(lots[0].measured_weight_kg);
        }
      }
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectLot = (lot: DigitalWasteLot) => {
    setSelectedLot(lot);
    setInspectionResult(null);
    if (lot.measured_weight_kg) {
      setPhysicalScaleWeight(lot.measured_weight_kg);
    }
  };

  const handleExecuteInspection = async () => {
    if (!selectedLot) return;
    setLoading(true);
    try {
      const res = await vendorInspectLot({
        lot_id: selectedLot.lot_id,
        vendor_id: 'vendor_apex_metals_01',
        physical_scale_weight_kg: physicalScaleWeight,
        contamination_detected: contaminationDeduction > 0,
        contamination_weight_deduction_kg: contaminationDeduction,
        offered_price_per_kg: offeredRatePerKg,
        condition_grade: conditionGrade,
        inspection_notes: inspectionNotes,
      });
      setInspectionResult(res);
      await loadData();
    } catch (err: any) {
      alert(`Inspection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOnwardLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOnwardSuccess(null);
    try {
      const res = await vendorCreateOnwardLot({
        vendor_id: 'vendor_apex_metals_01',
        material_category: onwardCategory,
        material_name: onwardMaterialName,
        aggregated_weight_kg: onwardWeightKg,
        asking_price_per_kg: onwardAskingPrice,
        storage_origin_bay: onwardBay,
        destination_facility: 'Authorized Recycler Smelting Facility',
      });
      setOnwardSuccess(`Bulk Lot ${res.lot_id} generated for Recycler transfer (${res.measured_weight_kg} kg).`);
      await loadData();
    } catch (err: any) {
      alert(`Onward lot error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              Module 02 • Aggregator Inventory
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">Apex Metals Aggregator Hub</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Aggregator Warehouse Inventory &amp; Dual-Party Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            Certified weighbridge receiving, category sorting, inventory bay tracking, discrepancy logging, and onward commercial batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost-dark text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-emerald-500" />
            <span>Warehouse Stock</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {dashboard ? dashboard.total_inventory_weight_kg.toFixed(0) : '1,420'}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">kg</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Across 4 Segregated Bays</span>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <CircleDollarSign className="w-3.5 h-3.5 text-cyan-500" />
            <span>Procured Valuation</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{dashboard ? (dashboard.total_inventory_value_inr / 1000).toFixed(1) : '184.2'}k
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Realized</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Average procurement rate</span>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Intake Inspection</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {dashboard ? dashboard.pending_incoming_lots_count : incomingLots.length}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">Lots</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Awaiting platform verification</span>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completed Handovers</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {dashboard ? dashboard.completed_handover_count : '24'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Dual-Signed</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Zero discrepancy rate</span>
        </div>
      </div>

      {/* Main Grid: Incoming Queue (5 Cols) + Weighbridge Inspection Form (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Incoming Lots Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-emerald-500" />
              <span>Incoming Lots Awaiting Inspection</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              {incomingLots.length} In Queue
            </span>
          </div>

          <div className="space-y-2.5">
            {incomingLots.map((lot) => {
              const isSelected = selectedLot?.lot_id === lot.lot_id;
              return (
                <div
                  key={lot.lot_id}
                  onClick={() => handleSelectLot(lot)}
                  className={`surface-card p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                      : 'hover:border-[var(--border-medium)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        {lot.lot_id}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{lot.item_title}</h4>
                      <p className="text-[11px] text-[var(--text-muted)]">Collector: {lot.creator_name}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                      {lot.status}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span>
                      Sender Claim: <strong className="text-[var(--text-primary)]">{lot.measured_weight_kg || 'N/A'} kg</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">{lot.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Physical Weighbridge Inspection (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLot ? (
            <div className="surface-card p-5 space-y-4 border border-emerald-500/30">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                    Physical Weighbridge Inspection
                  </span>
                  <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    {selectedLot.item_title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">Lot: {selectedLot.lot_id}</span>
              </div>

              {/* Inspection Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                <div>
                  <label className="text-[var(--text-secondary)] block mb-1">
                    Receiver Verified Scale Weight (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={physicalScaleWeight}
                    onChange={(e) => setPhysicalScaleWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 input-themed font-mono font-bold text-sm"
                  />
                  {selectedLot.measured_weight_kg && (
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                      Sender claimed: {selectedLot.measured_weight_kg} kg (Diff: {(physicalScaleWeight - selectedLot.measured_weight_kg).toFixed(1)} kg)
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] block mb-1">
                    Contamination Weight Deduction (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={contaminationDeduction}
                    onChange={(e) => setContaminationDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 input-themed font-mono text-xs"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    Moisture, dirt, or foreign attachments
                  </span>
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] block mb-1">
                    Offered Purchase Price (₹/kg):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={offeredRatePerKg}
                    onChange={(e) => setOfferedRatePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 input-themed font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] block mb-1">
                    Condition Grade:
                  </label>
                  <input
                    type="text"
                    value={conditionGrade}
                    onChange={(e) => setConditionGrade(e.target.value)}
                    className="w-full p-2 input-themed font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[var(--text-secondary)] block mb-1">
                    Physical Inspection Notes:
                  </label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full p-2 input-themed text-xs"
                  />
                </div>
              </div>

              {/* Live Calculation Summary */}
              <div className="surface-well p-3 rounded-lg border border-[var(--border-subtle)] space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Effective Payable Weight:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {Math.max(0, physicalScaleWeight - contaminationDeduction).toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm pt-1 border-t border-[var(--border-subtle)]">
                  <span>Total Purchase Offer:</span>
                  <span>₹{(Math.max(0, physicalScaleWeight - contaminationDeduction) * offeredRatePerKg).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleExecuteInspection}
                disabled={loading}
                className="w-full btn-emerald text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Verify Scale Measurement &amp; Issue Purchase Offer</span>
              </button>

              {inspectionResult && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1 font-mono text-xs text-emerald-600 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Purchase Offer Created &amp; Sent to Collector</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">{inspectionResult.message}</p>
                  <span className="text-[10px] text-[var(--text-muted)] block">
                    TXN ID: {inspectionResult.transaction_id}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="surface-card p-10 text-center space-y-2 border-dashed border-[var(--border-medium)]">
              <Scale className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <h4 className="font-semibold text-xs text-[var(--text-primary)]">No Lot Selected</h4>
              <p className="text-xs text-[var(--text-muted)]">
                Select an incoming waste lot from the queue to start physical weighbridge inspection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Inventory Stock & Storage Bays Section */}
      {dashboard && (
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-500" />
                <span>Warehouse Inventory Storage &amp; Segregation Compliance</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                All materials stored in designated bays adhering strictly to CPCB co-storage isolation mandates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {dashboard.inventory_by_category.map((item) => (
              <div key={item.inventory_id} className="surface-card-subtle p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                    {item.storage_bay_location}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-mono">
                    COMPLIANT
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[var(--text-primary)]">{item.material_name}</h4>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Current Stock:</span>
                    <strong className="text-[var(--text-primary)]">{item.current_stock_kg} kg</strong>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Avg Procurement:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{item.average_procured_price_per_kg}/kg</strong>
                  </div>
                </div>

                <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2 leading-relaxed">
                  {item.co_storage_notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onward Recycler Commercial Lot Aggregation */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>Aggregate &amp; Create Onward Commercial Lot for Recycler</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Consolidate verified warehouse inventory into bulk commercial lots for sale to authorized smelting &amp; pelleting plants.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateOnwardLot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
          <div>
            <label className="text-[var(--text-secondary)] block mb-1">Material Name:</label>
            <input
              type="text"
              value={onwardMaterialName}
              onChange={(e) => setOnwardMaterialName(e.target.value)}
              className="w-full p-2 input-themed"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-1">Aggregated Weight (kg):</label>
            <input
              type="number"
              min="1"
              value={onwardWeightKg}
              onChange={(e) => setOnwardWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full p-2 input-themed font-bold"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-1">Category:</label>
            <select
              value={onwardCategory}
              onChange={(e) => setOnwardCategory(e.target.value)}
              className="w-full p-2 input-themed"
            >
              <option value="recyclable">Recyclable</option>
              <option value="e-waste">E-Waste</option>
              <option value="hazardous">Hazardous</option>
            </select>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-1">Storage Origin Bay:</label>
            <input
              type="text"
              value={onwardBay}
              onChange={(e) => setOnwardBay(e.target.value)}
              className="w-full p-2 input-themed"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-1">Asking Price (₹/kg):</label>
            <input
              type="number"
              min="0"
              value={onwardAskingPrice}
              onChange={(e) => setOnwardAskingPrice(parseFloat(e.target.value) || 0)}
              className="w-full p-2 input-themed text-emerald-600 dark:text-emerald-400 font-bold"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-emerald text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Create Recycler Commercial Batch</span>
            </button>
          </div>
        </form>

        {onwardSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{onwardSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
