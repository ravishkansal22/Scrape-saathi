import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
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
import confetti from 'canvas-confetti';

export const RecyclerPortalView: React.FC = () => {
  const [recyclers, setRecyclers] = useState<RecyclerPermit[]>([]);
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerPermit | null>(null);
  const [qrTokenInput, setQrTokenInput] = useState<string>('SCRAP-LOT-849102-M8K2P');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [eprReceipt, setEprReceipt] = useState<EPRReceiptResponse | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

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
    } catch (err: any) {
      alert(`Handover verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Certified Recycler Facility Directory (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Accredited Recycling Facilities
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{filteredRecyclers.length} Registered</span>
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
            {filteredRecyclers.map((rec) => {
              const isSelected = selectedRecycler?.recycler_id === rec.recycler_id;
              return (
                <div
                  key={rec.recycler_id}
                  onClick={() => setSelectedRecycler(rec)}
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
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
            </div>
          </div>

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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
