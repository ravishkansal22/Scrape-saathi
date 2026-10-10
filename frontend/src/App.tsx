import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CollectorView } from './components/CollectorView';
import { VendorPortalView } from './components/VendorPortalView';
import { RecyclerPortalView } from './components/RecyclerPortalView';
import { TraceabilityView } from './components/TraceabilityView';

export function App() {
  const [activeTab, setActiveTab] = useState<'kabadiwala' | 'vendor' | 'recycler' | 'traceability'>('vendor');
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  useEffect(() => {
    // Ping FastAPI backend health endpoint
    fetch('http://localhost:8000/health')
      .then((res) => {
        if (res.ok) setApiConnected(true);
      })
      .catch(() => setApiConnected(false));
  }, []);

  return (
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
    </div>
  );
}

export default App;
