import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Award,
  Phone,
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
import confetti from 'canvas-confetti';

export const RecyclerPortalView: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerPermit[]>([]);
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerPermit | null>(null);
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

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-6 rounded-2xl border-l-4 border-emerald-500 surface-card border border-[var(--border-subtle)] shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">Module 03</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-xs text-[var(--text-muted)]">Authorized Recycler Verification Workbench</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Recycler Intake &amp; Circular Recovery Outcome Ledger</h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              PostGIS spatial matching, certified weighbridge intake validation, discrepancy logging, and immutable EPR compliance certificate issuance.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>DPCC/CPCB Accredited</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Certified Recyclers Spatial Matrix */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nearby Certified Recyclers</h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">PostGIS Matrix</span>
          </div>

          <div className="space-y-3">
            {recyclers.map((rec) => {
              const isSelected = selectedRecycler?.recycler_id === rec.recycler_id;
              return (
                <div
                  key={rec.recycler_id}
                  onClick={() => setSelectedRecycler(rec)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                      : 'surface-card border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{rec.name}</h4>
                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{rec.permit_number}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      ★ {rec.rating}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{rec.facility_address}</span>
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {rec.contact_phone}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{rec.distance_km} km away</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Intake Verification & Outcome Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Authorized Recycler Intake & Weighbridge Verification */}
          <div className="p-6 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-500" />
                <span>1. Authorized Recycler Weighbridge Intake Scan</span>
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">Dual-Party Validation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Target Transfer Transaction:</label>
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                >
                  {transactions.map((t) => (
                    <option key={t.transaction_id} value={t.transaction_id}>
                      {t.transaction_id} • {t.item_title} ({t.sender_measured_weight_kg || 0}kg claimed)
                    </option>
                  ))}
                  {transactions.length === 0 && (
                    <option value="TXN-9F8E7D6C">TXN-9F8E7D6C • Crushed PET Flakes (85kg claimed)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Weighbridge Scale Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={intakeWeightKg}
                  onChange={(e) => setIntakeWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Contamination Weight Deduction (kg):</label>
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
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Intake Inspection Notes:</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmIntake}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Weighbridge Intake &amp; Generate Intake Hash</span>
            </button>

            {intakeResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/50 space-y-1 font-mono text-xs text-emerald-600 dark:text-emerald-200">
                <p className="font-bold">{intakeResult.message}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Intake Hash: {intakeResult.epr_intake_hash}</p>
              </div>
            )}
          </div>

          {/* Section B: Final Circular Treatment & Recovery Outcome Recording */}
          <div className="p-6 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-500" />
                <span>2. Record Final Physical Recovery &amp; Circularity Outcome</span>
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">EPR Audit Certificate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Treatment Outcome:</label>
                <select
                  value={treatmentOutcome}
                  onChange={(e) => setTreatmentOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                >
                  <option value="RECYCLED_RAW_MATERIAL">RECYCLED_RAW_MATERIAL (Pellets / Ingots)</option>
                  <option value="REFURBISHED_COMPONENTS">REFURBISHED_COMPONENTS (Tested for Reuse)</option>
                  <option value="SAFE_CHEMICAL_NEUTRALIZATION">SAFE_CHEMICAL_NEUTRALIZATION (Hazmat)</option>
                  <option value="ENERGY_RECOVERY">ENERGY_RECOVERY (Refuse Derived Fuel)</option>
                  <option value="NON_RECOVERABLE_RESIDUE">NON_RECOVERABLE_RESIDUE (Inert Slag)</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Recovered Material Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={recoveredWeightKg}
                  onChange={(e) => setRecoveredWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Recovery Circularity Yield (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={recoveryYieldPct}
                  onChange={(e) => setRecoveryYieldPct(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Downstream Destination Facility:</label>
                <input
                  type="text"
                  value={downstreamDest}
                  onChange={(e) => setDownstreamDest(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--text-muted)] block mb-1 font-mono text-xs">Treatment &amp; Transformation Method:</label>
              <textarea
                value={treatmentMethod}
                onChange={(e) => setTreatmentMethod(e.target.value)}
                className="w-full h-20 p-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <button
              onClick={handleRecordOutcome}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>Record Final Outcome &amp; Generate Cryptographic EPR Audit Certificate</span>
            </button>

            {outcomeResult && (
              <div className="p-5 rounded-2xl surface-card border-2 border-emerald-500/50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Award className="w-5 h-5" />
                    <span>EPR EXTENDED PRODUCER RESPONSIBILITY CERTIFICATE</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    VERIFIED VALID
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Outcome:</span>
                    <strong className="text-[var(--text-primary)] text-xs">{outcomeResult.treatment_outcome}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Recovered Weight:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-xs">{outcomeResult.recovered_material_weight_kg} kg</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Recovery Yield:</span>
                    <strong className="text-[var(--text-primary)] text-xs">{outcomeResult.recovery_yield_percentage}%</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] block">SHA-256 Non-Repudiable Audit Signature:</span>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 break-all">{outcomeResult.epr_audit_hash}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
