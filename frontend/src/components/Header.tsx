import React from 'react';
import {
  Layers,
  Building2,
  Truck,
  Radio,
  MapPin,
  Clock,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'collector' | 'recycler' | 'municipal';
  setActiveTab: (tab: 'collector' | 'recycler' | 'municipal') => void;
  apiConnected: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const COMMODITY_PRICES = [
  { symbol: 'Cu Grade 1', price: '₹722/kg', change: '+1.8%', up: true },
  { symbol: 'Al Cast', price: '₹186/kg', change: '+0.5%', up: true },
  { symbol: 'Honey Brass', price: '₹462/kg', change: '-0.3%', up: false },
  { symbol: 'CRCA Steel', price: '₹42.5/kg', change: '0.0%', up: true },
  { symbol: 'Pb Battery', price: '₹98.0/kg', change: '+2.4%', up: true },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiConnected,
  theme,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-xl transition-colors duration-200 shadow-sm">
      {/* Live Scrap Commodity Indices Ticker Bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--ticker-bg)] px-4 lg:px-8 py-1.5 text-[11px] text-[var(--text-muted)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)] text-[10px]">
              Mandi Spot Index
            </span>
            <span className="opacity-30">|</span>
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-emerald-500" /> Delhi-NCR Live Feeds
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 font-mono text-[11px]">
            {COMMODITY_PRICES.map((item) => (
              <div
                key={item.symbol}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]"
              >
                <span className="text-[var(--text-secondary)] font-medium text-[10px]">{item.symbol}:</span>
                <span className="text-[var(--text-primary)] font-bold text-[11px]">{item.price}</span>
                <span
                  className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                    item.up
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {item.change}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-2 shrink-0 text-[10px] text-[var(--text-muted)]">
            <MapPin className="w-3 h-3 text-emerald-500" />
            <span>Region: <strong className="text-[var(--text-secondary)]">National Capital Region (NCR)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
            {/* Custom geometric circular loop glyph */}
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4 4 4 0 0 0 4 4h2a4 4 0 0 0 0-8h-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4 4 4 0 0 0-4-4H4a4 4 0 0 0 0 8h2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">
                ScrapSetu
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                AWS Hackathon v1.2
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Circular Resource Recovery & Dual-Key Custody Platform
            </p>
          </div>
        </div>

        {/* Purposeful Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[var(--tab-nav-bg)] p-1 rounded-xl border border-[var(--border-subtle)] transition-colors shadow-inner">
          <button
            onClick={() => setActiveTab('collector')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'collector'
                ? 'bg-[var(--tab-nav-active)] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold border border-emerald-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Yard Triage</span>
          </button>

          <button
            onClick={() => setActiveTab('recycler')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'recycler'
                ? 'bg-[var(--tab-nav-active)] text-cyan-600 dark:text-cyan-400 shadow-sm font-bold border border-cyan-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Recycler Exchange</span>
          </button>

          <button
            onClick={() => setActiveTab('municipal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeTab === 'municipal'
                ? 'bg-[var(--tab-nav-active)] text-amber-600 dark:text-amber-400 shadow-sm font-bold border border-amber-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Fleet & Bins</span>
          </button>
        </nav>

        {/* Right Status & Theme Toggle Controls */}
        <div className="flex items-center gap-2.5">
          {/* Backend / Cloud AI Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-xs">
            <Radio className={`w-3.5 h-3.5 ${apiConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              {apiConnected ? (
                <>
                  FastAPI: <strong className="text-emerald-500">:8000</strong>
                </>
              ) : (
                <span className="text-[var(--text-muted)]">Offline Mock</span>
              )}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] text-xs text-[var(--text-primary)] hover:border-emerald-500/50 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline text-[11px] font-semibold">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
