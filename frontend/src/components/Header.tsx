import React from 'react';
import { Code2, Activity, Cpu, ShieldCheck, Truck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'collector' | 'recycler' | 'municipal';
  setActiveTab: (tab: 'collector' | 'recycler' | 'municipal') => void;
  apiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, apiConnected }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#080914]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo: { } SCRAPSETU */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
              {'{'} SCRAPSETU {'}'}
            </h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              AWS Bedrock • IoT Core
            </span>
          </div>
        </div>

        {/* Centered Pill Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1.5 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={() => setActiveTab('collector')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'collector'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 border border-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>01. Collector PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('recycler')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'recycler'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 border border-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>02. Recycler Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('municipal')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'municipal'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 border border-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>03. Municipal Fleet</span>
          </button>
        </nav>

        {/* Right API Status Pill & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 font-mono">
            <Activity className={`w-3.5 h-3.5 ${apiConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400">API:</span>
            <span className={apiConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {apiConnected ? 'ONLINE :8000' : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('collector')}
            className="pill-btn-purple text-xs"
          >
            <span>Scan Scrap</span>
          </button>
        </div>
      </div>
    </header>
  );
};
