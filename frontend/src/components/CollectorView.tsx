import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  analyzeTriage,
  submitClarification,
  calculateValuation,
  createWasteLot,
  generateHandoverQR,
} from '../services/api';
import type {
  TriageAnalysisResponse,
  ValuationResponse,
  HandoverQRGenerateResponse,
} from '../services/api';

const PRESET_SCRAP_ITEMS = [
  {
    id: 'electric_motor',
    name: 'Induction Motor (1.5 HP)',
    category: 'Small Appliances & Motors',
    tag: 'Arbitrage Opportunity',
    tagColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
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
];

export const CollectorView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('electric_motor');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<TriageAnalysisResponse | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [qrResult, setQrResult] = useState<HandoverQRGenerateResponse | null>(null);
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

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Run Triage
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

      if (res.confidence_tier !== 'LOW' && !res.hazard_analysis.is_hazardous && res.components.length > 0) {
        const totalWeight = res.components.reduce((acc, c) => acc + c.estimated_weight_kg, 0);
        const val = await calculateValuation(res.item_title, totalWeight, res.components);
        setValuationResult(val);
      }
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit clarification
  const handleClarify = async (optionId: string) => {
    if (!triageResult) return;
    setLoading(true);
    try {
      const res = await submitClarification(triageResult.item_title, optionId, triageResult.components);
      setTriageResult(res);

      const totalWeight = res.components.reduce((acc, c) => acc + c.estimated_weight_kg, 0);
      const val = await calculateValuation(res.item_title, totalWeight, res.components);
      setValuationResult(val);
    } catch (err) {
      console.error('Clarify error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Waste Lot & Generate Consignment QR
  const handleCreateLotAndQR = async () => {
    if (!triageResult) return;
    setLoading(true);
    try {
      const totalWeight = triageResult.components.reduce((acc, c) => acc + c.estimated_weight_kg, 0);
      const netVal = valuationResult ? valuationResult.disassembled_net_value : 300.0;

      const lot = await createWasteLot(
        'COLLECTOR-DL-9942',
        triageResult.item_title,
        triageResult.category,
        triageResult.components,
        totalWeight,
        netVal,
        triageResult.hazard_analysis
      );

      const qr = await generateHandoverQR(lot.lot_id, 'COLLECTOR-DL-9942');
      setQrResult(qr);
    } catch (err) {
      console.error('QR error:', err);
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
    <div className="space-y-8 py-6">
      {/* Station Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
            <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md'
                    : 'border-[var(--border-subtle)] hover:border-emerald-500/40 hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold font-mono tracking-wider shadow-sm">
                    <Check className="w-2.5 h-2.5" /> ACTIVE
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-emerald-500 text-white shadow-sm' : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isSelected && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-sm tracking-tight">{item.name}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{item.spec}</span>
                  <ArrowRight className="w-3 h-3 text-emerald-500 opacity-60" />
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
          </div>
        </div>
      )}
    </div>
  );
};
