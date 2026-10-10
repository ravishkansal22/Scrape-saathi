import React from 'react';
import {
  Layers,
  Building2,
  Truck,
  Radio,
  Sun,
  Moon,
  TrendingUp,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'collector' | 'recycler' | 'municipal';
  setActiveTab: (tab: 'collector' | 'recycler' | 'municipal') => void;
  apiConnected: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiConnected,
  theme,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-2xl transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-blue-400/30">
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4 4 4 0 0 0 4 4h2a4 4 0 0 0 0-8h-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4 4 4 0 0 0-4-4H4a4 4 0 0 0 0 8h2" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black tracking-tight text-[var(--text-primary)] font-heading">
              ScrapSetu
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
              v1.2
            </span>
          </div>
        </div>

        {/* Floating Pill Navigation Switcher */}
        <nav className="flex items-center gap-1 bg-[var(--tab-nav-bg)] p-1 rounded-full border border-[var(--border-subtle)] transition-colors shadow-inner">
          <button
            onClick={() => setActiveTab('collector')}
            className={`pill-btn text-xs cursor-pointer transition-all ${
              activeTab === 'collector'
                ? 'pill-btn-brand shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Yard Triage</span>
          </button>

          <button
            onClick={() => setActiveTab('recycler')}
            className={`pill-btn text-xs cursor-pointer transition-all ${
              activeTab === 'recycler'
                ? 'pill-btn-brand shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Recycler Exchange</span>
          </button>

          <button
            onClick={() => setActiveTab('municipal')}
            className={`pill-btn text-xs cursor-pointer transition-all ${
              activeTab === 'municipal'
                ? 'pill-btn-brand shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fleet & Bins</span>
          </button>
        </nav>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Spot Mandi Price Quick Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[var(--text-muted)]">Cu Spot:</span>
            <span className="font-bold text-[var(--text-primary)]">₹722/kg</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-0.5 text-[10px]">
              <TrendingUp className="w-2.5 h-2.5" />+1.8%
            </span>
          </div>

          {/* Backend Status Dot */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono">
            <Radio className={`w-3 h-3 ${apiConnected ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[var(--text-secondary)]">
              {apiConnected ? 'FastAPI :8000' : 'Offline'}
            </span>
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
