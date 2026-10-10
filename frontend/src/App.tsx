import { useState, useEffect } from 'react';
import { Header, type NavTab } from './components/Header';
import { CollectorView } from './components/CollectorView';
import { VendorPortalView } from './components/VendorPortalView';
import { RecyclerPortalView } from './components/RecyclerPortalView';
import { TraceabilityView } from './components/TraceabilityView';
import { MunicipalDashboardView } from './components/MunicipalDashboardView';
import { ShieldCheck, Cpu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('kabadiwala');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('scrapsetu_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Executive dark default matching Municipal Fleet
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-4 flex-1">
        {/* Sleek Live Mandi & Compliance Telemetry Banner Strip */}
        <div className="surface-card py-2 px-4 border border-[var(--border-subtle)] flex items-center justify-between gap-4 overflow-hidden text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              CPCB Form-2 Ready
            </span>
            <span className="hidden md:inline-block text-[11px] font-mono text-[var(--text-muted)]">
              Terminal NCR-04 &bull; 28.6139° N, 77.2090° E
            </span>
          </div>

          {/* Smooth Mandi Rates Ticker */}
          <div className="overflow-hidden flex-1 max-w-2xl hidden sm:block">
            <div className="hero-ticker-track flex items-center gap-5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
              <span className="text-[var(--text-secondary)] font-semibold">Cu Grade 1: ₹722/kg (+1.8%)</span>
              <span className="text-emerald-500">&bull;</span>
              <span className="text-[var(--text-secondary)] font-semibold">Al Cast: ₹186/kg (+0.5%)</span>
              <span className="text-emerald-500">&bull;</span>
              <span className="text-[var(--text-secondary)] font-semibold">Honey Brass: ₹462/kg (-0.3%)</span>
              <span className="text-emerald-500">&bull;</span>
              <span className="text-[var(--text-secondary)] font-semibold">PET Flakes: ₹42/kg (+2.1%)</span>
              <span className="text-emerald-500">&bull;</span>
              <span className="text-[var(--text-secondary)] font-semibold">Lead Battery: ₹92/kg (Stable)</span>
              <span className="text-emerald-500">&bull;</span>
              <span>PostGIS Spatial Matrix 3.4</span>
              <span className="text-emerald-500">&bull;</span>
              <span>Dual-Key Escrow Engine Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Bedrock 3.5 Active</span>
          </div>
        </div>

        {/* Active Operational Workspace */}
        <main className="transition-all duration-200">
          {activeTab === 'kabadiwala' && <CollectorView />}
          {activeTab === 'vendor' && <VendorPortalView />}
          {activeTab === 'recycler' && <RecyclerPortalView />}
          {activeTab === 'traceability' && <TraceabilityView />}
          {activeTab === 'municipal' && <MunicipalDashboardView theme={theme} />}
        </main>

        {/* Platform Footer */}
        <footer className="surface-card p-5 space-y-3 text-xs text-[var(--text-muted)] border border-[var(--border-subtle)] mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-[var(--text-primary)] text-sm font-heading">
                ScrapSetu
              </span>
              <span className="opacity-30">&bull;</span>
              <span className="text-[11px]">Circular Resource Recovery, Telemetry &amp; Compliance Infrastructure</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span>Delhi-NCR Hub</span>
              <span className="opacity-30">&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CPCB Schedule-III Compliant</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono">
            <div>
              &copy; 2026 ScrapSetu &bull; Dual-Party Scale Handover &amp; Escrow Verification Engine
            </div>
            <div className="flex items-center gap-3">
              <span>FastAPI :8000</span>
              <span>&bull;</span>
              <span>PostGIS 3.4</span>
              <span>&bull;</span>
              <span>React 19 &amp; TypeScript</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
