import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Award,
  Phone,
  Scale,
  Factory,
  Percent,
  CheckCircle2,
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
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
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
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.5 } });
    } catch (err: any) {
      alert(`Outcome record error: ${err.message}`);
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
              Module 03 • Recycler Custody
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">DPCC &amp; CPCB Schedule-III Registered</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Authorized Recycler Custody &amp; Weighbridge Intake
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            PostGIS spatial matching, certified weighbridge intake validation, discrepancy logging, and digital EPR credit manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>DPCC/CPCB Accredited</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-emerald-500" />
            <span>Authorized Smelters &amp; Mills</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{recyclers.length}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Accredited</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Delhi-NCR Industrial Zones</span>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-500" />
            <span>Weighbridge Intake</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{intakeWeightKg.toFixed(1)}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">kg</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Platform scale verified</span>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-amber-500" />
            <span>Recovery Circularity Yield</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{recoveryYieldPct}%</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">High Yield</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Recovered: {recoveredWeightKg} kg</span>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>EPR Audit Trail</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">CPCB</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Schedule-III</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Form-2 Non-Repudiable Certificate</span>
        </div>
      </div>

      {/* Main Grid: Nearby Facilities (4 Cols) + Intake & Outcome Forms (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Nearby Certified Recyclers (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nearby Certified Recyclers</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">PostGIS Matrix</span>
          </div>

          <div className="space-y-2.5">
            {recyclers.map((rec) => {
              const isSelected = selectedRecycler?.recycler_id === rec.recycler_id;
              return (
                <div
                  key={rec.recycler_id}
                  onClick={() => setSelectedRecycler(rec)}
                  className={`surface-card p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                      : 'hover:border-[var(--border-medium)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] leading-tight">{rec.name}</h4>
                      <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{rec.permit_number}</p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                      ★ {rec.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{rec.facility_address}</span>
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {rec.contact_phone}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{rec.distance_km} km away</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Intake Verification & Outcome Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section 1: Authorized Recycler Weighbridge Intake Scan */}
          <div className="surface-card p-5 space-y-4 border border-emerald-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                <span>1. Authorized Recycler Weighbridge Intake Scan</span>
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">Dual-Party Validation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Target Transfer Transaction:</label>
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="w-full p-2 input-themed text-xs"
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
                <label className="text-[var(--text-secondary)] block mb-1">Weighbridge Scale Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={intakeWeightKg}
                  onChange={(e) => setIntakeWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 input-themed font-bold text-emerald-600 dark:text-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Contamination Weight Deduction (kg):</label>
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
                  className="w-full p-2 input-themed"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Intake Inspection Notes:</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-2 input-themed"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmIntake}
              disabled={loading}
              className="w-full btn-emerald text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Weighbridge Intake &amp; Generate Intake Hash</span>
            </button>

            {intakeResult && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1 font-mono text-xs text-emerald-600 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{intakeResult.message}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] break-all">Intake Hash: {intakeResult.epr_intake_hash}</p>
              </div>
            )}
          </div>

          {/* Section 2: Final Circular Treatment & Recovery Outcome Recording */}
          <div className="surface-card p-5 space-y-4 border border-emerald-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Factory className="w-4 h-4 text-emerald-500" />
                <span>2. Record Final Physical Recovery &amp; Circularity Outcome</span>
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">EPR Audit Certificate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Treatment Outcome:</label>
                <select
                  value={treatmentOutcome}
                  onChange={(e) => setTreatmentOutcome(e.target.value)}
                  className="w-full p-2 input-themed text-xs"
                >
                  <option value="RECYCLED_RAW_MATERIAL">RECYCLED_RAW_MATERIAL (Pellets / Ingots)</option>
                  <option value="REFURBISHED_COMPONENTS">REFURBISHED_COMPONENTS (Tested for Reuse)</option>
                  <option value="SAFE_CHEMICAL_NEUTRALIZATION">SAFE_CHEMICAL_NEUTRALIZATION (Hazmat)</option>
                  <option value="ENERGY_RECOVERY">ENERGY_RECOVERY (Refuse Derived Fuel)</option>
                  <option value="NON_RECOVERABLE_RESIDUE">NON_RECOVERABLE_RESIDUE (Inert Slag)</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Recovered Material Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={recoveredWeightKg}
                  onChange={(e) => setRecoveredWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 input-themed font-bold text-emerald-600 dark:text-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Recovery Circularity Yield (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={recoveryYieldPct}
                  onChange={(e) => setRecoveryYieldPct(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 input-themed"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Downstream Destination Facility:</label>
                <input
                  type="text"
                  value={downstreamDest}
                  onChange={(e) => setDownstreamDest(e.target.value)}
                  className="w-full p-2 input-themed"
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-mono text-xs">Treatment &amp; Transformation Method:</label>
              <textarea
                value={treatmentMethod}
                onChange={(e) => setTreatmentMethod(e.target.value)}
                className="w-full h-16 p-2 input-themed text-xs font-mono resize-none"
              />
            </div>

            <button
              onClick={handleRecordOutcome}
              disabled={loading}
              className="w-full btn-emerald text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Record Final Outcome &amp; Generate Cryptographic EPR Audit Certificate</span>
            </button>

            {outcomeResult && (
              <div className="surface-well p-4 rounded-xl border border-emerald-500/40 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Award className="w-4 h-4" />
                    <span>EPR EXTENDED PRODUCER RESPONSIBILITY CERTIFICATE</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                    VERIFIED VALID
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Outcome</span>
                    <strong className="text-[var(--text-primary)] text-xs truncate block">{outcomeResult.treatment_outcome}</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Recovered</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-xs">{outcomeResult.recovered_material_weight_kg} kg</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] text-[10px] block">Circularity Yield</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-xs">{outcomeResult.recovery_yield_percentage}%</strong>
                  </div>
                </div>

                <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-0.5">
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
