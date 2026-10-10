import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CollectorView } from './components/CollectorView';
import { VendorPortalView } from './components/VendorPortalView';
import { RecyclerPortalView } from './components/RecyclerPortalView';
<<<<<<< HEAD
import { TraceabilityView } from './components/TraceabilityView';
=======
import { MunicipalDashboardView } from './components/MunicipalDashboardView';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Building2,
  Truck,
} from 'lucide-react';
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0

export function App() {
  const [activeTab, setActiveTab] = useState<'kabadiwala' | 'vendor' | 'recycler' | 'traceability'>('vendor');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('scrapsetu_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Deep obsidian navy default
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('scrapsetu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Ping FastAPI backend health endpoint
  useEffect(() => {
    const checkHealth = () => {
      fetch('http://localhost:8000/health')
        .then((res) => {
          if (res.ok) setApiConnected(true);
          else setApiConnected(false);
        })
        .catch(() => setApiConnected(false));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
<<<<<<< HEAD
    <div className="relative min-h-screen bg-[#080914] text-slate-100 pb-16 overflow-hidden">
      {/* Ambient Glow */}
      <div className="ambient-glow-sphere" />

      {/* Header Navigation Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} apiConnected={apiConnected} />

      {/* Main Portals Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
        {activeTab === 'kabadiwala' && <CollectorView />}
        {activeTab === 'vendor' && <VendorPortalView />}
        {activeTab === 'recycler' && <RecyclerPortalView />}
        {activeTab === 'traceability' && <TraceabilityView />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 text-center text-xs text-slate-500 py-6 border-t border-white/10 font-mono">
        <p className="text-slate-400">ScrapSetu — AI-Powered Waste Segregation, Fair Transactions & End-to-End Traceability</p>
        <p className="mt-1 text-[10px] text-slate-600">
          7-Category AI Triage • Physical Scale Measurements • Vendor Warehouse Inventory • Recycler EPR Certificates • PostGIS
        </p>
      </footer>
=======
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Sleek Top Command Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiConnected={apiConnected}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 flex-1">
        
        {/* ============================================================ */}
        {/* SLEEK RECAP EXECUTIVE PLATFORM HEADER STRIP */}
        {/* ============================================================ */}
        <section className="surface-card p-5 sm:p-6 border border-[var(--border-subtle)] relative overflow-hidden shadow-lg">
          {/* Ambient Glow Aura */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title & Station Context */}
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  CIRCULAR PLATFORM
                </span>
                <span className="opacity-30">•</span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Terminal NCR-04
                </span>
                <span className="opacity-30">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  CPCB Schedule-III Compliant
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {activeTab === 'collector' && <Layers className="w-5 h-5" />}
                  {activeTab === 'recycler' && <Building2 className="w-5 h-5" />}
                  {activeTab === 'municipal' && <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] font-heading">
                    {activeTab === 'collector' && 'Scrap Intake Triage & Disassembly Arbitrage'}
                    {activeTab === 'recycler' && 'Authorized Recycler Custody & Dual-Key Escrow'}
                    {activeTab === 'municipal' && 'Municipal Fleet Telemetry & Smart Bin Dispatch'}
                  </h1>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {activeTab === 'collector' && 'Real-time AI material assay, purity estimation, and teardown financial optimization.'}
                    {activeTab === 'recycler' && 'Cryptographic QR token validation, spot price lock escrow, and digital EPR credit manifests.'}
                    {activeTab === 'municipal' && 'PostGIS geofence route tracking, 80% ultrasonic bin fill alerts, and CVRP solver.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Compact Telemetry KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  AI Precision
                </span>
                <div className="text-lg font-black text-[var(--text-primary)] num-tabular leading-tight">
                  98.4%
                </div>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono block">
                  Bedrock Vision
                </span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Scrap Triaged
                </span>
                <div className="text-lg font-black text-[var(--text-primary)] num-tabular leading-tight">
                  1,420<span className="text-blue-500 text-sm font-bold">+kg</span>
                </div>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono block">
                  Cu & Al Alloys
                </span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Arbitrage Margin
                </span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 num-tabular leading-tight">
                  +187%
                </div>
                <span className="text-[9px] text-[var(--text-muted)] font-mono block">
                  ₹1.84L Realized
                </span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Geofence Check
                </span>
                <div className="text-lg font-black text-[var(--text-primary)] num-tabular leading-tight">
                  &lt;15<span className="text-blue-500 text-sm font-bold">ms</span>
                </div>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono block">
                  PostGIS Telemetry
                </span>
              </div>
            </div>
          </div>

          {/* Glowing Mandi Ticker Line */}
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] overflow-hidden">
            <div className="hero-ticker-track flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap">
              <span className="text-[var(--text-secondary)] font-semibold">Cu Grade 1: ₹722/kg (+1.8%)</span>
              <span className="text-blue-500">•</span>
              <span className="text-[var(--text-secondary)] font-semibold">Al Cast: ₹186/kg (+0.5%)</span>
              <span className="text-blue-500">•</span>
              <span className="text-[var(--text-secondary)] font-semibold">Honey Brass: ₹462/kg (-0.3%)</span>
              <span className="text-blue-500">•</span>
              <span>PostGIS Geofence Active</span>
              <span className="text-blue-500">•</span>
              <span>Dual-Key Escrow Engine Verified</span>
              <span className="text-blue-500">•</span>
              <span>AWS Bedrock Claude 3.5 Sonnet</span>
              <span className="text-blue-500">•</span>
              <span className="text-[var(--text-secondary)] font-semibold">Cu Grade 1: ₹722/kg (+1.8%)</span>
              <span className="text-blue-500">•</span>
              <span className="text-[var(--text-secondary)] font-semibold">Al Cast: ₹186/kg (+0.5%)</span>
              <span className="text-blue-500">•</span>
              <span className="text-[var(--text-secondary)] font-semibold">Honey Brass: ₹462/kg (-0.3%)</span>
              <span className="text-blue-500">•</span>
              <span>PostGIS Geofence Active</span>
              <span className="text-blue-500">•</span>
              <span>Dual-Key Escrow Engine Verified</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* ACTIVE OPERATIONAL TOOL WORKSPACE */}
        {/* ============================================================ */}
        <main className="transition-all duration-300">
          {activeTab === 'collector' && <CollectorView />}
          {activeTab === 'recycler' && <RecyclerPortalView />}
          {activeTab === 'municipal' && <MunicipalDashboardView theme={theme} />}
        </main>

        {/* ============================================================ */}
        {/* PLATFORM FOOTER */}
        {/* ============================================================ */}
        <footer className="surface-card p-6 space-y-4 text-xs text-[var(--text-muted)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--text-primary)] text-sm font-heading">
                ScrapSetu
              </span>
              <span className="opacity-30">•</span>
              <span>Circular Resource Recovery & Compliance Infrastructure</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span>Delhi-NCR: 28.6139° N, 77.2090° E</span>
              <span className="opacity-30">•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">AWS Bedrock Active</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
            <div>
              © 2026 ScrapSetu • CPCB Schedule-III & Dual-Key Escrow Engine
            </div>
            <div className="flex items-center gap-4">
              <span>FastAPI :8000</span>
              <span>•</span>
              <span>PostGIS 3.4</span>
              <span>•</span>
              <span>React 19 & TypeScript</span>
            </div>
          </div>
        </footer>

      </div>
>>>>>>> 17fbadff231dc4d71e97534b1a6fcfafaaaa2be0
    </div>
  );
}

export default App;
