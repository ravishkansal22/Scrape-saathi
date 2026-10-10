import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  CheckCircle2,
  PackageCheck,
  Building,
  RefreshCw,
  Boxes,
  Send,
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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border-l-4 border-purple-500 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-mono">
                HIGHEST PRIORITY SUBSYSTEM
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Aggregator & Wholesale Workbench</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Vendor Portal & Warehouse Inventory Ledger</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Physical scale weighbridge verification, discrepancy logging, purchase offer negotiation, storage bay segregation, and onward recycler sales.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview Bar */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-xs text-slate-400">Total Warehouse Stock</span>
            <p className="text-2xl font-bold text-white font-mono">{dashboard.total_inventory_weight_kg} kg</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1 border-l-4 border-purple-500">
            <span className="text-xs text-slate-400">Total Procured Valuation</span>
            <p className="text-2xl font-bold text-purple-400 font-mono">₹{dashboard.total_inventory_value_inr.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1 border-l-4 border-amber-500">
            <span className="text-xs text-slate-400">Incoming Lots Pending Inspection</span>
            <p className="text-2xl font-bold text-amber-400 font-mono">{dashboard.pending_incoming_lots_count}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1 border-l-4 border-teal-500">
            <span className="text-xs text-slate-400">Completed Transfers</span>
            <p className="text-2xl font-bold text-teal-400 font-mono">{dashboard.completed_handover_count}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Incoming Lots & Inspection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Incoming Lots Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-purple-400" />
              <span>Incoming Lots Awaiting Inspection</span>
            </h3>
            <span className="text-[11px] font-mono text-purple-400">{incomingLots.length} Active</span>
          </div>

          <div className="space-y-3">
            {incomingLots.map((lot) => {
              const isSelected = selectedLot?.lot_id === lot.lot_id;
              return (
                <div
                  key={lot.lot_id}
                  onClick={() => handleSelectLot(lot)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40'
                      : 'bg-black/40 border-white/10 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">{lot.lot_id}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{lot.item_title}</h4>
                      <p className="text-xs text-slate-400 font-sans">Collector: {lot.creator_name}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                      {lot.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5 font-mono">
                    <span>Sender Scale Claim: <strong className="text-white">{lot.measured_weight_kg || 'N/A'} kg</strong></span>
                    <span className="text-teal-400 font-bold">{lot.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Physical Inspection & Weighbridge Verification Form */}
        <div className="lg:col-span-7 space-y-5">
          {selectedLot ? (
            <div className="p-6 rounded-2xl bg-black/50 border border-purple-500/40 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">PHYSICAL WEIGHBRIDGE INSPECTION</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">{selectedLot.item_title}</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Lot: {selectedLot.lot_id}</span>
              </div>

              {/* Inspection Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">
                    Receiver Verified Scale Weight (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={physicalScaleWeight}
                    onChange={(e) => setPhysicalScaleWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-purple-500/40 text-purple-300 font-bold text-sm focus:outline-none focus:border-purple-400"
                  />
                  {selectedLot.measured_weight_kg && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Sender claimed: {selectedLot.measured_weight_kg} kg (Diff: {(physicalScaleWeight - selectedLot.measured_weight_kg).toFixed(1)} kg)
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Contamination Weight Deduction (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={contaminationDeduction}
                    onChange={(e) => setContaminationDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Moisture, dirt, or foreign attachments
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Offered Purchase Price (₹/kg):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={offeredRatePerKg}
                    onChange={(e) => setOfferedRatePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-purple-500/40 text-emerald-400 font-bold text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Condition Grade:
                  </label>
                  <input
                    type="text"
                    value={conditionGrade}
                    onChange={(e) => setConditionGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">
                    Physical Inspection Notes:
                  </label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>



              {/* Live Calculation Summary */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Effective Payable Weight:</span>
                  <span className="font-bold text-white">{Math.max(0, physicalScaleWeight - contaminationDeduction).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm">
                  <span>Total Purchase Offer:</span>
                  <span>₹{(Math.max(0, physicalScaleWeight - contaminationDeduction) * offeredRatePerKg).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleExecuteInspection}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Verify Scale Measurement & Issue Purchase Offer</span>
              </button>

              {inspectionResult && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Purchase Offer Created & Sent to Collector</span>
                  </div>
                  <p className="text-xs text-slate-200">{inspectionResult.message}</p>
                  <span className="text-[10px] font-mono text-emerald-300 block">
                    TXN ID: {inspectionResult.transaction_id}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Warehouse Inventory Stock & Storage Bays Section */}
      {dashboard && (
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-400" />
                <span>Warehouse Inventory Storage & Segregation Compliance</span>
              </h3>
              <p className="text-xs text-slate-400">All materials stored in designated bays adhering strictly to CPCB co-storage isolation mandates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.inventory_by_category.map((item) => (
              <div key={item.inventory_id} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">{item.storage_bay_location}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    COMPLIANT
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white">{item.material_name}</h4>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Stock:</span>
                    <strong className="text-white">{item.current_stock_kg} kg</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Avg Procurement:</span>
                    <strong className="text-purple-300">₹{item.average_procured_price_per_kg}/kg</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 border-t border-white/5 pt-2 leading-relaxed">
                  {item.co_storage_notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onward Recycler Commercial Lot Aggregation */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              <span>Aggregate & Create Onward Commercial Lot for Recycler</span>
            </h3>
            <p className="text-xs text-slate-400">Consolidate verified warehouse inventory into bulk commercial lots for sale to authorized smelting & pelleting plants.</p>
          </div>
        </div>

        <form onSubmit={handleCreateOnwardLot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Material Name:</label>
            <input
              type="text"
              value={onwardMaterialName}
              onChange={(e) => setOnwardMaterialName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Aggregated Weight (kg):</label>
            <input
              type="number"
              min="1"
              value={onwardWeightKg}
              onChange={(e) => setOnwardWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-purple-300 font-bold focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Category:</label>
            <select
              value={onwardCategory}
              onChange={(e) => setOnwardCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="recyclable">Recyclable</option>
              <option value="e-waste">E-Waste</option>
              <option value="hazardous">Hazardous</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Storage Origin Bay:</label>
            <input
              type="text"
              value={onwardBay}
              onChange={(e) => setOnwardBay(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Asking Price (₹/kg):</label>
            <input
              type="number"
              min="0"
              value={onwardAskingPrice}
              onChange={(e) => setOnwardAskingPrice(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-emerald-400 font-bold focus:outline-none focus:border-purple-400"
            />
          </div>


          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Create Recycler Batch</span>
            </button>
          </div>
        </form>

        {onwardSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-300 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{onwardSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
