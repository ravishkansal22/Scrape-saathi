import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  User,
  Store,
  Factory,
  DollarSign,
  FileText,
  RefreshCw,
} from 'lucide-react';

import {
  fetchAllTransactions,
  fetchAllLots,
  fetchLotTraceability,
  updateTransactionPayment,
} from '../services/api';
import type {
  Transaction,
  DigitalWasteLot,
  FullTraceabilityGraph,
} from '../services/api';

export const TraceabilityView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lots, setLots] = useState<DigitalWasteLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('LOT-7A9B1C2D');
  const [traceGraph, setTraceGraph] = useState<FullTraceabilityGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Payment Settlement Form
  const [settleTxnId, setSettleTxnId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payRef, setPayRef] = useState<string>('UPI/20261010/987123456');

  const loadData = async () => {
    setLoading(true);
    try {
      const [txns, lotList] = await Promise.all([
        fetchAllTransactions(),
        fetchAllLots(),
      ]);
      setTransactions(txns);
      setLots(lotList);
      if (lotList.length > 0) {
        const initialLot = selectedLotId || lotList[0].lot_id;
        setSelectedLotId(initialLot);
        const graph = await fetchLotTraceability(initialLot);
        setTraceGraph(graph);
      }
    } catch (err) {
      console.error('Failed to load traceability data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectLot = async (lotId: string) => {
    setSelectedLotId(lotId);
    setLoading(true);
    try {
      const graph = await fetchLotTraceability(lotId);
      setTraceGraph(graph);
    } catch (err) {
      console.error('Error fetching graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = async (txnId: string) => {
    setLoading(true);
    try {
      await updateTransactionPayment(txnId, {
        updated_by_user_id: 'vendor_apex_metals_01',
        payment_status: 'PAID',
        amount_paid: payAmount,
        payment_method: 'UPI',
        payment_reference: payRef,
        notes: 'Settled via UPI transfer with digital receipt verification.',
      });
      setSettleTxnId(null);
      await loadData();
    } catch (err: any) {
      alert(`Payment update error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-6 rounded-2xl border-l-4 border-cyan-500 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">Module 04</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Digital Handover & Payment Audit Ledger</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">End-to-End Chain-of-Custody & Traceability Ledger</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Unique Transaction IDs (`TXN-...`), separated material transfer & payment lifecycles, discrepancy logs, and immutable custody genealogy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chain-of-Custody Genealogy Graph Section */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">DIGITAL WASTE LOT GENEALOGY</span>
            <h3 className="text-lg font-bold text-white">Full Chain-of-Custody Lifecycle: {selectedLotId}</h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Select Lot:</span>
            <select
              value={selectedLotId}
              onChange={(e) => handleSelectLot(e.target.value)}
              className="p-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
            >
              {lots.map((l) => (
                <option key={l.lot_id} value={l.lot_id}>
                  {l.lot_id} — {l.item_title} ({l.measured_weight_kg || 'N/A'} kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Timeline Stepper */}
        {traceGraph && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {traceGraph.custody_timeline.map((node) => (
                <div key={node.step_number} className="relative p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/40 font-mono">
                      0{node.step_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/30">
                      {node.verification_status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      {node.custodian_role === 'KABADIWALA' && <User className="w-3.5 h-3.5 text-teal-400" />}
                      {node.custodian_role === 'VENDOR' && <Store className="w-3.5 h-3.5 text-purple-400" />}
                      {node.custodian_role === 'RECYCLER' && <Factory className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{node.custodian_role}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{node.custodian_name}</h4>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 border-t border-white/5 pt-2 font-mono">
                    <div className="flex justify-between">
                      <span>Action:</span>
                      <strong className="text-slate-200">{node.action}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Scale Weight:</span>
                      <strong className="text-cyan-300">{node.recorded_weight_kg || 'N/A'} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <strong className="text-slate-300 truncate max-w-[150px]">{node.location}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Circular Recovery Outcome Badge */}
            {traceGraph.treatment_outcome && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">CIRCULAR RECOVERY COMPLETE</span>
                    <p className="text-white font-bold">{traceGraph.treatment_outcome} (Circularity Yield: {traceGraph.recovery_yield_percentage}%)</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 break-all">{traceGraph.epr_audit_hash}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transactions & Payments Ledger Table */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Documented Material Handovers & Payments Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">All digital waste transactions with verified weights, agreed pricing, and payment statuses.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by TXN ID, item, or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-white/10">
              <tr>
                <th className="pb-3">Transaction ID</th>
                <th className="pb-3">Item / Category</th>
                <th className="pb-3">Parties (From &rarr; To)</th>
                <th className="pb-3">Scale Weight</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Transfer Status</th>
                <th className="pb-3">Payment Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((t) => (
                <tr key={t.transaction_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 text-cyan-400 font-bold">{t.transaction_id}</td>
                  <td className="py-3">
                    <span className="text-white font-bold font-sans block">{t.item_title}</span>
                    <span className="text-[10px] text-slate-400">{t.material_category}</span>
                  </td>
                  <td className="py-3 font-sans">
                    <div className="text-slate-300 text-[11px] truncate max-w-[180px]">{t.sender_name}</div>
                    <div className="text-slate-500 text-[10px] truncate max-w-[180px]">&rarr; {t.receiver_name}</div>
                  </td>
                  <td className="py-3">
                    <strong className="text-white">{t.effective_weight_kg || t.sender_measured_weight_kg || 'N/A'} kg</strong>
                    {t.discrepancy.has_discrepancy && (
                      <span className="text-[10px] text-amber-400 block font-sans">Discrepancy Logged</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-emerald-400 font-bold">₹{t.final_payable_amount}</span>
                    <span className="text-[10px] text-slate-500 block">@ ₹{t.agreed_unit_price}/kg</span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.transfer_status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : t.transfer_status === 'DISPUTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {t.transfer_status}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.payment_status === 'PAID'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : t.payment_status === 'DISPUTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {t.payment_status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {t.payment_status !== 'PAID' ? (
                      <button
                        onClick={() => {
                          setSettleTxnId(t.transaction_id);
                          setPayAmount(t.final_payable_amount);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white text-[11px] font-semibold transition-all"
                      >
                        Settle Payment
                      </button>
                    ) : (
                      <span className="text-[10px] text-teal-400">Settled (UPI)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Payment Modal */}
      {settleTxnId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 max-w-md w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-400" />
                <span>Settle Payment for {settleTxnId}</span>
              </h3>
              <button onClick={() => setSettleTxnId(null)} className="text-slate-400 hover:text-white font-bold">
                [X]
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Payable Amount (₹):</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-teal-500/40 text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">UPI / Bank Transaction Reference Number:</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSettleTxnId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettlePayment(settleTxnId)}
                disabled={loading}
                className="w-1/2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-lg shadow-teal-950"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
