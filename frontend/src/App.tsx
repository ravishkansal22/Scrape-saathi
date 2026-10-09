import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CollectorView } from './components/CollectorView';
import { RecyclerPortalView } from './components/RecyclerPortalView';
import { MunicipalDashboardView } from './components/MunicipalDashboardView';

export function App() {
  const [activeTab, setActiveTab] = useState<'collector' | 'recycler' | 'municipal'>('collector');
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
      {/* Ambient Floating Glow Sphere */}
      <div className="ambient-glow-sphere" />

      {/* Header Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} apiConnected={apiConnected} />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
        {activeTab === 'collector' && <CollectorView />}
        {activeTab === 'recycler' && <RecyclerPortalView />}
        {activeTab === 'municipal' && <MunicipalDashboardView />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 text-center text-xs text-slate-500 py-6 border-t border-white/10 font-mono">
        <p className="text-slate-400">ScrapSetu — AI-Driven Circular Economy & Resource Intelligence Platform</p>
        <p className="mt-1 text-[10px] text-slate-500">Amazon Bedrock Claude 3.5 Sonnet • Mangum / FastAPI • PostGIS • AWS IoT Core MQTT • CVRP Solver</p>
      </footer>
    </div>
  );
}

export default App;
