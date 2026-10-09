import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Zap,
  BatteryCharging,
  Cable,
  Cog,
  UploadCloud,
  Sparkles,
  FileCode2,
  FolderTree,
  Terminal,
  Play,
  ArrowRight,
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

const PRESET_ITEMS = [
  { id: 'electric_motor', title: 'induction_motor.py', label: 'Induction Motor Assembly', tag: 'Appliances', icon: Zap },
  { id: 'swollen_laptop', title: 'swollen_battery.py', label: 'Swollen Li-Ion Battery', tag: 'Hazard Alert', icon: BatteryCharging },
  { id: 'copper_cable', title: 'copper_cable.py', label: 'Heavy Duty Copper Cable', tag: 'Clarification', icon: Cable },
  { id: 'unknown_rusty_compressor', title: 'rusty_compressor.py', label: 'Rusty Compressor Unit', tag: 'Low Confidence', icon: Cog },
];

export const CollectorView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('electric_motor');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<TriageAnalysisResponse | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [qrResult, setQrResult] = useState<HandoverQRGenerateResponse | null>(null);
  const [showDisassemblyModal, setShowDisassemblyModal] = useState<boolean>(false);

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
    if (presetId) setSelectedPreset(presetId);
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

  // Generate QR
  const handleGenerateQR = async () => {
    if (!triageResult) return;
    setLoading(true);
    try {
      const totalWeight = triageResult.components.reduce((acc, c) => acc + c.estimated_weight_kg, 0);
      const netVal = valuationResult ? valuationResult.disassembled_net_value : 300.0;

      const lot = await createWasteLot(
        'collector_kabadiwala_99',
        triageResult.item_title,
        triageResult.category,
        triageResult.components,
        totalWeight,
        netVal,
        triageResult.hazard_analysis
      );

      const qr = await generateHandoverQR(lot.lot_id, 'collector_kabadiwala_99');
      setQrResult(qr);
    } catch (err) {
      console.error('QR error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Title Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-4 animate-reveal-1">
        <div className="inline-flex items-center gap-2 pill-badge shadow-lg shadow-purple-950/30">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Multimodal AI, Teardown Arbitrage, PostGIS & CVRP Fleet Logistics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white font-sans leading-[1.1]">
          The Best Place To Triage, Valuate, And Discover{' '}
          <strong className="font-bold text-white glow-text-purple">Circular Scrap Code.</strong>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
          An AI-Driven Resource Intelligence Decision Environment For Waste Generators, Informal Collectors (Kabadiwalas), Recyclers, And Municipal Fleet Operators.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => handleAnalyze(selectedPreset)}
            disabled={loading}
            className="pill-btn-purple text-sm font-semibold"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Bedrock Triage</span>
          </button>

          <label className="pill-btn-dark text-sm cursor-pointer">
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Code Profile & IDE Inspector Workspace */}
      <div className="dribbble-glass-card scanline-container p-6 border border-white/10 shadow-2xl space-y-6 animate-reveal-2">
        {/* Container Top Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>SCRAPSETU_IDE // v1.0</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Select scrap file from project root:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAnalyze('electric_motor')}
              className="px-4 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-all shadow-md shadow-purple-950"
            >
              Analyze Motor
            </button>
            <button
              onClick={() => handleAnalyze('swollen_laptop')}
              className="px-4 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-medium transition-all shadow-md shadow-rose-950"
            >
              Analyze Hazard
            </button>
          </div>
        </div>

        {/* IDE Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Project Root Files (4 Cols) */}
          <div className="lg:col-span-4 space-y-4 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-purple-300">
                <FolderTree className="w-3.5 h-3.5 text-purple-400" />
                PROJECT ROOT
              </span>
              <span className="text-[10px] text-slate-500">4 Presets</span>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold">SCRAP_PRESETS/</span>
              {PRESET_ITEMS.map((item) => {
                const isSelected = selectedPreset === item.id && !customImage;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCustomImage(null);
                      handleAnalyze(item.id);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between dribbble-glass-card-hover ${
                      isSelected
                        ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-md shadow-purple-950'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0 font-sans font-semibold">
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {customImage && (
              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-1 animate-pop-in">
                <span className="text-[10px] text-purple-300 font-bold block">custom_upload.png</span>
                <span className="text-[9px] text-slate-400 block truncate">User Custom Image Payload Loaded</span>
              </div>
            )}
          </div>

          {/* Right Main IDE Panel */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="p-12 text-center space-y-3 bg-black/40 rounded-xl border border-white/5 font-mono">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-purple-300 text-xs font-bold">Amazon Bedrock Claude 3.5 Sonnet Inference Processing...</p>
              </div>
            ) : triageResult ? (
              <div className="space-y-6 animate-reveal-3">
                {/* Header Metadata Bar */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-bold">CLAUDE 3.5 VISUAL INFERENCE</span>
                    <h3 className="text-xl font-bold text-white font-sans tracking-tight">{triageResult.item_title}</h3>
                    <p className="text-xs text-slate-400 font-mono">Category: {triageResult.category}</p>
                  </div>

                  {/* Confidence Tier Badge */}
                  <div className="text-right font-mono">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        triageResult.confidence_tier === 'HIGH'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                          : triageResult.confidence_tier === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950'
                      }`}
                    >
                      {triageResult.confidence_tier === 'HIGH' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {triageResult.confidence_tier === 'MEDIUM' && <HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                      {triageResult.confidence_tier === 'LOW' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      {triageResult.confidence_tier} CONFIDENCE ({(triageResult.overall_confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Deterministic Safety Override Alert */}
                {triageResult.hazard_analysis.is_hazardous && (
                  <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-2 animate-pop-in">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
                      <span>DETERMINISTIC SAFETY OVERRIDE TRIGGERED</span>
                    </div>
                    <p className="text-xs text-rose-200 leading-relaxed">{triageResult.hazard_analysis.hazard_description}</p>
                    <div className="p-3 rounded-lg bg-rose-900/50 text-xs font-semibold text-white border border-rose-500/30">
                      {triageResult.hazard_analysis.containment_protocol}
                    </div>
                  </div>
                )}

                {/* Interactive Clarification Prompt */}
                {triageResult.confidence_tier === 'MEDIUM' && triageResult.clarification_prompt && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3 animate-pop-in">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Interactive AI Clarification Prompt</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{triageResult.clarification_prompt.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {triageResult.clarification_prompt.options.map((opt) => (
                        <button
                          key={opt.option_id}
                          onClick={() => handleClarify(opt.option_id)}
                          className="p-3.5 rounded-xl bg-black/60 hover:bg-white/5 border border-amber-500/30 text-left transition-all hover:border-amber-400 dribbble-glass-card-hover"
                        >
                          <p className="text-xs font-bold text-amber-300 mb-0.5">{opt.label}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{opt.impact_description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code-style Material Extraction Table */}
                <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
                    <span className="font-bold text-purple-400 uppercase tracking-wider">CONSTITUENT_COMPONENTS.JSON</span>
                    <span className="text-[10px]">NetValue = ∑(W_i × P_i × Q_i)</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                      <thead className="text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="pb-2">Line</th>
                          <th className="pb-2">Component</th>
                          <th className="pb-2">Weight (W_i)</th>
                          <th className="pb-2">Index Rate (P_i)</th>
                          <th className="pb-2 text-right">Yield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {triageResult.components.map((comp, idx) => {
                          const val = comp.estimated_weight_kg * comp.index_price_per_kg * comp.purity_factor;
                          return (
                            <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-2 text-slate-600 select-none">{idx + 1}.</td>
                              <td className="py-2 text-white font-bold font-sans">{comp.name}</td>
                              <td className="py-2">{comp.estimated_weight_kg} kg</td>
                              <td className="py-2">₹{comp.index_price_per_kg}/kg</td>
                              <td className="py-2 text-right font-bold text-purple-300">₹{val.toFixed(0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Action Grid: Teardown Arbitrage + QR Code Handover */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Teardown Arbitrage Panel */}
                  {valuationResult && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 shadow-lg shadow-purple-950/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs flex items-center gap-2 font-sans">
                          <Wrench className="w-4 h-4 text-purple-400" />
                          <span>Teardown Arbitrage</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/40">
                          {valuationResult.recommendation}
                        </span>
                      </div>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Bulk Sale:</span>
                          <span>₹{valuationResult.bulk_sale_value.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Disassembled Yield:</span>
                          <span>+₹{valuationResult.arbitrage_net_gain.toFixed(0)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDisassemblyModal(true)}
                        className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 flex items-center justify-center gap-1 transition-all"
                      >
                        <span>View Instructions</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    </div>
                  )}

                  {/* QR Handover Panel */}
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 shadow-lg shadow-purple-950/30">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2 font-sans">
                      <QrCode className="w-4 h-4 text-purple-400" />
                      <span>Cryptographic Handover</span>
                    </h4>
                    {qrResult ? (
                      <div className="p-3 rounded-lg bg-white text-center shadow-2xl animate-pop-in">
                        <img src={qrResult.qr_image_base64} alt="QR" className="w-24 h-24 mx-auto" />
                        <span className="text-[9px] font-mono text-slate-900 font-bold block mt-1">LOT: {qrResult.lot_id}</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateQR}
                        disabled={triageResult.hazard_analysis.is_hazardous}
                        className="w-full pill-btn-purple text-xs justify-center py-2.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Generate Signed QR</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Disassembly Modal */}
      {showDisassemblyModal && valuationResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="dribbble-glass-card max-w-lg w-full p-6 space-y-4 border-purple-500/40 shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Teardown Step-by-Step Instructions</span>
              </h3>
              <button
                onClick={() => setShowDisassemblyModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xs uppercase font-bold"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {valuationResult.disassembly_steps.map((step) => (
                <div key={step.step_number} className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-300">Step {step.step_number}: {step.target_component}</span>
                    <span className="text-slate-400 font-mono text-[11px]">Tool: {step.tool_required}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{step.action}</p>
                  {step.safety_warning && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30 flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{step.safety_warning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowDisassemblyModal(false)} className="w-full pill-btn-purple justify-center text-xs">
              <span>Close Teardown Guide</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
