import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
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
  
  // Physical Scale Inputs (Strictly user-entered, NO AI weight estimation)
  const [measuredWeightKg, setMeasuredWeightKg] = useState<number>(12.5);
  const [itemCount, setItemCount] = useState<number | undefined>(undefined);
  const [collectorNotes, setCollectorNotes] = useState<string>('Calibrated hanging scale at morning depot.');

  // Pricing Catalog & Valuation
  const [pricingCatalog, setPricingCatalog] = useState<MaterialReferencePrice[]>([]);
  const [valuationResult, setValuationResult] = useState<ValuationCalculationResponse | null>(null);
  const [qrResult, setQrResult] = useState<HandoverQRGenerateResponse | null>(null);

  useEffect(() => {
    fetchPricingCatalog()
      .then((data) => setPricingCatalog(data))
      .catch((err) => console.error('Failed to load prices:', err));
  }, []);


  // Run Triage Analysis
  const handleAnalyze = async (presetId?: string, imageBase64?: string) => {
    if (presetId) setSelectedPreset(presetId);
    setLoading(true);
    setValuationResult(null);
    setQrResult(null);

    try {
      const res = await analyzeTriage(presetId, imageBase64);
      setTriageResult(res);

      // Compute initial valuation based on actual physical scale input
      if (measuredWeightKg > 0 && res.materials_detected.length > 0) {
        const primaryMaterial = res.materials_detected[0].name;
        const val = await calculateMeasuredValuation(primaryMaterial, res.category, measuredWeightKg, itemCount);
        setValuationResult(val);
      }
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate valuation whenever user updates physical scale weight
  const handleRecalculateValuation = async () => {
    if (!triageResult || triageResult.materials_detected.length === 0) return;
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
    if (!triageResult) return;
    setLoading(true);
    try {
      const res = await submitClarification(triageResult.item_title, optionId, triageResult.category);
      setTriageResult(res);
      if (measuredWeightKg > 0) {
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
    if (!triageResult) return;
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
    <div className="space-y-10">
      {/* Top Hero Banner */}
      <div className="text-center max-w-4xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>7-Category AI Waste Triage • Segregation Rules • Physical Scale Valuation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
          Kabadiwala & Collector <strong className="font-bold text-teal-400">Intelligent Workbench</strong>
        </h1>

        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
          Classify waste materials, receive strict co-storage and segregation protocols, record verified physical scale weights, and generate cryptographic handover lots.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleAnalyze(selectedPreset)}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-teal-950"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Classify Selected Item</span>
          </button>

          <label className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all">
            <UploadCloud className="w-4 h-4 text-teal-400" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
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
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Items Catalog & Physical Scale Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Preset Samples */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
              PRESET SCRAP SAMPLES
            </span>

            <div className="space-y-2">
              {PRESET_ITEMS.map((item) => {
                const isSelected = selectedPreset === item.id && !customImage;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCustomImage(null);
                      handleAnalyze(item.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-950/70 border-teal-500/80 text-teal-200 shadow-md shadow-teal-950'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0 font-sans">
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Scale Input Box (Mandatory Non-AI Measurement) */}
          <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-4">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
              <Scale className="w-4 h-4" />
              <span>RECORD PHYSICAL SCALE MEASUREMENT</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              ScrapSetu strictly enforces physical scale measurements recorded by authorized personnel.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Measured Scale Weight (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={measuredWeightKg}
                  onChange={(e) => setMeasuredWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-teal-500/40 text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Discrete Unit Count (optional):</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3 units"
                  value={itemCount || ''}
                  onChange={(e) => setItemCount(parseInt(e.target.value) || undefined)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Scale Verification Notes:</label>
                <input
                  type="text"
                  value={collectorNotes}
                  onChange={(e) => setCollectorNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-black/60 border border-white/10 text-slate-300 text-[11px] focus:outline-none focus:border-teal-400"
                />
              </div>

              <button
                onClick={handleRecalculateValuation}
                className="w-full py-2 rounded-xl bg-teal-600/80 hover:bg-teal-600 text-white font-semibold transition-all"
              >
                Recalculate with Scale Weight
              </button>
            </div>
          </div>

          {/* Transparent Reference Prices Card */}
          {pricingCatalog.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[10px] text-teal-400 font-bold uppercase">MANDI REFERENCE BENCHMARKS</span>
                <span className="text-[9px] text-slate-500">Live Index</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {pricingCatalog.slice(0, 4).map((p) => (
                  <div key={p.material_id} className="flex justify-between text-[11px] text-slate-300">
                    <span className="truncate max-w-[170px]">{p.material_name}</span>
                    <strong className="text-emerald-400">₹{p.reference_price}/kg</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Right Column: AI Triage, Segregation & Handover (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="p-16 text-center space-y-3 bg-black/40 rounded-2xl border border-white/10 font-mono">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
              <p className="text-teal-300 text-xs font-bold">Multimodal Waste Classification & Safety Analysis...</p>
            </div>
          ) : triageResult ? (
            <div className="space-y-6">
              {/* Header Analysis Bar */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-teal-400 uppercase font-bold tracking-wider">
                      CLASSIFIED AS: {triageResult.category.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{triageResult.item_title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pathway: {triageResult.recommended_pathway}</p>
                </div>

                <div className="font-mono">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      triageResult.confidence_tier === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : triageResult.confidence_tier === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {triageResult.confidence_tier === 'HIGH' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {triageResult.confidence_tier === 'MEDIUM' && <HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                    {triageResult.confidence_tier === 'LOW' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    {triageResult.confidence_tier} CONFIDENCE ({(triageResult.overall_confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Deterministic Hazard Alert */}
              {triageResult.hazard_analysis.is_hazardous && (
                <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-500/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 animate-bounce" />
                    <span>DETERMINISTIC SAFETY OVERRIDE TRIGGERED</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">{triageResult.hazard_analysis.hazard_description}</p>
                  <div className="p-3 rounded-xl bg-rose-900/50 text-xs font-semibold text-white border border-rose-500/40">
                    {triageResult.hazard_analysis.containment_protocol}
                  </div>
                </div>
              )}

              {/* Interactive Clarification Prompt (for Medium Confidence) */}
              {triageResult.confidence_tier === 'MEDIUM' && triageResult.clarification_prompt && (
                <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <HelpCircle className="w-4 h-4" />
                    <span>Collector Physical Clarification Prompt</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{triageResult.clarification_prompt.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {triageResult.clarification_prompt.options.map((opt) => (
                      <button
                        key={opt.option_id}
                        onClick={() => handleClarify(opt.option_id)}
                        className="p-3.5 rounded-xl bg-black/60 hover:bg-white/5 border border-amber-500/30 text-left transition-all hover:border-amber-400"
                      >
                        <p className="text-xs font-bold text-amber-300 mb-1">{opt.label}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{opt.impact_description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Segregation & Co-Storage Compatibility Matrix */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SEGREGATION & CO-STORAGE PROTOCOL</span>
                  </span>
                  <span className="text-[10px] text-slate-500">ISO/CPCB Compliant</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                    <span className="text-emerald-400 font-bold font-mono text-[11px] block">
                      ALLOWED CO-STORAGE / TRANSPORT:
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                      {triageResult.segregation_guidance.compatible_materials.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                    <span className="text-rose-400 font-bold font-mono text-[11px] block">
                      PROHIBITED CO-STORAGE (KEEP SEPARATE):
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                      {triageResult.segregation_guidance.incompatible_materials.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed pt-1 font-sans">
                  <strong>Reasoning:</strong> {triageResult.segregation_guidance.segregation_reasoning}
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-teal-300 font-mono">
                  {triageResult.segregation_guidance.safe_storage_instructions}
                </div>
              </div>

              {/* Valuation & Reference Price Breakdown */}
              {valuationResult && (
                <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-400" />
                      <span>Physical Scale Measured Valuation</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {valuationResult.price_source}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Scale Weight:</span>
                      <span className="font-bold text-white text-sm">{valuationResult.measured_quantity} kg</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Reference Rate:</span>
                      <span className="font-bold text-teal-400 text-sm">₹{valuationResult.effective_unit_price}/kg</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Handling Deduction:</span>
                      <span className="font-bold text-slate-300 text-sm">-₹{valuationResult.handling_deduction}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-teal-500/40">
                      <span className="text-teal-400 block text-[10px]">Net Payable:</span>
                      <span className="font-bold text-emerald-400 text-base">₹{valuationResult.net_payable_estimate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono pt-1">
                    {valuationResult.calculation_breakdown}
                  </p>
                </div>
              )}

              {/* Handover QR Code Generator */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>Cryptographic Waste Lot & Handover Token</span>
                  </h4>
                </div>

                {qrResult ? (
                  <div className="p-4 rounded-xl bg-white text-center shadow-2xl space-y-2">
                    <img src={qrResult.qr_image_base64} alt="QR" className="w-32 h-32 mx-auto" />
                    <span className="text-xs font-mono text-slate-900 font-bold block">LOT: {qrResult.lot_id}</span>
                    <p className="text-[10px] text-slate-600 font-mono">Present this signed QR to the Vendor or Recycler for intake weighbridge scan.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateQR}
                    disabled={triageResult.hazard_analysis.is_hazardous}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-teal-950 flex items-center justify-center gap-2"
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
