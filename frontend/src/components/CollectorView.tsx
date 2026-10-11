import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Sparkles,
  UploadCloud,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Scale,
  RefreshCw,
  ShieldCheck,
  Tag,
  Layers,
  Banknote,
  Cpu,
} from 'lucide-react';
import {
  analyzeTriage,
  submitClarification,
  fetchPricingCatalog,
  calculateMeasuredValuation,
  createWasteLot,
  generateHandoverQR,
} from '../services/api';
import type {
  TriageAnalysisResponse,
  MaterialReferencePrice,
  ValuationCalculationResponse,
  HandoverQRGenerateResponse,
  HazardMarkers,
} from '../services/api';

const PRESET_ITEMS = [
  { id: 'electric_motor', label: 'Induction Motor Assembly', tag: 'Recyclable Metal', category: 'recyclable' },
  { id: 'swollen_laptop', label: 'Swollen Li-ion Laptop Battery', tag: 'Hazardous Hazmat', category: 'hazardous' },
  { id: 'copper_cable', label: 'Industrial Wiring Cable', tag: 'Clarification Needed', category: 'recyclable' },
  { id: 'organic_kitchen_waste', label: 'Mixed Organic Kitchen Waste', tag: 'Biodegradable', category: 'biodegradable' },
  { id: 'unknown_rusty_compressor', label: 'Sealed Degraded Compressor', tag: 'Low Confidence', category: 'unknown' },
];

export const CollectorView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('electric_motor');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<TriageAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reportedHazards, setReportedHazards] = useState<Partial<HazardMarkers>>({});
  const analysisVersion = useRef(0);

  // Physical Scale Inputs (Strictly user-entered, NO AI weight estimation)
  const [measuredWeightKg, setMeasuredWeightKg] = useState<number>(12.5);
  const [itemCount, setItemCount] = useState<number | undefined>(undefined);
  const [collectorNotes, setCollectorNotes] = useState<string>('Calibrated hanging scale at morning depot.');

  // Pricing Catalog & Valuation
  const [pricingCatalog, setPricingCatalog] = useState<MaterialReferencePrice[]>([]);
  const [valuationResult, setValuationResult] = useState<ValuationCalculationResponse | null>(null);
  const [qrResult, setQrResult] = useState<HandoverQRGenerateResponse | null>(null);

  // Run Triage Analysis
  const handleAnalyze = async (presetId?: string, imageBase64?: string) => {
    const version = ++analysisVersion.current;
    if (presetId) setSelectedPreset(presetId);
    setLoading(true);
    setAnalysisError(null);
    setTriageResult(null);
    setValuationResult(null);
    setQrResult(null);

    try {
      const res = await analyzeTriage(presetId, imageBase64, reportedHazards);
      if (version !== analysisVersion.current) return;
      setTriageResult(res);

      // Compute initial valuation based on actual physical scale input
      if (res.analysis_source === 'demo' && !res.requires_manual_inspection && measuredWeightKg > 0 && res.materials_detected.length > 0) {
        const primaryMaterial = res.materials_detected[0].name;
        const val = await calculateMeasuredValuation(primaryMaterial, res.category, measuredWeightKg, itemCount);
        if (version === analysisVersion.current) setValuationResult(val);
      }
    } catch (err) {
      if (version === analysisVersion.current) {
        setTriageResult(null);
        setAnalysisError(err instanceof Error ? err.message : 'Analysis unavailable. Retry or request manual inspection.');
      }
    } finally {
      if (version === analysisVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingCatalog()
      .then((data) => setPricingCatalog(data))
      .catch((err) => console.error('Failed to load prices:', err));

    // Initial analysis
    handleAnalyze('electric_motor');
    return () => { analysisVersion.current += 1; };
  }, []);

  // Fallback QRCode generator if backend returns empty base64 string
  useEffect(() => {
    if (qrResult?.qr_token && !qrResult.qr_image_base64) {
      QRCode.toDataURL(qrResult.qr_token, {
        width: 200,
        margin: 1.5,
        color: { dark: '#090D15', light: '#FFFFFF' },
      }).then((url) => {
        setQrResult((prev) => (prev ? { ...prev, qr_image_base64: url } : null));
      });
    }
  }, [qrResult?.qr_token, qrResult?.qr_image_base64]);

  // Recalculate valuation whenever user updates physical scale weight
  const handleRecalculateValuation = async () => {
    if (!triageResult || triageResult.requires_manual_inspection || triageResult.analysis_source !== 'demo' || triageResult.materials_detected.length === 0) return;
    try {
      const primaryMaterial = triageResult.materials_detected[0].name;
      const val = await calculateMeasuredValuation(primaryMaterial, triageResult.category, measuredWeightKg, itemCount);
      setValuationResult(val);
    } catch (err) {
      console.error('Valuation error:', err);
    }
  };

  // Submit clarification
  const handleClarify = async (optionId: string) => {
    if (!triageResult || triageResult.analysis_source !== 'demo' || triageResult.hazard_analysis.is_hazardous) return;
    setLoading(true);
    try {
      const res = await submitClarification(triageResult.item_title, optionId, triageResult.category);
      setTriageResult(res);
      setValuationResult(null);
      setQrResult(null);
      if (!res.requires_manual_inspection && measuredWeightKg > 0 && res.materials_detected.length > 0) {
        const val = await calculateMeasuredValuation(res.materials_detected[0].name, res.category, measuredWeightKg, itemCount);
        setValuationResult(val);
      }
    } catch (err) {
      console.error('Clarify error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Waste Lot & Generate QR
  const handleGenerateQR = async () => {
    if (!triageResult || triageResult.requires_manual_inspection) return;
    setLoading(true);
    try {
      const lot = await createWasteLot(
        'kabadi_ramesh_01',
        'Ramesh Kumar (Kabadiwala)',
        triageResult.item_title,
        triageResult.category,
        measuredWeightKg,
        itemCount,
        'Segregated / Weighed on Physical Scale',
        triageResult.hazard_analysis
      );

      const qr = await generateHandoverQR(lot.lot_id, 'kabadi_ramesh_01', 'KABADIWALA');
      setQrResult(qr);
    } catch (err) {
      console.error('QR creation error:', err);
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
              Module 01 • Intake &amp; Triage
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">Terminal NCR-04 Scale Bay</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Scrap Intake Triage &amp; Physical Scale Valuation
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            Visual material suggestions, hazard review, entered scale weights, and prototype handover records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-ghost-dark text-xs flex items-center gap-2 cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Upload Photo</span>
            <input
              type="file"
              aria-label="Upload scrap photo"
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  analysisVersion.current += 1;
                  setTriageResult(null);
                  setValuationResult(null);
                  setQrResult(null);
                  setCustomImage(null);
                  if (file.size > 3_750_000) {
                    setAnalysisError('Image must be at most 3.75 MB. Resize it and try again.');
                    e.target.value = '';
                    return;
                  }
                  setLoading(true);
                  setAnalysisError(null);
                  const reader = new FileReader();
                  reader.onerror = () => {
                    setLoading(false);
                    setAnalysisError('Unable to read this photo. Choose another file.');
                  };
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    setCustomImage(base64);
                    handleAnalyze(undefined, base64);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={() => customImage ? handleAnalyze(undefined, customImage) : handleAnalyze(selectedPreset)}
            disabled={loading}
            className="btn-emerald text-xs flex items-center gap-2"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{customImage ? 'Analyze uploaded photo' : 'Run demo sample'}</span>
          </button>
        </div>
      </div>

      <div className="surface-card p-4 space-y-3">
        <p className="text-sm" role="status">
          {triageResult?.analysis_source === 'bedrock'
            ? `Uploaded photo analyzed with ${triageResult.model_id}. Visual suggestions do not verify purity or safety.`
            : customImage ? 'Uploaded photo selected. Analysis pending or unavailable.' : 'Demo sample mode — these examples are not live model results.'}
        </p>
        <fieldset disabled={loading} className="flex flex-wrap gap-4 text-xs">
          <legend className="mb-2">Report any hazards you noticed (changing these requires re-analysis)</legend>
          {([
            ['battery_damage', 'Damaged battery'], ['chemical_leak', 'Chemical leak'],
            ['pressurized_canister', 'Pressurized container'], ['exposed_wiring', 'Exposed wiring'],
            ['sharp_edges', 'Sharp edges'],
          ] as const).map(([flag, label]) => (
            <label key={flag} className="flex items-center gap-2">
              <input type="checkbox" checked={!!reportedHazards[flag]} onChange={(e) => {
                setReportedHazards((previous) => ({ ...previous, [flag]: e.target.checked }));
                analysisVersion.current += 1;
                setTriageResult(null);
                setValuationResult(null);
                setQrResult(null);
              }} />{label}
            </label>
          ))}
        </fieldset>
        {triageResult?.requires_manual_inspection && <p role="alert">Inspection required. Valuation and handover are paused until qualified review.</p>}
        {triageResult?.analysis_source === 'bedrock' && <p className="text-xs">Price estimates for uploaded images are unavailable until the material, grade, and unit are confirmed.</p>}
        {analysisError && <p role="alert" className="text-rose-600">{analysisError}</p>}
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            <span>Entered Scale Weight</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{measuredWeightKg.toFixed(1)}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">kg</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Collector-reported measurement</span>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            <span>Category Classification</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold font-heading text-[var(--text-primary)] truncate">
              {triageResult ? triageResult.category.toUpperCase() : 'PENDING'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              {triageResult ? `${(triageResult.overall_confidence * 100).toFixed(0)}%` : 'Ready'}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">
            {triageResult?.confidence_tier ? `${triageResult.confidence_tier} Confidence Tier` : 'AWS Bedrock Vision'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Mandi Benchmark</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {valuationResult ? `₹${valuationResult.effective_unit_price}` : '₹--'}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">/kg</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">
            {valuationResult?.price_source || 'Delhi Mandi Verified'}
          </span>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            <span>Net Payable Payout</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {valuationResult ? `₹${valuationResult.net_payable_estimate.toFixed(0)}` : '₹--'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Instant UPI</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">After verified handling fee</span>
        </div>
      </div>

      {/* Main Grid: Inputs / Presets (4 Cols) + Analysis / Valuation (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Samples & Scale Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Preset Scrap Samples */}
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Preset Scrap Samples
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">5 Catalog Items</span>
            </div>

            <div className="space-y-2">
              {PRESET_ITEMS.map((item) => {
                const isSelected = selectedPreset === item.id && !customImage;
                return (
                  <button
                    key={item.id}
                    disabled={loading}
                    onClick={() => {
                      setCustomImage(null);
                      handleAnalyze(item.id);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/80 text-[var(--text-primary)] shadow-xs'
                        : 'bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] shrink-0 font-mono">
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Scale Input Box */}
          <div className="surface-card p-4 space-y-3 border border-emerald-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Physical Scale Measurement</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Strict Scale Policy</span>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Weights must originate from authorized platform or crane hanging scales.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-secondary)] font-mono text-[11px] block mb-1">
                  Measured Scale Weight (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={measuredWeightKg}
                  onChange={(e) => setMeasuredWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 input-themed font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] font-mono text-[11px] block mb-1">
                  Discrete Unit Count (optional):
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1 unit"
                  value={itemCount || ''}
                  onChange={(e) => setItemCount(parseInt(e.target.value) || undefined)}
                  className="w-full p-2 input-themed font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] font-mono text-[11px] block mb-1">
                  Scale Calibration Notes:
                </label>
                <input
                  type="text"
                  value={collectorNotes}
                  onChange={(e) => setCollectorNotes(e.target.value)}
                  className="w-full p-2 input-themed text-xs"
                />
              </div>

              <button
                onClick={handleRecalculateValuation}
                disabled={loading || !triageResult || triageResult.requires_manual_inspection || triageResult.analysis_source !== 'demo'}
                className="w-full btn-emerald text-xs mt-1"
              >
                Recalculate with Scale Weight
              </button>
            </div>
          </div>

          {/* Mandi Reference Benchmarks Card */}
          {pricingCatalog.length > 0 && (
            <div className="surface-card p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                  Mandi Benchmark Rates
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Live Index</span>
              </div>
              <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto pr-1">
                {pricingCatalog.slice(0, 5).map((p) => (
                  <div key={p.material_id} className="flex justify-between items-center text-[11px] py-1 border-b border-[var(--border-subtle)] last:border-0">
                    <span className="text-[var(--text-secondary)] truncate max-w-[160px]">{p.material_name}</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{p.reference_price}/kg</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Triage, Hazard Rules, Segregation & Handover (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="surface-card p-12 text-center space-y-3 font-mono">
              <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
              <p className="text-[var(--text-primary)] text-xs font-bold">
                {customImage ? 'Analyzing uploaded photo…' : 'Loading demo sample…'}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] block">
                Checking the selected input and review requirements
              </span>
            </div>
          ) : triageResult ? (
            <div className="space-y-4">
              {/* Header Analysis Bar */}
              <div className="surface-card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {triageResult.category.toUpperCase()}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {triageResult.analysis_source === 'demo' ? 'Demonstration result' : 'Provisional visual identification'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      {triageResult.item_title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Recommended Pathway: <strong className="text-[var(--text-secondary)]">{triageResult.recommended_pathway}</strong>
                    </p>
                  </div>

                  <div className="font-mono">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                        triageResult.confidence_tier === 'HIGH'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          : triageResult.confidence_tier === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {triageResult.confidence_tier === 'HIGH' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {triageResult.confidence_tier === 'MEDIUM' && <HelpCircle className="w-3.5 h-3.5 text-amber-500" />}
                      {triageResult.confidence_tier === 'LOW' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      {triageResult.confidence_tier} {triageResult.analysis_source === 'demo' ? 'DEMO SCORE' : 'MODEL SELF-ASSESSMENT'} ({(triageResult.overall_confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Detected Materials Pills */}
                {triageResult.materials_detected && triageResult.materials_detected.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                      Detected Constituents:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {triageResult.materials_detected.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-mono flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{m.name}</span>
                          {m.purity_grade && <span className="text-[10px] text-[var(--text-muted)]">({m.purity_grade})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Deterministic Hazard Alert */}
              {triageResult.hazard_analysis?.is_hazardous && (
                <div className="surface-card p-5 border border-rose-500/60 bg-rose-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs font-mono uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Deterministic Safety Override Triggered</span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {triageResult.hazard_analysis.hazard_description}
                  </p>
                  <div className="p-3 rounded-lg bg-[var(--bg-surface-well)] border border-rose-500/30 text-xs font-mono text-rose-700 dark:text-rose-300">
                    <strong>Handling restrictions:</strong> {triageResult.hazard_analysis.containment_protocol}
                  </div>
                </div>
              )}

              {/* Interactive Clarification Prompt (for Medium Confidence) */}
              {triageResult.confidence_tier === 'MEDIUM' && triageResult.clarification_prompt && (
                <div className="surface-card p-5 border border-amber-500/40 bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <HelpCircle className="w-4 h-4" />
                    <span>Collector Physical Clarification Prompt</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    {triageResult.clarification_prompt.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {triageResult.clarification_prompt.options.map((opt) => (
                      <button
                        key={opt.option_id}
                        onClick={() => handleClarify(opt.option_id)}
                        disabled={loading}
                        className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-amber-500/30 text-left transition-all hover:border-amber-400 cursor-pointer"
                      >
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-300 mb-0.5">{opt.label}</p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono leading-tight">{opt.impact_description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Segregation & Co-Storage Compatibility Matrix */}
              {triageResult.segregation_guidance && (
                <div className="surface-card p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <span className="font-mono text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Segregation &amp; Co-Storage Protocol</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Provisional guidance</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 space-y-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px] block">
                        ALLOWED CO-STORAGE:
                      </span>
                      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5 text-[11px]">
                        {triageResult.segregation_guidance.compatible_materials.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/25 space-y-1">
                      <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono text-[11px] block">
                        PROHIBITED CO-STORAGE:
                      </span>
                      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5 text-[11px]">
                        {triageResult.segregation_guidance.incompatible_materials.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="text-[var(--text-muted)] text-[11px] leading-relaxed pt-1 font-mono">
                    <strong>Rule:</strong> {triageResult.segregation_guidance.segregation_reasoning}
                  </p>
                </div>
              )}

              {/* Valuation & Reference Price Breakdown */}
              {valuationResult && (
                <div className="surface-card p-5 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span>Physical Scale Measured Valuation</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      {valuationResult.price_source}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] block text-[10px]">Scale Weight:</span>
                      <span className="font-bold text-[var(--text-primary)] text-sm">{valuationResult.measured_quantity} kg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] block text-[10px]">Benchmark Rate:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{valuationResult.effective_unit_price}/kg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] block text-[10px]">Handling Deduction:</span>
                      <span className="font-bold text-[var(--text-muted)] text-sm">-₹{valuationResult.handling_deduction}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-emerald-500/40">
                      <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Net Payable:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{valuationResult.net_payable_estimate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    {valuationResult.calculation_breakdown}
                  </p>
                </div>
              )}

              {/* Handover QR Code Generator */}
              <div className="surface-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h4 className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographic Waste Lot &amp; Handover Token</span>
                  </h4>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Signed Digital Token</span>
                </div>

                {qrResult ? (
                  <div className="p-5 rounded-xl bg-white dark:bg-white text-center shadow-md space-y-2 border border-slate-200">
                    {qrResult.qr_image_base64 && (
                      <img src={qrResult.qr_image_base64} alt="QR" className="w-32 h-32 mx-auto" />
                    )}
                    <span className="text-xs font-mono text-slate-900 font-bold block">LOT: {qrResult.lot_id}</span>
                    <p className="text-[10px] text-slate-600 font-mono">Present this signed token to Vendor or Recycler weighbridge scanner.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateQR}
                    disabled={loading || triageResult.requires_manual_inspection}
                    className="w-full btn-emerald text-xs py-2.5 flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate Signed Handover Lot QR (Physical Scale {measuredWeightKg} kg)</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
