import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Scan, Award, Download, Building2, Phone, Star } from 'lucide-react';
import { fetchRecyclers, verifyHandover } from '../services/api';
import type { RecyclerPermit, EPRReceiptResponse } from '../services/api';
import confetti from 'canvas-confetti';

export const RecyclerPortalView: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerPermit[]>([]);
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerPermit | null>(null);
  const [qrTokenInput, setQrTokenInput] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [eprReceipt, setEprReceipt] = useState<EPRReceiptResponse | null>(null);

  useEffect(() => {
    fetchRecyclers()
      .then((data) => {
        setRecyclers(data);
        if (data.length > 0) setSelectedRecycler(data[0]);
      })
      .catch((err) => console.error('Fetch recyclers error:', err));
  }, []);

  const handleScanVerify = async () => {
    if (!selectedRecycler) return;
    setVerifying(true);
    setEprReceipt(null);

    const tokenToUse = qrTokenInput.trim();

    try {
      const res = await verifyHandover(tokenToUse, selectedRecycler.recycler_id);
      setEprReceipt(res);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(`Handover verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass-panel p-6 border-l-4 border-teal-500 bg-gradient-to-r from-teal-950/30 via-slate-900 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">Module 3.3</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Authorized Recycler Workbench</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">PostGIS Recycler Permit Matching & Dual-Key Verification</h2>
            <p className="text-sm text-slate-300 mt-1">
              Cryptographic QR verification, regulatory permit category spatial matching, and immutable EPR audit receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>PostGIS ST_DWithin Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Recycler Facilities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nearby Certified Recyclers</h3>
            <span className="text-[11px] font-mono text-slate-400">PostGIS Matrix</span>
          </div>

          <div className="space-y-3">
            {recyclers.map((rec) => (
              <div
                key={rec.recycler_id}
                onClick={() => setSelectedRecycler(rec)}
                className={`p-4 rounded-xl glass-panel cursor-pointer transition-all glass-panel-hover ${
                  selectedRecycler?.recycler_id === rec.recycler_id
                    ? 'border-emerald-500 bg-emerald-950/30 glow-box-emerald'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h4 className="font-bold text-white text-sm">{rec.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{rec.rating}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 pl-6">{rec.permit_category}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2.5 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono">{rec.distance_km} km away</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{rec.contact_phone}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Dual-Key Scanner & EPR Audit Certificate */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dual Key Handover Scanner */}
          <div className="glass-panel p-6 space-y-4 border-l-4 border-emerald-500">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-400" />
              <span>Verify Dual-Key Cryptographic Handover</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Paste or scan the collector's time-sensitive signed QR token payload to verify the HMAC signature, update waste lot status to <span className="text-emerald-400 font-bold">RECEIVED</span>, and generate an immutable EPR record.
            </p>

            <div className="space-y-3">
              <textarea
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                placeholder="Paste base64 signed QR token payload from Collector view..."
                className="w-full h-24 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                onClick={handleScanVerify}
                disabled={verifying}
                className="w-full btn-emerald justify-center text-xs shadow-lg shadow-emerald-950"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifying ? 'Verifying HMAC Signature...' : 'Verify Cryptographic Handover'}</span>
              </button>
            </div>
          </div>

          {/* EPR Compliance Audit Certificate Receipt */}
          {eprReceipt && (
            <div className="glass-panel p-6 space-y-5 border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-slate-900 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Extended Producer Responsibility (EPR) Certificate</h3>
                    <p className="text-xs text-slate-400 font-mono">Digital Audit Receipt #{eprReceipt.receipt_id}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono uppercase tracking-wider">
                  VERIFIED VALID
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Waste Lot UUID:</span>
                  <span className="font-mono font-bold text-white">{eprReceipt.lot_id}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Verified Weight:</span>
                  <span className="font-mono font-bold text-emerald-400">{eprReceipt.total_weight_kg} kg</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Waste Category:</span>
                  <span className="font-bold text-white">{eprReceipt.category}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Recycler Facility:</span>
                  <span className="font-bold text-white truncate block">{eprReceipt.recycler_name}</span>
                </div>
              </div>

              {/* Cryptographic Signature Record */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">HMAC-SHA256 Audit Signature</span>
                <p className="text-xs font-mono text-emerald-400 break-all">{eprReceipt.digital_signature}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => alert(`Downloading EPR Certificate PDF for Lot ${eprReceipt.lot_id}...`)}
                  className="btn-emerald text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Verified EPR Audit PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
