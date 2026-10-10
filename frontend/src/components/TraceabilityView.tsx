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
  Layers,
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

  const settledCount = transactions.filter((t) => t.payment_status === 'PAID').length;
  const totalSettledAmount = transactions
    .filter((t) => t.payment_status === 'PAID')
    .reduce((acc, t) => acc + (t.final_payable_amount || 0), 0);

  return (
    <div className="space-y-8 py-2">
      {/* Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              Module 04 • Audit &amp; Traceability
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">SHA-256 Non-Repudiable Ledger</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            End-to-End Cryptographic Traceability &amp; Audit Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            Unique Transaction IDs, segregated material transfer &amp; payment lifecycles, discrepancy logs, and immutable custody genealogy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost-dark text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Documented Digital Lots</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{lots.length}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Tracked</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">From collector to smelter</span>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-500" />
            <span>Custody Transactions</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{transactions.length}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">TXNs</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Dual-party signed transfers</span>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Settled Payment Volume</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{(totalSettledAmount / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              {settledCount}/{transactions.length} Paid
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Verified UPI disbursements</span>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ledger Integrity</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">SHA-256</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Immutable</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">CPCB Form-2 Audit Proofs</span>
        </div>
      </div>

      {/* Chain-of-Custody Genealogy Graph Section */}
      <div className="surface-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
              Digital Waste Lot Genealogy
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Full Chain-of-Custody Lifecycle: {selectedLotId}
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--text-muted)]">Select Lot:</span>
            <select
              value={selectedLotId}
              onChange={(e) => handleSelectLot(e.target.value)}
              className="p-1.5 input-themed font-bold text-xs"
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {traceGraph.custody_timeline.map((node) => (
                <div key={node.step_number} className="surface-card-subtle p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/30 font-mono">
                      0{node.step_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-mono border border-emerald-500/20 font-semibold">
                      {node.verification_status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                      {node.custodian_role === 'KABADIWALA' && <User className="w-3 h-3 text-emerald-500" />}
                      {node.custodian_role === 'VENDOR' && <Store className="w-3 h-3 text-cyan-500" />}
                      {node.custodian_role === 'RECYCLER' && <Factory className="w-3 h-3 text-amber-500" />}
                      <span>{node.custodian_role}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">{node.custodian_name}</h4>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Action:</span>
                      <strong className="text-[var(--text-primary)]">{node.action}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Scale Weight:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{node.recorded_weight_kg || 'N/A'} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <strong className="text-[var(--text-secondary)] truncate max-w-[140px]">{node.location}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Circular Recovery Outcome Badge */}
            {traceGraph.treatment_outcome && (
              <div className="surface-well p-3.5 rounded-lg border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                      CIRCULAR RECOVERY COMPLETE
                    </span>
                    <p className="text-[var(--text-primary)] font-bold text-xs">
                      {traceGraph.treatment_outcome} (Circularity Yield: {traceGraph.recovery_yield_percentage}%)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] break-all">{traceGraph.epr_audit_hash}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transactions & Payments Ledger Table */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Documented Material Handovers &amp; Payments Ledger</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              All digital waste transactions with verified weights, agreed pricing, and dual-state payment verification.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search TXN ID, item, or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 input-themed text-xs w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2.5 font-medium">Transaction ID</th>
                <th className="py-2.5 font-medium">Item / Category</th>
                <th className="py-2.5 font-medium">Parties (From &rarr; To)</th>
                <th className="py-2.5 font-medium">Scale Weight</th>
                <th className="py-2.5 font-medium">Amount</th>
                <th className="py-2.5 font-medium">Transfer Status</th>
                <th className="py-2.5 font-medium">Payment Status</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredTransactions.map((t) => (
                <tr key={t.transaction_id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="py-3 text-emerald-600 dark:text-emerald-400 font-bold">{t.transaction_id}</td>
                  <td className="py-3">
                    <span className="text-[var(--text-primary)] font-bold font-sans block">{t.item_title}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{t.material_category}</span>
                  </td>
                  <td className="py-3 font-sans">
                    <div className="text-[var(--text-primary)] text-xs truncate max-w-[160px]">{t.sender_name}</div>
                    <div className="text-[var(--text-muted)] text-[10px] truncate max-w-[160px]">&rarr; {t.receiver_name}</div>
                  </td>
                  <td className="py-3">
                    <strong className="text-[var(--text-primary)]">{t.effective_weight_kg || t.sender_measured_weight_kg || 'N/A'} kg</strong>
                    {t.discrepancy.has_discrepancy && (
                      <span className="text-[10px] text-amber-500 block font-sans">Discrepancy Logged</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{t.final_payable_amount}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">@ ₹{t.agreed_unit_price}/kg</span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        t.transfer_status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          : t.transfer_status === 'DISPUTED'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.transfer_status}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        t.payment_status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          : t.payment_status === 'DISPUTED'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
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
                        className="btn-emerald text-[11px] py-1 px-2.5"
                      >
                        Settle Payment
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Settled (UPI)</span>
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
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="surface-card p-6 border border-[var(--border-medium)] max-w-md w-full space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Settle Payment for {settleTxnId}</span>
              </h3>
              <button
                onClick={() => setSettleTxnId(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold cursor-pointer"
              >
                [ESC]
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Payable Amount (₹):</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 input-themed font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[var(--text-secondary)] block mb-1">UPI / Bank Reference Number:</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2 input-themed"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSettleTxnId(null)}
                className="w-1/2 btn-ghost-dark text-xs py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettlePayment(settleTxnId)}
                disabled={loading}
                className="w-1/2 btn-emerald text-xs py-2"
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
