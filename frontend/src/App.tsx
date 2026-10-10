import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CollectorView } from './components/CollectorView';
import { RecyclerPortalView } from './components/RecyclerPortalView';
import { MunicipalDashboardView } from './components/MunicipalDashboardView';

export function App() {
  const [activeTab, setActiveTab] = useState<'collector' | 'recycler' | 'municipal'>('collector');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('scrapsetu_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
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
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiConnected={apiConnected}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pb-16">
        {activeTab === 'collector' && <CollectorView />}
        {activeTab === 'recycler' && <RecyclerPortalView />}
        {activeTab === 'municipal' && <MunicipalDashboardView theme={theme} />}
      </main>

      {/* Platform Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--footer-bg)] py-8 text-xs text-[var(--text-muted)] font-mono transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-primary)]">ScrapSetu</span>
            <span className="opacity-30">|</span>
            <span>Circular Resource Recovery & Compliance Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <span>CPCB Schedule-III Compliant</span>
            <span>•</span>
            <span>PostGIS Geofence Active</span>
            <span>•</span>
            <span>Dual-Key Custody Escrow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
