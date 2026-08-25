import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { sites, workers } from '../../data/mockData';
import { WorkerSheet } from '../WorkerSheet';

type MapMode = 'sites' | 'workers';

const WORKER_COLORS: Record<string, string> = {
  green: '#2E7D5B',
  red: '#A81E14',
  clay: '#C2571F',
  gray: '#8A9099',
};

export function MapScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const selectWorker = useAppStore((s) => s.selectWorker);

  const [mode, setMode] = useState<MapMode>('sites');

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteLayerRef = useRef<L.LayerGroup | null>(null);
  const workerLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize the Leaflet map once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [49.8209, 18.275],
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const siteLayer = L.layerGroup();
    const workerLayer = L.layerGroup();

    sites.forEach((site) => {
      const circle = L.circle([site.lat, site.lng], {
        radius: site.radius,
        color: '#FFE328',
        weight: 2,
        dashArray: '6 6',
        fillColor: '#3F18FF',
        fillOpacity: 0.5,
      });

      circle.bindTooltip(
        `${site.name} <span class="mono">${site.code}</span>`,
        { direction: 'top' }
      );

      circle.addTo(siteLayer);
    });

    workers.forEach((worker) => {
      const marker = L.circleMarker([worker.lat, worker.lng], {
        radius: 8,
        color: '#FFFFFF',
        weight: 2,
        fillColor: WORKER_COLORS[worker.status],
        fillOpacity: 1,
      });

      marker.bindTooltip(worker.name);
      marker.on('click', () => selectWorker(worker.name));
      marker.addTo(workerLayer);
    });

    siteLayer.addTo(map);

    mapRef.current = map;
    siteLayerRef.current = siteLayer;
    workerLayerRef.current = workerLayer;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap which layer is shown when the sites/workers toggle changes.
  useEffect(() => {
    const map = mapRef.current;
    const siteLayer = siteLayerRef.current;
    const workerLayer = workerLayerRef.current;
    if (!map || !siteLayer || !workerLayer) return;

    if (mode === 'sites') {
      map.addLayer(siteLayer);
      map.removeLayer(workerLayer);
    } else {
      map.addLayer(workerLayer);
      map.removeLayer(siteLayer);
    }

    selectWorker(null);
  }, [mode, selectWorker]);

  // Leaflet needs a resize nudge once its container becomes visible again.
  useEffect(() => {
    if (activeScreen !== 'map' || !mapRef.current) return;
    const id = setTimeout(() => mapRef.current?.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [activeScreen]);

  return (
    <section className={`screen ${activeScreen === 'map' ? 'active' : ''}`} id="screen-map">
      <div className="map-canvas">
        <div ref={containerRef} />
      </div>

      <div className="map-controls">
        <div className="seg">
          <button
            id="seg-sites"
            className={`seg-btn ${mode === 'sites' ? 'active' : ''}`}
            onClick={() => setMode('sites')}
          >
            Stavby
          </button>
          <button
            id="seg-workers"
            className={`seg-btn ${mode === 'workers' ? 'active' : ''}`}
            onClick={() => setMode('workers')}
          >
            Pracovníci
          </button>
        </div>
      </div>

      {mode === 'sites' ? (
        <div className="map-legend">
          <span>
            <i className="dot amber" />
            Areál stavby (geofence)
          </span>
        </div>
      ) : (
        <div className="map-legend">
          <span>
            <i className="dot green" />
            Ověřeno
          </span>
          <span>
            <i className="dot clay" />
            Ke kontrole
          </span>
          <span>
            <i className="dot red" />
            Kritické
          </span>
          <span>
            <i className="dot gray" />
            Mimo stavbu
          </span>
        </div>
      )}

      <WorkerSheet />
    </section>
  );
}
