import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
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
=======
import QRCode from 'qrcode';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  QrCode,
  ShieldAlert,
  Zap,
  BatteryCharging,
  Cable,
  Cog,
  UploadCloud,
  Scale,
  FileText,
  Check,
  X,
  TrendingUp,
  Layers,
  Printer,
  ArrowRight,
  ShieldCheck,
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
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

<<<<<<< HEAD

const PRESET_ITEMS = [
  { id: 'electric_motor', label: 'Induction Motor Assembly', tag: 'Recyclable Metal', category: 'recyclable' },
  { id: 'swollen_laptop', label: 'Swollen Li-ion Laptop Battery', tag: 'Hazardous Hazmat', category: 'hazardous' },
  { id: 'copper_cable', label: 'Industrial Wiring Cable', tag: 'Clarification Needed', category: 'recyclable' },
  { id: 'organic_kitchen_waste', label: 'Mixed Organic Kitchen Waste', tag: 'Biodegradable', category: 'biodegradable' },
  { id: 'unknown_rusty_compressor', label: 'Sealed Degraded Compressor', tag: 'Low Confidence', category: 'unknown' },
=======
const PRESET_SCRAP_ITEMS = [
  {
    id: 'electric_motor',
    name: 'Induction Motor (1.5 HP)',
    category: 'Small Appliances & Motors',
    tag: 'Arbitrage Opportunity',
    tagColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
    icon: Zap,
    description: 'High-purity copper stator windings housed in cast iron shell. Prime candidate for mechanical separation.',
    spec: 'Est. 6.5 kg • +187% Margin',
  },
  {
    id: 'swollen_laptop',
    name: 'Li-Ion Battery Pack',
    category: 'Hazardous Energy Storage',
    tag: 'Critical Hazard Alert',
    tagColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
    icon: BatteryCharging,
    description: 'Swollen pouch cells displaying thermal venting risk. Triggers mandatory safety containment SOP.',
    spec: 'Est. 0.45 kg • Mandatory HazMat',
  },
  {
    id: 'copper_cable',
    name: 'Heavy Armored Cable (25m)',
    category: 'Electrical Infrastructure',
    tag: 'Purity Assay Required',
    tagColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: Cable,
    description: 'Heavy gauge multi-strand wire requiring purity assay confirmation (Electrolytic Copper vs CCA).',
    spec: 'Est. 12.0 kg • Clarification Needed',
  },
  {
    id: 'unknown_rusty_compressor',
    name: 'Sealed Refrigeration Unit',
    category: 'Heavy Equipment Scrap',
    tag: 'Depot Inspection Flag',
    tagColor: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/30',
    icon: Cog,
    description: 'Corroded exterior shell with sealed hermetic chamber. Triggers physical ultrasonic depot inspection.',
    spec: 'Est. 18.5 kg • Visual Conf. Low',
  },
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
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
<<<<<<< HEAD
=======
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showDisassemblyModal, setShowDisassemblyModal] = useState<boolean>(false);
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    handleAnalyze('electric_motor');
  }, []);

  // Generate QR code data URL whenever qrResult changes
  useEffect(() => {
    if (qrResult?.qr_token) {
      QRCode.toDataURL(qrResult.qr_token, {
        width: 220,
        margin: 1.5,
        color: { dark: '#090D15', light: '#FFFFFF' },
      }).then((url) => setQrDataUrl(url));
    }
  }, [qrResult]);
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0

  useEffect(() => {
    fetchPricingCatalog()
      .then((data) => setPricingCatalog(data))
      .catch((err) => console.error('Failed to load prices:', err));
  }, []);


  // Run Triage Analysis
  const handleAnalyze = async (presetId?: string, imageBase64?: string) => {
    if (presetId) {
      setSelectedPreset(presetId);
      setCustomImage(null);
    }
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

<<<<<<< HEAD
  // Create Waste Lot & Generate QR
  const handleGenerateQR = async () => {
=======
  // Create Waste Lot & Generate Consignment QR
  const handleCreateLotAndQR = async () => {
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
    if (!triageResult) return;
    setLoading(true);
    try {
      const lot = await createWasteLot(
<<<<<<< HEAD
        'kabadi_ramesh_01',
        'Ramesh Kumar (Kabadiwala)',
=======
        'COLLECTOR-DL-9942',
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
        triageResult.item_title,
        triageResult.category,
        measuredWeightKg,
        itemCount,
        'Segregated / Weighed on Physical Scale',
        triageResult.hazard_analysis
      );

<<<<<<< HEAD
      const qr = await generateHandoverQR(lot.lot_id, 'kabadi_ramesh_01', 'KABADIWALA');
=======
      const qr = await generateHandoverQR(lot.lot_id, 'COLLECTOR-DL-9942');
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
      setQrResult(qr);
    } catch (err) {
      console.error('QR creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (qrResult?.qr_token) {
      navigator.clipboard.writeText(qrResult.qr_token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <div className="space-y-8 py-6">
      {/* Station Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/25 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Yard Intake Station #04
            </span>
            <span className="text-[var(--text-muted)] opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">Terminal ID: DL-NCR-STATION-04</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Scrap Intake Triage & Disassembly Arbitrage
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-3xl leading-relaxed">
            AI-powered material triage, purity assay, and automated financial decision engine. Determines whether unsegregated scrap yields higher profit when sold bulk as-is or harvested through component teardown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <label className="btn-ghost-dark text-xs cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{customImage ? 'Change Custom Photo' : 'Upload Scrap Photo'}</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => handleAnalyze(selectedPreset)}
            disabled={loading}
            className="btn-emerald text-xs shadow-md"
          >
            <Zap className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'fill-white'}`} />
            <span>{loading ? 'Evaluating Vision...' : 'Run Triage Assessment'}</span>
          </button>
        </div>
      </div>

      {/* Preset Scrap Consignment Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-heading">
              Select Scrap Consignment Sample
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] font-mono">
              4 Diagnostic Lots
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {customImage ? '● Custom image actively loaded' : 'Click any preset to inspect and re-evaluate'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESET_SCRAP_ITEMS.map((item) => {
            const isSelected = selectedPreset === item.id && !customImage;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleAnalyze(item.id)}
                className={`p-4 rounded-xl text-left border transition-all surface-card surface-card-interactive cursor-pointer relative ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/60 dark:bg-blue-950/30 shadow-md'
                    : 'border-[var(--border-subtle)] hover:border-blue-500/40 hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold font-mono tracking-wider shadow-sm">
                    <Check className="w-2.5 h-2.5" /> ACTIVE
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isSelected && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.tagColor}`}>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
                      {item.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-tight">{item.name}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{item.spec}</span>
                  <ArrowRight className="w-3 h-3 text-blue-500 opacity-80" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Inspection Results Container */}
      {triageResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Triage Details & Material Breakdown (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visual Assessment Header Card */}
            <div className="surface-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">Classified As</span>
                    <span className="opacity-40">•</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {triageResult.category}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-heading">
                    {triageResult.item_title}
                  </h3>
                </div>

                <div className="text-right shrink-0 bg-[var(--bg-surface-subtle)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono font-semibold">AI Confidence</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 bg-[var(--bg-surface-well)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className={`h-full ${
                          triageResult.confidence_tier === 'HIGH'
                            ? 'bg-emerald-500'
                            : triageResult.confidence_tier === 'MEDIUM'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.round(triageResult.overall_confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      {Math.round(triageResult.overall_confidence * 100)}%
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase block mt-0.5">
                    {triageResult.confidence_tier} CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Recommended Circular Pathway */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <span className="text-[var(--text-muted)]">Optimal Circular Recovery: </span>
                  <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">{triageResult.recommended_pathway}</strong>
                </div>
              </div>

              {/* Critical Hazard Alert Override */}
              {triageResult.hazard_analysis.is_hazardous && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold tracking-tight uppercase">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Hazard Alert & Safety Isolation Directive</span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
                    {triageResult.hazard_analysis.hazard_description}
                  </p>
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/25 text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                    <strong>Containment SOP:</strong> {triageResult.hazard_analysis.containment_protocol}
                  </div>
                </div>
              )}

              {/* Low Confidence Depot Inspection Flag */}
              {triageResult.depot_inspection_required && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Physical Yard Depot Inspection Flagged</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                    {triageResult.depot_reason || 'Visual confidence falls below automated clearance thresholds. Ultrasonic density assay or manual core inspection required prior to settlement.'}
                  </p>
                </div>
              )}

              {/* Material Clarification Prompt (Interactive Purity Choice) */}
              {triageResult.clarification_prompt && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-300 font-bold">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Material Grade Clarification Needed</span>
                  </div>
                  <p className="text-[var(--text-secondary)] font-medium">
                    {triageResult.clarification_prompt.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {triageResult.clarification_prompt.options.map((opt) => (
                      <button
                        key={opt.option_id}
                        onClick={() => handleClarify(opt.option_id)}
                        className="p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-emerald-500/10 border border-[var(--border-medium)] hover:border-emerald-500/50 text-left transition-all shadow-sm cursor-pointer group"
                      >
                        <div className="font-bold text-[var(--text-primary)] text-xs group-hover:text-emerald-500 transition-colors">
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                          {opt.impact_description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
<<<<<<< HEAD
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
=======

            {/* Material Composition Breakdown Table */}
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 font-heading">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Constituent Material Breakdown</span>
                </h4>
                <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                  Total Lot Weight: <strong className="text-[var(--text-primary)]">
                    {triageResult.components.reduce((acc, c) => acc + c.estimated_weight_kg, 0).toFixed(1)} kg
                  </strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase font-mono text-[10px]">
                      <th className="py-2.5 font-semibold">Material Component</th>
                      <th className="py-2.5 font-semibold">Weight</th>
                      <th className="py-2.5 font-semibold">Market Rate</th>
                      <th className="py-2.5 font-semibold">Purity</th>
                      <th className="py-2.5 font-semibold text-right">Extracted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {triageResult.components.map((comp, i) => {
                      const grossVal = comp.estimated_weight_kg * comp.index_price_per_kg * comp.purity_factor;
                      return (
                        <tr key={i} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 font-sans font-semibold text-[var(--text-primary)]">
                            {comp.name}
                            <span className="block text-[10px] text-[var(--text-muted)] font-normal font-mono mt-0.5">
                              Ease: <strong className="text-[var(--text-secondary)]">{comp.disassembly_ease}</strong>
                            </span>
                          </td>
                          <td className="py-3 text-[var(--text-secondary)]">
                            {comp.estimated_weight_kg.toFixed(2)} kg
                          </td>
                          <td className="py-3 text-[var(--text-secondary)]">
                            ₹{comp.index_price_per_kg.toFixed(0)}/kg
                          </td>
                          <td className="py-3 text-[var(--text-secondary)]">
                            {Math.round(comp.purity_factor * 100)}%
                          </td>
                          <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400 text-right">
                            ₹{grossVal.toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--border-medium)] font-mono text-xs font-bold text-[var(--text-primary)]">
                      <td colSpan={4} className="py-3 uppercase text-[10px] tracking-wider text-[var(--text-muted)]">
                        Gross Material Value (Before Labor)
                      </td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{triageResult.components.reduce((acc, c) => acc + (c.estimated_weight_kg * c.index_price_per_kg * c.purity_factor), 0).toFixed(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Teardown Arbitrage & Consignment QR (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Disassembly Arbitrage Card */}
            {valuationResult && (
              <div className="surface-card p-6 space-y-5 border-t-4 border-t-emerald-500 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight font-heading">
                        Arbitrage Decision Engine
                      </h4>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Real-time Margin Optimization</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase tracking-wider ${
                      valuationResult.recommendation === 'DISASSEMBLE'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {valuationResult.recommendation === 'DISASSEMBLE' ? 'RECOMMENDED: TEARDOWN' : 'RECOMMENDED: SELL BULK'}
                  </span>
                </div>

                {/* Financial Comparison Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] font-semibold block">Sell Bulk As-Is</span>
                    <span className="text-2xl font-bold font-mono text-[var(--text-secondary)] mt-1.5 block">
                      ₹{valuationResult.bulk_sale_value.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Unsegregated raw scrap</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">Net Harvest Value</span>
                    <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5 block">
                      ₹{valuationResult.disassembled_net_value.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1 block font-mono">
                      Net after ₹{valuationResult.disassembly_labor_cost} labor
                    </span>
                  </div>
                </div>

                {/* Net Gain Arbitrage Metric */}
                {valuationResult.arbitrage_net_gain > 0 && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-sm">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">Arbitrage Net Uplift</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">Additional profit generated</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-600 dark:text-emerald-300 text-base block">
                        +₹{valuationResult.arbitrage_net_gain.toFixed(0)}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-500">
                        +{Math.round((valuationResult.arbitrage_net_gain / valuationResult.bulk_sale_value) * 100)}% ROI Gain
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-surface-subtle)] p-3 rounded-lg border border-[var(--border-subtle)]">
                  {valuationResult.recommendation_summary}
                </p>

                {/* Open Disassembly Steps Modal */}
                {valuationResult.disassembly_steps.length > 0 && (
                  <button
                    onClick={() => setShowDisassemblyModal(true)}
                    className="w-full btn-ghost-dark text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                    <span>View Workshop Teardown Guide ({valuationResult.disassembly_steps.length} Steps)</span>
                  </button>
                )}

                {/* Generate Digital Waste Lot & Consignment QR Button */}
                <button
                  onClick={handleCreateLotAndQR}
                  disabled={loading || triageResult.hazard_analysis.is_hazardous}
                  className="w-full btn-emerald text-xs shadow-lg py-3 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="font-bold">
                    {qrResult ? 'Regenerate Consignment Manifest Pass' : 'Create Waste Lot & Generate Consignment QR'}
                  </span>
                </button>
              </div>
            )}

            {/* Generated Handover QR Manifest Card */}
            {qrResult && (
              <div className="surface-card p-6 space-y-4 border-2 border-emerald-500/50 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-heading">
                      Dual-Key Consignment Manifest
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Ready For Recycler
                  </span>
                </div>

                {/* QR Code Presentation */}
                <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-inner border border-slate-200">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Consignment Handover QR" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-800 text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-slate-800 font-bold mt-2.5 tracking-wider">
                    {qrResult.qr_token}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-well)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span>Lot ID:</span>
                    <strong className="text-[var(--text-primary)]">{qrResult.lot_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Intake Custody:</span>
                    <span className="text-[var(--text-secondary)]">COLLECTOR-DL-9942</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Net Valuation:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      ₹{valuationResult?.disassembled_net_value.toFixed(0) || '300'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={copyToken}
                    className="flex-1 btn-ghost-dark text-xs"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Token Copied!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn-ghost-dark text-xs"
                    title="Print Consignment Pass"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Print Pass</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workshop Teardown Guide Modal */}
      {showDisassemblyModal && valuationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="surface-card max-w-xl w-full p-6 space-y-4 border border-[var(--border-medium)] shadow-2xl relative">
            <button
              onClick={() => setShowDisassemblyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-heading">
                  Workshop Teardown SOP
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Standard operating procedure for {valuationResult.item_title}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1">
              {valuationResult.disassembly_steps.map((step) => (
                <div
                  key={step.step_number}
                  className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-start gap-3"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold shrink-0">
                    {step.step_number}
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--text-primary)]">{step.action}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>Target: <strong className="text-[var(--text-secondary)]">{step.target_component}</strong></span>
                      <span>•</span>
                      <span>Tool: <strong className="text-emerald-600 dark:text-emerald-400">{step.tool_required}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDisassemblyModal(false)}
                className="btn-emerald text-xs px-6"
              >
                Close SOP
              </button>
            </div>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
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
