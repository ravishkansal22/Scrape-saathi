import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  isBreached?: boolean;
}

interface InteractiveMapProps {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  polylineCoords?: number[][]; // Array of [lat, lng]
  theme?: 'dark' | 'light';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom = 12,
  markers,
  polylineCoords = [],
  theme = 'dark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Handle Dynamic TileLayer on Theme Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Use OpenStreetMap tiles - completely free and reliable, zero API key watermarks
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: theme === 'dark' ? 'osm-tile-dark' : 'osm-tile-light',
    }).addTo(mapInstanceRef.current);
  }, [theme]);

  // Handle Markers & Polyline
  useEffect(() => {
    if (!layerGroupRef.current || !mapInstanceRef.current) return;

    layerGroupRef.current.clearLayers();

    // Render markers
    markers.forEach((m) => {
      const markerColor = m.isBreached ? '#EF4444' : '#10B981';
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div style="
          position: relative;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${m.isBreached ? `
            <span style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: rgba(239, 68, 68, 0.4);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
          ` : ''}
          <div style="
            background: ${markerColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            position: relative;
            z-index: 2;
          "></div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #0F172A; padding: 4px 2px; min-width: 140px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${m.title}</div>
          ${m.subtitle ? `<div style="font-size: 11px; color: #475569; font-family: monospace;">${m.subtitle}</div>` : ''}
          <div style="margin-top: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: ${m.isBreached ? '#DC2626' : '#059669'};">
            ${m.isBreached ? 'Threshold Breached (>=80%)' : 'Normal Capacity'}
          </div>
        </div>
      `);
      layerGroupRef.current?.addLayer(marker);
    });

    // Render CVRP polyline if provided
    if (polylineCoords.length > 1) {
      const latLngs = polylineCoords.map((c) => [c[0], c[1]] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#10B981',
        weight: 4,
        opacity: 0.95,
        dashArray: '8, 8',
      });
      layerGroupRef.current.addLayer(polyline);

      // Fit map bounds to polyline
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [markers, polylineCoords]);

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-canvas)]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
