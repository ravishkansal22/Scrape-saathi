import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
<<<<<<< HEAD
  Award,
  Building2,
  Phone,
  Star,
  Scale,
  Factory,
} from 'lucide-react';

import {
  fetchRecyclers,
  recyclerIntakeConfirm,
  recyclerRecordOutcome,
  fetchAllTransactions,
} from '../services/api';
import type {
  RecyclerPermit,
  Transaction,
} from '../services/api';
=======
  Scan,
  Download,
  Building2,
  Phone,
  Star,
  Printer,
  FileCheck2,
  Search,
  Lock,
} from 'lucide-react';
import { fetchRecyclers, verifyHandover } from '../services/api';
import type { RecyclerPermit, EPRReceiptResponse } from '../services/api';
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
import confetti from 'canvas-confetti';

export const RecyclerPortalView: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerPermit[]>([]);
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerPermit | null>(null);
<<<<<<< HEAD
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<string>('TXN-9F8E7D6C');
  
  // Intake Form State
  const [intakeWeightKg, setIntakeWeightKg] = useState<number>(85.0);
  const [hasContamination, setHasContamination] = useState<boolean>(false);
  const [contaminationKg, setContaminationKg] = useState<number>(0.0);
  const [intakeNotes, setIntakeNotes] = useState<string>('Weighed on certified 500kg electronic platform scale.');
  const [intakeResult, setIntakeResult] = useState<any | null>(null);

  // Final Outcome Form State
  const [treatmentOutcome, setTreatmentOutcome] = useState<string>('RECYCLED_RAW_MATERIAL');
  const [recoveredWeightKg, setRecoveredWeightKg] = useState<number>(82.0);
  const [recoveryYieldPct, setRecoveryYieldPct] = useState<number>(96.5);
  const [treatmentMethod, setTreatmentMethod] = useState<string>('Hot-wash de-labeling, optical polymer flake sorting, extrusion into RPET pellets.');
  const [downstreamDest, setDownstreamDest] = useState<string>('National Bottle-to-Bottle Food Grade Preform Manufacturer');
  const [outcomeResult, setOutcomeResult] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
=======
  const [qrTokenInput, setQrTokenInput] = useState<string>('SCRAP-LOT-849102-M8K2P');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [eprReceipt, setEprReceipt] = useState<EPRReceiptResponse | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0

  useEffect(() => {
    Promise.all([fetchRecyclers(), fetchAllTransactions()])
      .then(([recList, txnList]) => {
        setRecyclers(recList);
        if (recList.length > 0) setSelectedRecycler(recList[0]);
        setTransactions(txnList);
        if (txnList.length > 0) setSelectedTxnId(txnList[0].transaction_id);
      })
      .catch((err) => console.error('Error fetching recycler data:', err));
  }, []);

  const handleConfirmIntake = async () => {
    if (!selectedRecycler) return;
<<<<<<< HEAD
    setLoading(true);
    setIntakeResult(null);
    try {
      const res = await recyclerIntakeConfirm({
        transaction_id: selectedTxnId,
        recycler_id: selectedRecycler.recycler_id,
        measured_intake_weight_kg: intakeWeightKg,
        has_contamination: hasContamination,
        contamination_weight_deduction_kg: contaminationKg,
        intake_notes: intakeNotes,
        scanned_latitude: selectedRecycler.latitude,
        scanned_longitude: selectedRecycler.longitude,
      });
      setIntakeResult(res);
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
=======
    setVerifying(true);
    setEprReceipt(null);

    const tokenToUse = qrTokenInput.trim() || 'SCRAP-LOT-849102-M8K2P';

    try {
      const res = await verifyHandover(tokenToUse, selectedRecycler.recycler_id);
      setEprReceipt(res);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10B981', '#059669', '#34D399', '#F59E0B'],
      });
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
    } catch (err: any) {
      alert(`Intake confirmation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async () => {
    if (!selectedRecycler) return;
    setLoading(true);
    setOutcomeResult(null);
    try {
      const res = await recyclerRecordOutcome({
        transaction_id: selectedTxnId,
        recycler_id: selectedRecycler.recycler_id,
        treatment_outcome: treatmentOutcome,
        recovered_material_weight_kg: recoveredWeightKg,
        recovery_yield_percentage: recoveryYieldPct,
        treatment_method_details: treatmentMethod,
        downstream_destination: downstreamDest,
        epr_certificate_notes: 'Verified circular batch recovery under Plastic Waste Management Rules 2024.',
      });
      setOutcomeResult(res);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
    } catch (err: any) {
      alert(`Outcome record error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-6 rounded-2xl border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">Module 03</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Authorized Recycler Verification Workbench</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Recycler Intake & Circular Recovery Outcome Ledger</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              PostGIS spatial matching, certified weighbridge intake validation, discrepancy logging, and immutable EPR compliance certificate issuance.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DPCC/CPCB Accredited</span>
=======
  const filteredRecyclers = recyclers.filter((r) =>
    r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.permit_category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
              B2B Transfer Desk
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">CPCB Certified Recycler Exchange</span>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Authorized Recycler Custody & EPR Receipts
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            Locate authorized recycling and smelting facilities, verify digital consignment tokens with cryptographic custody transfer, and generate audit-compliant Extended Producer Responsibility (EPR) credit certificates.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-cyan-500" />
          <span>Statutory Compliance Form-2 Active</span>
        </div>
      </div>

<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Certified Recyclers Spatial Matrix */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nearby Certified Recyclers</h3>
            <span className="text-[11px] font-mono text-emerald-400">PostGIS Matrix</span>
=======
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Certified Recycler Facility Directory (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Accredited Recycling Facilities
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{filteredRecyclers.length} Registered</span>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by facility name or material..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full input-themed pl-9 pr-3 py-2 text-xs"
            />
          </div>

          {/* Recyclers List */}
          <div className="space-y-3">
<<<<<<< HEAD
            {recyclers.map((rec) => {
=======
            {filteredRecyclers.map((rec) => {
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
              const isSelected = selectedRecycler?.recycler_id === rec.recycler_id;
              return (
                <div
                  key={rec.recycler_id}
                  onClick={() => setSelectedRecycler(rec)}
<<<<<<< HEAD
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40'
                      : 'bg-black/40 border-white/10 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h4 className="font-bold text-white text-sm leading-snug">{rec.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{rec.rating}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 pl-6">{rec.permit_category}</p>
                  <span className="text-[10px] font-mono text-emerald-300 pl-6 block mt-0.5">{rec.permit_number}</span>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rec.distance_km} km away</span>
                    </span>
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{rec.contact_phone}</span>
=======
                  className={`p-4 rounded-xl border cursor-pointer transition-all surface-card ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/70 dark:bg-[#131D2E] shadow-sm'
                      : 'border-[var(--border-subtle)] hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500 text-white' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">{rec.name}</h4>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block mt-0.5">
                          ID: {rec.recycler_id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{rec.rating.toFixed(1)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2.5">
                    {rec.permit_category}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-2.5 border-t border-[var(--border-subtle)]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="font-mono">{rec.distance_km} km away</span>
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="font-mono text-[11px]">{rec.contact_phone}</span>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

<<<<<<< HEAD
        {/* Right 8 Cols: Intake Verification & Recovery Outcome Logging */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Intake Scale Verification */}
          <div className="p-6 rounded-2xl bg-black/50 border border-emerald-500/40 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <span>1. Recycler Weighbridge Intake & Discrepancy Verification</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Transaction Intake</span>
=======
        {/* Right Column: Handover Verification Station & Official EPR Certificate (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Verification Input Desk */}
          <div className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-500" />
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  Custody Transfer Verification Desk
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Facility: <strong className="text-cyan-600 dark:text-cyan-400">{selectedRecycler?.name || 'Select Facility'}</strong>
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Paste or scan the collector's digital consignment token to authenticate the scrap lot and generate an immutable EPR credit audit receipt.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-[var(--text-secondary)] block uppercase">
                Consignment QR Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  placeholder="e.g. SCRAP-LOT-849102-M8K2P"
                  className="flex-1 input-themed px-3 py-2 text-xs font-mono"
                />
                <button
                  onClick={handleScanVerify}
                  disabled={verifying || !selectedRecycler}
                  className="btn-emerald text-xs px-5 shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{verifying ? 'Authenticating...' : 'Verify Custody Transfer'}</span>
                </button>
              </div>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Select Incoming Transaction:</label>
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  {transactions.map((t) => (
                    <option key={t.transaction_id} value={t.transaction_id}>
                      {t.transaction_id} — {t.item_title} (₹{t.final_payable_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recycler Measured Scale Intake (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={intakeWeightKg}
                  onChange={(e) => setIntakeWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Contamination Weight Deduction (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={contaminationKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setContaminationKg(val);
                    setHasContamination(val > 0);
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Intake Inspection Notes:</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmIntake}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Weighbridge Intake & Generate Intake Hash</span>
            </button>

            {intakeResult && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1 font-mono text-xs text-emerald-200">
                <p className="font-bold">{intakeResult.message}</p>
                <p className="text-[10px] text-slate-300">Intake Hash: {intakeResult.epr_intake_hash}</p>
              </div>
            )}
          </div>

<<<<<<< HEAD
          {/* Section B: Final Circular Treatment & Recovery Outcome Recording */}
          <div className="p-6 rounded-2xl bg-black/50 border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-400" />
                <span>2. Record Final Physical Recovery & Circularity Outcome</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">EPR Audit Certificate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Treatment Outcome:</label>
                <select
                  value={treatmentOutcome}
                  onChange={(e) => setTreatmentOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="RECYCLED_RAW_MATERIAL">RECYCLED_RAW_MATERIAL (Pellets / Ingots)</option>
                  <option value="REFURBISHED_COMPONENTS">REFURBISHED_COMPONENTS (Tested for Reuse)</option>
                  <option value="SAFE_CHEMICAL_NEUTRALIZATION">SAFE_CHEMICAL_NEUTRALIZATION (Hazmat)</option>
                  <option value="ENERGY_RECOVERY">ENERGY_RECOVERY (Refuse Derived Fuel)</option>
                  <option value="NON_RECOVERABLE_RESIDUE">NON_RECOVERABLE_RESIDUE (Inert Slag)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recovered Material Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={recoveredWeightKg}
                  onChange={(e) => setRecoveredWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recovery Circularity Yield (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={recoveryYieldPct}
                  onChange={(e) => setRecoveryYieldPct(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Downstream Destination Facility:</label>
                <input
                  type="text"
                  value={downstreamDest}
                  onChange={(e) => setDownstreamDest(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                />
=======
          {/* Official EPR Certificate Presentation */}
          {eprReceipt && (
            <div className="surface-card p-6 space-y-5 border-2 border-emerald-500/50 relative shadow-lg">
              {/* Certificate Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] font-heading">
                      EPR Compliance Credit Certificate
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Form 2 Schedule III • Digital Waste Transfer Note
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Receipt ID</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{eprReceipt.receipt_id}</span>
                </div>
              </div>

              {/* Certificate Meta Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-[var(--bg-surface-well)] border border-[var(--border-subtle)] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Lot Reference</span>
                  <strong className="text-[var(--text-primary)] text-xs">{eprReceipt.lot_id}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Certified Weight</span>
                  <strong className="text-[var(--text-primary)] text-xs">{eprReceipt.total_weight_kg.toFixed(2)} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Accredited Plant</span>
                  <span className="text-[var(--text-secondary)] text-xs truncate block">{eprReceipt.recycler_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Audit Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">APPROVED</span>
                </div>
              </div>

              {/* Material Breakdown Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Transferred Material Segregation
                </span>
                <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="p-2.5">Material Sub-Component</th>
                        <th className="p-2.5">Certified Weight</th>
                        <th className="p-2.5">Purity Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {eprReceipt.components_breakdown.map((c, i) => (
                        <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="p-2.5 font-medium text-[var(--text-primary)]">{c.name}</td>
                          <td className="p-2.5 font-mono text-[var(--text-secondary)]">{c.estimated_weight_kg.toFixed(2)} kg</td>
                          <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round(c.purity_factor * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic Digital Signature & Timestamp */}
              <div className="p-3 rounded-lg bg-[var(--bg-surface-well)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Cryptographic Seal (Dual-Key SHA-256):</span>
                  <span>{new Date(eprReceipt.verified_at).toLocaleString()}</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 break-all select-all">
                  {eprReceipt.digital_signature}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="btn-ghost-dark text-xs flex-1 flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statutory Slip</span>
                </button>
                <button
                  onClick={() => alert(`Receipt ${eprReceipt.receipt_id} downloaded as signed audit manifest.`)}
                  className="btn-emerald text-xs flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download EPR Manifest</span>
                </button>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-xs">Treatment & Transformation Method:</label>
              <textarea
                value={treatmentMethod}
                onChange={(e) => setTreatmentMethod(e.target.value)}
                className="w-full h-20 p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <button
              onClick={handleRecordOutcome}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Record Final Outcome & Generate Cryptographic EPR Audit Certificate</span>
            </button>

            {outcomeResult && (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border-2 border-emerald-500/50 space-y-3 font-mono text-xs animate-pop-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Award className="w-5 h-5" />
                    <span>EPR EXTENDED PRODUCER RESPONSIBILITY CERTIFICATE</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    VERIFIED VALID
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Outcome:</span>
                    <strong className="text-white text-xs">{outcomeResult.treatment_outcome}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Recovered Weight:</span>
                    <strong className="text-emerald-400 text-xs">{outcomeResult.recovered_material_weight_kg} kg</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Recovery Yield:</span>
                    <strong className="text-white text-xs">{outcomeResult.recovery_yield_percentage}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">SHA-256 Non-Repudiable Audit Signature:</span>
                  <p className="text-[11px] text-emerald-400 break-all">{outcomeResult.epr_audit_hash}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
