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
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom = 12,
  markers,
  polylineCoords = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Dark Mode TileLayer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    // Clear previous markers & polyline
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();

      // Render markers
      markers.forEach((m) => {
        const markerColor = m.isBreached ? '#EF4444' : '#10B981';
        const customIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: `<div style="
            background: ${markerColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${markerColor};
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: system-ui; color: #0f172a; padding: 2px;">
            <strong style="font-size: 13px;">${m.title}</strong>
            ${m.subtitle ? `<div style="font-size: 11px; color: #475569;">${m.subtitle}</div>` : ''}
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
          opacity: 0.9,
          dashArray: '8, 8',
        });
        layerGroupRef.current.addLayer(polyline);

        // Fit map bounds to polyline
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    }
  }, [center, zoom, markers, polylineCoords]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
