import React from 'react';
import { Layers, Activity, User, Store, Factory, History, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'kabadiwala' | 'vendor' | 'recycler' | 'traceability';
  setActiveTab: (tab: 'kabadiwala' | 'vendor' | 'recycler' | 'traceability') => void;
  apiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, apiConnected }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#080914]/90 backdrop-blur-2xl border-b border-white/10 px-4 lg:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-950/60">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
              ScrapSetu
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
              v2.0 • Traceability & Fair Pricing
            </span>
          </div>
        </div>

        {/* Centered Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={() => setActiveTab('kabadiwala')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'kabadiwala'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950 border border-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>01. Kabadiwala Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('vendor')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
              activeTab === 'vendor'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 border border-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>02. Vendor Portal</span>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping absolute -top-0.5 -right-0.5" />
          </button>

          <button
            onClick={() => setActiveTab('recycler')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'recycler'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 border border-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>03. Recycler Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('traceability')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'traceability'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950 border border-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>04. Traceability Ledger</span>
          </button>
        </nav>

        {/* Right API Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 font-mono">
            <Activity className={`w-3.5 h-3.5 ${apiConnected ? 'text-teal-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-slate-400">Ledger:</span>
            <span className={apiConnected ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
              {apiConnected ? 'ONLINE :8000' : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('kabadiwala')}
            className="pill-btn-purple text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Triage</span>
          </button>
        </div>
      </div>
    </header>
  );
};
