import React, { useState, useEffect } from 'react';
import {
  Truck,
  RefreshCw,
  AlertTriangle,
  Navigation,
  Scale,
  MapPin,
  Activity,
  Layers,
} from 'lucide-react';
import { fetchSmartBins, simulateTelemetryTick, solveCVRPRoute } from '../services/api';
import type { SmartBin, CVRPRouteResponse } from '../services/api';
import { InteractiveMap } from './InteractiveMap';

interface MunicipalDashboardViewProps {
  theme?: 'dark' | 'light';
}

export const MunicipalDashboardView: React.FC<MunicipalDashboardViewProps> = ({ theme = 'dark' }) => {
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
  const totalWeightKg = bins.reduce((acc, b) => acc + b.current_weight_kg, 0);

  const mapMarkers = bins.map((b) => ({
    id: b.bin_id,
    lat: b.latitude,
    lng: b.longitude,
    title: b.name,
    subtitle: `Fill: ${b.current_fill_percentage}% | Weight: ${b.current_weight_kg}kg`,
    isBreached: b.is_threshold_breached,
  }));

  return (
    <div className="space-y-8 py-6">
      {/* Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
              Fleet Logistics & Telemetry
            </span>
            <span className="opacity-40">•</span>
            <span className="text-xs text-[var(--text-muted)]">Delhi-NCR Municipal Grid</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
            Smart Bin Operations & CVRP Route Dispatch
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-3xl">
            Live telemetry monitoring across municipal aggregation bins, dynamic 80% capacity breach detection, and Capacitated Vehicle Routing Problem (CVRP) optimal pickup dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateTick}
            disabled={loading}
            className="btn-ghost-dark text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Simulate Sensor Telemetry</span>
          </button>

          <button
            onClick={handleSolveCVRP}
            disabled={loading}
            className="btn-emerald text-xs flex items-center gap-2"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Solve CVRP Route</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Monitored Smart Bins</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{bins.length}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Online</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">All IoT load cells operational</span>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Capacity Breaches (≥80%)</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className={`text-2xl font-bold font-mono ${breachedCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {breachedCount}
            </span>
            <span className="text-[10px] text-rose-500 font-mono">Immediate Pickup</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Threshold violation triggers</span>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-500" />
            <span>Aggregated Field Mass</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{totalWeightKg.toFixed(1)}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">kg</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">Across municipal territory</span>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Vehicle Dispatch Fleet</span>
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">350</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">kg Cap</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block">EV Canter DL-01-9421 Active</span>
        </div>
      </div>

      {/* Main Grid: Interactive Map + CVRP Itinerary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Leaflet Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Geospatial Bin Network Map</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Normal (&lt;80%)</span>
              </span>
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                <span>Breached (&ge;80%)</span>
              </span>
            </div>
          </div>

          <InteractiveMap
            center={[28.6139, 77.2090]}
            zoom={11}
            markers={mapMarkers}
            polylineCoords={cvrpRoute?.route_polyline_coords || []}
            theme={theme}
          />

          <p className="text-[11px] text-[var(--text-muted)] font-mono">
            * Coordinates centered on Delhi NCR network. Red beacons indicate capacity breaches requiring CVRP dispatch.
          </p>
        </div>

        {/* Right Column: CVRP Dispatch Route Sheet (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-500" />
              <span>Optimized Dispatch Itinerary</span>
            </h3>
            {cvrpRoute && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                CVRP Solved
              </span>
            )}
          </div>

          {cvrpRoute ? (
            <div className="surface-card p-5 space-y-4 border border-emerald-500/40">
              {/* Route Summary */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[var(--bg-surface-well)] border border-[var(--border-subtle)] text-center font-mono">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Distance</span>
                  <strong className="text-[var(--text-primary)] text-sm">{cvrpRoute.total_distance_km} km</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Est. Time</span>
                  <strong className="text-[var(--text-primary)] text-sm">{cvrpRoute.estimated_duration_minutes} min</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Yield Mass</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{cvrpRoute.total_weight_collected_kg} kg</strong>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block">
                  Waypoint Pickup Sequence:
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {cvrpRoute.waypoints.map((wp) => (
                    <div
                      key={wp.step_number}
                      className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-start gap-3 text-xs"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                        {wp.step_number}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-semibold text-[var(--text-primary)]">{wp.bin_name}</h4>
                          <span className="font-mono text-[11px] text-rose-500 font-bold">
                            {wp.fill_percentage}% full
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
                          <span>Collect: <strong className="text-emerald-600 dark:text-emerald-300">{wp.weight_to_collect_kg} kg</strong></span>
                          <span>Vehicle Load: {wp.cumulative_vehicle_load_kg} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle Dispatch Action */}
              <button
                onClick={() => alert(`Vehicle ${cvrpRoute.vehicle_id} dispatched along optimal CVRP trajectory.`)}
                className="w-full btn-emerald text-xs flex items-center justify-center gap-2"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Transmit Manifest to EV Canter (DL-01-9421)</span>
              </button>
            </div>
          ) : (
            <div className="surface-card p-8 text-center space-y-3 border-dashed border-[var(--border-medium)]">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">No Route Active</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                  Click "Solve CVRP Route" to compute the minimum-distance pickup route for all threshold-breached bins.
                </p>
              </div>
              <button
                onClick={handleSolveCVRP}
                disabled={loading}
                className="btn-emerald text-xs px-4"
              >
                Solve CVRP Route Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Bins Status Table */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Connected Smart Aggregation Bins</span>
          </h4>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Auto-refresh on telemetry tick
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
                <th className="py-2 font-medium">Bin ID & Location</th>
                <th className="py-2 font-medium">Waste Type</th>
                <th className="py-2 font-medium">Capacity Level</th>
                <th className="py-2 font-medium">Weight (kg)</th>
                <th className="py-2 font-medium">Battery</th>
                <th className="py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {bins.map((bin) => (
                <tr key={bin.bin_id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-[var(--text-primary)]">
                    <span className="font-mono text-[var(--text-muted)] text-[11px] block">{bin.bin_id}</span>
                    {bin.name}
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">
                    {bin.primary_waste_type}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[var(--bg-surface-subtle)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                        <div
                          className={`h-full ${bin.is_threshold_breached ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, bin.current_fill_percentage)}%` }}
                        />
                      </div>
                      <span className={`font-mono text-xs font-semibold ${bin.is_threshold_breached ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`}>
                        {bin.current_fill_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-[var(--text-secondary)]">
                    {bin.current_weight_kg.toFixed(1)} kg
                  </td>
                  <td className="py-3 font-mono text-[var(--text-muted)]">
                    {bin.battery_level_pct}%
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        bin.is_threshold_breached
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {bin.is_threshold_breached ? 'BREACHED' : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
