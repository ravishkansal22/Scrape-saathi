import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, AlertOctagon, Navigation, BatteryCharging, Weight } from 'lucide-react';
import { fetchSmartBins, simulateTelemetryTick, solveCVRPRoute } from '../services/api';
import type { SmartBin, CVRPRouteResponse } from '../services/api';
import { InteractiveMap } from './InteractiveMap';

export const MunicipalDashboardView: React.FC = () => {
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [cvrpRoute, setCvrpRoute] = useState<CVRPRouteResponse | null>(null);

  const loadBins = async () => {
    try {
      const data = await fetchSmartBins();
      setBins(data);
    } catch (err) {
      console.error('Fetch bins error:', err);
    }
  };

  useEffect(() => {
    loadBins();
  }, []);

  const handleSimulateTick = async () => {
    setLoading(true);
    try {
      const updated = await simulateTelemetryTick();
      setBins(updated);
    } catch (err) {
      console.error('Simulate tick error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSolveCVRP = async () => {
    setLoading(true);
    try {
      const route = await solveCVRPRoute(350.0);
      setCvrpRoute(route);
    } catch (err) {
      console.error('CVRP solver error:', err);
    } finally {
      setLoading(false);
    }
  };

  const breachedCount = bins.filter((b) => b.is_threshold_breached).length;

  const mapMarkers = bins.map((b) => ({
    id: b.bin_id,
    lat: b.latitude,
    lng: b.longitude,
    title: b.name,
    subtitle: `Fill: ${b.current_fill_percentage}% | Weight: ${b.current_weight_kg}kg`,
    isBreached: b.is_threshold_breached,
  }));

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass-card p-6 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Municipal Smart-Bin Fleet & CVRP Logistics</h2>
            <p className="text-sm text-slate-300">
              AWS IoT Core MQTT telemetry simulator, 80% bin threshold breach events, and Capacitated Vehicle Routing Problem (CVRP) optimizer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSimulateTick} disabled={loading} className="btn-secondary text-xs">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Simulate MQTT Telemetry Tick</span>
            </button>

            <button onClick={handleSolveCVRP} disabled={loading} className="btn-primary text-xs shadow-lg shadow-emerald-900">
              <Navigation className="w-4 h-4" />
              <span>Solve CVRP Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <span className="text-xs text-slate-400">Total Aggregation Bins</span>
          <p className="text-2xl font-bold text-white font-mono">{bins.length}</p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-red-500">
          <span className="text-xs text-slate-400">Threshold Breached (&ge;80%)</span>
          <p className="text-2xl font-bold text-red-400 font-mono">{breachedCount}</p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-emerald-500">
          <span className="text-xs text-slate-400">Optimized Vehicle Load</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {cvrpRoute ? `${cvrpRoute.total_weight_collected_kg} kg` : '0 kg'}
          </p>
        </div>

        <div className="glass-card p-4 space-y-1 border-l-4 border-teal-500">
          <span className="text-xs text-slate-400">Route Distance</span>
          <p className="text-2xl font-bold text-teal-400 font-mono">
            {cvrpRoute ? `${cvrpRoute.total_distance_km} km` : '0 km'}
          </p>
        </div>
      </div>

      {/* Leaflet Interactive Fleet Map */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Live Delhi-NCR Geospatial Fleet Map</h3>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Telemetry Feed
          </span>
        </div>
        <InteractiveMap
          center={[28.6139, 77.2090]}
          zoom={11}
          markers={mapMarkers}
          polylineCoords={cvrpRoute ? cvrpRoute.route_polyline_coords : []}
        />
      </div>

      {/* CVRP Route Polyline & Waypoints Panel */}
      {cvrpRoute && (
        <div className="glass-card p-6 space-y-5 border-l-4 border-emerald-500 bg-gradient-to-b from-slate-900 to-emerald-950/20 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>Capacitated Vehicle Routing Plan ({cvrpRoute.vehicle_id})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Est. Duration: {cvrpRoute.estimated_duration_minutes} mins</span>
          </div>

          {/* Turn-by-Turn Waypoint Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sequential Turn-by-Turn Truck Waypoints</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cvrpRoute.waypoints.map((wp) => (
                <div key={wp.step_number} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                      #{wp.step_number}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-red-400 px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30">
                      {wp.fill_percentage}% FILL
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white">{wp.bin_name}</h5>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Collect: <strong className="text-emerald-400 font-mono">{wp.weight_to_collect_kg} kg</strong></span>
                    <span>Distance: <strong className="text-slate-300 font-mono">{wp.distance_from_prev_km} km</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IoT Smart Bin Telemetry Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Live IoT Smart Bin Fleet Telemetry (20 Nodes)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bins.map((bin) => (
            <div
              key={bin.bin_id}
              className={`p-4 rounded-xl glass-card space-y-3 transition-all ${
                bin.is_threshold_breached
                  ? 'border-red-500/60 bg-red-950/20 glow-border-red'
                  : 'hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{bin.bin_id}</span>
                  <h4 className="text-xs font-bold text-white leading-tight">{bin.name}</h4>
                </div>
                {bin.is_threshold_breached && (
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </div>

              {/* Fill Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Fill Level:</span>
                  <span className={`font-mono font-bold ${bin.is_threshold_breached ? 'text-red-400' : 'text-emerald-400'}`}>
                    {bin.current_fill_percentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      bin.is_threshold_breached ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${bin.current_fill_percentage}%` }}
                  />
                </div>
              </div>

              {/* Weight & Battery */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Weight className="w-3 h-3 text-slate-500" />
                  <span className="font-mono text-slate-200">{bin.current_weight_kg} kg</span>
                </span>
                <span className="flex items-center gap-1">
                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono text-emerald-400">{bin.battery_level_pct}%</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
