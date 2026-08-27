import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { sites, workers, workerDetails } from '../../data/mockData';
import { WorkerSheet } from '../WorkerSheet';

type SiteItem = (typeof sites)[number];
type WorkerItem = (typeof workers)[number];

type Mode = 'far' | 'near';
type WorkerTone = 'green' | 'red' | 'clay' | 'gray';
type WorkerFilter = 'all' | WorkerTone | 'outside';
type SiteTone = 'green' | 'clay' | 'red';
type MapEntity = 'sites' | 'workers';

type WorkerContext = {
  worker: WorkerItem;
  key: string;
  site: SiteItem;
  distanceM: number;
  outside: boolean;
  status: WorkerTone;
  displayTone: WorkerTone;
};

type SiteStat = {
  site: SiteItem;
  members: WorkerContext[];
  insideCount: number;
  totalCount: number;
  outsideCount: number;
  critical: number;
  warn: number;
  tone: SiteTone;
};

const WORKER_COLORS: Record<WorkerTone, string> = {
  green: '#2E7D5B',
  red: '#A81E14',
  clay: '#C2571F',
  gray: '#8A9099',
};

const BADGE_BG: Record<WorkerTone, string> = {
  green: '#E7F1EB',
  red: '#FAE9E7',
  clay: '#FBEDE4',
  gray: '#F3F4F6',
};

const BADGE_FG: Record<WorkerTone, string> = {
  green: '#1F6047',
  red: '#8E1810',
  clay: '#9A4416',
  gray: '#5E6672',
};

const STATUS_LABEL: Record<WorkerTone, string> = {
  green: 'Ověřeno',
  clay: 'Ke kontrole',
  red: 'Kritické',
  gray: 'Mimo stavbu',
};

function getWorkerIncidentTone(worker: WorkerItem): WorkerTone {
  const detail = workerDetails[worker.name];

  if (detail?.incident === 'alcohol') return 'red';
  if (detail?.incident === 'late') return 'clay';

  return 'green';
}

function getWorkerKey(worker: WorkerItem) {
  const maybeId = (worker as { id?: string | number }).id;
  return String(maybeId ?? `${worker.name}-${worker.lat}-${worker.lng}`);
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
    Math.cos((bLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function fitMapToSites(map: L.Map) {
  const bounds = L.latLngBounds(sites.map((site) => [site.lat, site.lng] as [number, number]));
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.18), { padding: [24, 24] });
  }
}

function getSiteTone(args: { critical: number; warn: number }): SiteTone {
  if (args.critical > 0) return 'red';
  if (args.warn > 0) return 'clay';
  return 'green';
}

function getSiteToneLabel(args: { critical: number; warn: number; outsideCount: number }) {
  if (args.critical > 0) return 'Kritické';
  if (args.warn > 0 || args.outsideCount > 0) return 'Pozor';
  return 'OK';
}

function siteCardIcon(
  site: SiteItem,
  insideCount: number,
  totalCount: number,
  tone: SiteTone,
  active: boolean
) {
  const color = WORKER_COLORS[tone];
  const border = active ? '#17191C' : tone === 'green' ? '#DDD8D1' : color;

  const html = `
    <div style="
      width: 144px;
      display:flex;
      flex-direction:column;
      align-items:center;
      font-family: Inter, system-ui, sans-serif;
    ">
      <div style="
        width: 144px;
        background:#FFFFFF;
        border:1px solid ${border};
        border-radius:14px;
        overflow:hidden;
        box-shadow:${active ? '0 10px 24px rgba(23,25,28,.18)' : '0 6px 18px rgba(23,25,28,.10)'};
      ">
        <div style="height:4px;background:${color};"></div>
        <div style="padding:10px 10px 9px 10px;">
          <div style="
            font-size:12px;
            font-weight:700;
            color:#17191C;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          ">
            ${site.name}
          </div>
          <div style="
            margin-top:4px;
            display:flex;
            align-items:baseline;
            gap:6px;
          ">
            <span style="
              font-size:16px;
              font-weight:700;
              color:${tone === 'green' ? '#17191C' : BADGE_FG[tone]};
            ">
              ${insideCount}
            </span>
            <span style="
              font-size:10px;
              color:#8A9099;
              white-space:nowrap;
            ">
              uvnitř · ${totalCount} lidí
            </span>
          </div>
          <div style="
            margin-top:6px;
            display:inline-flex;
            align-items:center;
            padding:3px 7px;
            border-radius:999px;
            background:${BADGE_BG[tone]};
            color:${BADGE_FG[tone]};
            font-size:10px;
            font-weight:700;
          ">
            ${getSiteToneLabel({
    critical: tone === 'red' ? 1 : 0,
    warn: tone === 'clay' ? 1 : 0,
    outsideCount: tone === 'clay' ? 1 : 0,
  })}
          </div>
        </div>
      </div>
      <div style="width:2px;height:10px;background:${color};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [144, 82],
    iconAnchor: [72, 82],
  });
}

export function MapScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const selectedWorker = useAppStore((s) => s.selectedWorker);
  const selectWorker = useAppStore((s) => s.selectWorker);
  const focusedSiteId = useAppStore((s) => s.focusedSiteId);
  const focusedWorkerName = useAppStore((s) => s.focusedWorkerName);
  const focusRequestId = useAppStore((s) => s.focusRequestId);
  const focusedWorkerKey = useAppStore((s) => s.focusedWorkerKey);
  const setFocusedWorkerKey = useAppStore((s) => s.setFocusedWorkerKey);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteLayerRef = useRef<L.LayerGroup | null>(null);
  const workerLayerRef = useRef<L.LayerGroup | null>(null);

  const [mode, setMode] = useState<Mode>('far');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState<MapEntity>('sites');
  const [workerFilter, setWorkerFilter] = useState<WorkerFilter>('all');
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [layers, setLayers] = useState({
    sites: true,
    zones: true,
    workers: true,
  });

  const q = search.trim().toLowerCase();

  const workerContexts = useMemo<WorkerContext[]>(() => {
    const out: WorkerContext[] = [];

    for (const worker of workers) {
      let nearestSite: SiteItem | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const site of sites) {
        const d = haversineMeters(worker.lat, worker.lng, site.lat, site.lng);
        if (d < bestDistance) {
          bestDistance = d;
          nearestSite = site;
        }
      }

      if (!nearestSite) continue;

      const status = getWorkerIncidentTone(worker);
      const outside = bestDistance > nearestSite.radius;

      out.push({
        worker,
        key: getWorkerKey(worker),
        site: nearestSite,
        distanceM: Math.round(bestDistance),
        outside,
        status,
        displayTone: outside ? 'gray' : status,
      });
    }

    return out;
  }, []);

  const siteStats = useMemo<SiteStat[]>(() => {
    return sites.map((site) => {
      const members = workerContexts.filter((ctx) => ctx.site.id === site.id);
      const insideCount = members.filter((ctx) => !ctx.outside).length;
      const outsideCount = members.filter((ctx) => ctx.outside).length;
      const critical = members.filter((ctx) => ctx.status === 'red').length;
      const warn = members.filter((ctx) => ctx.status === 'clay').length;

      return {
        site,
        members,
        insideCount,
        totalCount: members.length,
        outsideCount,
        critical,
        warn,
        tone: getSiteTone({ critical, warn }),
      };
    });
  }, [workerContexts]);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [selectedSiteId]
  );

  const selectedSiteWorkersAll = useMemo(() => {
    if (!selectedSite) return [];
    return workerContexts.filter((ctx) => ctx.site.id === selectedSite.id);
  }, [selectedSite, workerContexts]);

  const globallyFilteredWorkers = useMemo(() => {
    return workerContexts.filter((ctx) => {
      const matchesQuery =
        !q ||
        ctx.worker.name.toLowerCase().includes(q) ||
        ctx.site.name.toLowerCase().includes(q) ||
        ctx.site.code.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (workerFilter === 'all') return true;
      if (workerFilter === 'outside') return ctx.outside;

      return ctx.status === workerFilter;
    });
  }, [workerContexts, q, workerFilter]);

  const searchFilteredSiteStats = useMemo(() => {
    return siteStats.filter((row) => {
      if (!q) return true;
      return row.site.name.toLowerCase().includes(q) || row.site.code.toLowerCase().includes(q);
    });
  }, [siteStats, q]);

  const filteredWorkers = useMemo(() => {
    if (!selectedSite) return [];
    return globallyFilteredWorkers.filter((ctx) => ctx.site.id === selectedSite.id);
  }, [selectedSite, globallyFilteredWorkers]);

  const filteredSiteStats = useMemo<SiteStat[]>(() => {
    return sites
      .map((site) => {
        const members = globallyFilteredWorkers.filter((ctx) => ctx.site.id === site.id);
        const insideCount = members.filter((ctx) => !ctx.outside).length;
        const outsideCount = members.filter((ctx) => ctx.outside).length;
        const critical = members.filter((ctx) => ctx.status === 'red').length;
        const warn = members.filter((ctx) => ctx.status === 'clay').length;

        return {
          site,
          members,
          insideCount,
          totalCount: members.length,
          outsideCount,
          critical,
          warn,
          tone: getSiteTone({ critical, warn }),
        };
      })
      .filter((row) => {
        if (workerFilter === 'all' && !q) return true;
        return row.totalCount > 0;
      });
  }, [globallyFilteredWorkers, workerFilter, q]);

  const selectedSiteStat = useMemo<SiteStat | null>(() => {
    if (!selectedSite) return null;

    const filtered = filteredSiteStats.find((row) => row.site.id === selectedSite.id);
    if (filtered) return filtered;

    if (workerFilter === 'all' && !q) {
      return siteStats.find((row) => row.site.id === selectedSite.id) ?? null;
    }

    return {
      site: selectedSite,
      members: [],
      insideCount: 0,
      totalCount: 0,
      outsideCount: 0,
      critical: 0,
      warn: 0,
      tone: 'green',
    };
  }, [selectedSite, filteredSiteStats, siteStats, workerFilter, q]);

  const totalAlertSites = siteStats.filter((row) => row.tone !== 'green').length;
  const visibleAlertSites = filteredSiteStats.filter((row) => row.tone !== 'green').length;

  const totalWorkers = workers.length;
  const totalSites = sites.length;

  const topSiteCount = workerFilter === 'all' && !q ? totalSites : filteredSiteStats.length;
  const topWorkerCount = workerFilter === 'all' && !q ? totalWorkers : globallyFilteredWorkers.length;
  const topAlertSiteCount = workerFilter === 'all' && !q ? totalAlertSites : visibleAlertSites;

  const openSite = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.id === siteId);
      if (!site) return;

      setMode('near');
      setSelectedSiteId(siteId);
      setFocusedWorkerKey(null);
      setIsSheetCollapsed(false);
      selectWorker(null);

      const map = mapRef.current;
      if (map) {
        map.invalidateSize();
        map.flyTo([site.lat, site.lng], 17, { duration: 0.75 });
      }
    },
    [selectWorker, setFocusedWorkerKey]
  );

  const backToOverview = useCallback(() => {
    setMode('far');
    setSelectedSiteId(null);
    setFocusedWorkerKey(null);
    setIsSheetCollapsed(false);
    selectWorker(null);

    const map = mapRef.current;
    if (map) {
      map.invalidateSize();
      fitMapToSites(map);
    }
  }, [selectWorker, setFocusedWorkerKey]);

  const focusWorkerMarker = useCallback(
    (ctx: WorkerContext) => {
      setFocusedWorkerKey(ctx.key);
      selectWorker(ctx.worker.name);

      const map = mapRef.current;
      if (map) {
        map.flyTo([ctx.worker.lat, ctx.worker.lng], 18, { duration: 0.65 });
      }
    },
    [selectWorker, setFocusedWorkerKey]
  );

  const focusWorkerFromFar = useCallback(
    (ctx: WorkerContext) => {
      openSite(ctx.site.id);
      window.setTimeout(() => {
        focusWorkerMarker(ctx);
      }, 320);
    },
    [openSite, focusWorkerMarker]
  );

  useEffect(() => {
    if (!selectedWorker && focusedWorkerKey !== null) {
      setFocusedWorkerKey(null);
    }
  }, [selectedWorker, focusedWorkerKey, setFocusedWorkerKey]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const siteLayer = L.layerGroup().addTo(map);
    const workerLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    siteLayerRef.current = siteLayer;
    workerLayerRef.current = workerLayer;

    fitMapToSites(map);

    return () => {
      map.remove();
      mapRef.current = null;
      siteLayerRef.current = null;
      workerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const siteLayer = siteLayerRef.current;
    const workerLayer = workerLayerRef.current;
    if (!map || !siteLayer || !workerLayer) return;

    siteLayer.clearLayers();
    workerLayer.clearLayers();

    if (mode === 'far') {
      if (layers.zones) {
        filteredSiteStats.forEach((row) => {
          const color = WORKER_COLORS[row.tone];

          const circle = L.circle([row.site.lat, row.site.lng], {
            radius: row.site.radius,
            color,
            weight: 1.5,
            dashArray: '6 6',
            fillColor: color,
            fillOpacity: 0.11,
          });

          circle.bindTooltip(row.site.name, {
            direction: 'top',
            className: 'map-mobile-tooltip',
          });

          circle.on('click', () => openSite(row.site.id));
          circle.addTo(siteLayer);
        });
      }

      if (layers.sites) {
        filteredSiteStats.forEach((row) => {
          const marker = L.marker([row.site.lat, row.site.lng], {
            icon: siteCardIcon(row.site, row.insideCount, row.totalCount, row.tone, false),
          });

          marker.on('click', () => openSite(row.site.id));
          marker.addTo(siteLayer);
        });
      }

      if (layers.workers) {
        globallyFilteredWorkers.forEach((ctx) => {
          const marker = L.circleMarker([ctx.worker.lat, ctx.worker.lng], {
            radius: 6,
            color: '#FFFFFF',
            weight: 2,
            fillColor: WORKER_COLORS[ctx.displayTone],
            fillOpacity: 1,
          });

          marker.bindTooltip(ctx.worker.name, {
            direction: 'top',
            className: 'map-mobile-tooltip',
          });

          marker.on('click', () => focusWorkerFromFar(ctx));
          marker.addTo(workerLayer);
        });
      }
    }

    if (mode === 'near' && selectedSite) {
      const tone = selectedSiteStat?.tone ?? 'green';
      const color = WORKER_COLORS[tone];

      if (layers.zones) {
        const circle = L.circle([selectedSite.lat, selectedSite.lng], {
          radius: selectedSite.radius,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.12,
        });

        circle.bindTooltip(selectedSite.name, {
          direction: 'top',
          className: 'map-mobile-tooltip',
        });

        circle.addTo(siteLayer);
      }

      if (layers.sites) {
        const marker = L.marker([selectedSite.lat, selectedSite.lng], {
          icon: siteCardIcon(
            selectedSite,
            selectedSiteStat?.insideCount ?? 0,
            selectedSiteStat?.totalCount ?? 0,
            tone,
            true
          ),
        });

        marker.addTo(siteLayer);
      }

      if (layers.workers) {
        filteredWorkers.forEach((ctx) => {
          const active = focusedWorkerKey === ctx.key;
          const marker = L.circleMarker([ctx.worker.lat, ctx.worker.lng], {
            radius: active ? 10 : 8,
            color: '#FFFFFF',
            weight: active ? 3 : 2,
            fillColor: WORKER_COLORS[ctx.displayTone],
            fillOpacity: 1,
          });

          marker.bindTooltip(ctx.worker.name, {
            direction: 'top',
            permanent: active,
            className: 'map-mobile-tooltip',
          });

          marker.on('click', () => focusWorkerMarker(ctx));
          marker.addTo(workerLayer);
        });
      }
    }
  }, [
    mode,
    selectedSite,
    selectedSiteStat,
    filteredSiteStats,
    filteredWorkers,
    globallyFilteredWorkers,
    layers,
    focusedWorkerKey,
    openSite,
    focusWorkerFromFar,
    focusWorkerMarker,
  ]);

  useEffect(() => {
    if (activeScreen !== 'map' || !mapRef.current) return;
    const id = window.setTimeout(() => mapRef.current?.invalidateSize(), 120);
    return () => window.clearTimeout(id);
  }, [activeScreen]);

  useEffect(() => {
    if (focusRequestId === 0) return;
    const site = sites.find((s) => s.id === focusedSiteId);
    if (!site) return;

    const id = window.setTimeout(() => {
      setMode('near');
      setSelectedSiteId(site.id);
      setIsSheetCollapsed(false);
      mapRef.current?.invalidateSize();
      const targetWorker = focusedWorkerName
        ? workerContexts.find((ctx) => ctx.worker.name === focusedWorkerName && ctx.site.id === site.id)
        : null;

      if (targetWorker) {
        setFocusedWorkerKey(targetWorker.key);
        selectWorker(targetWorker.worker.name);
        mapRef.current?.flyTo([targetWorker.worker.lat, targetWorker.worker.lng], 18, { duration: 0.8 });
      } else {
        setFocusedWorkerKey(null);
        selectWorker(null);
        mapRef.current?.flyTo([site.lat, site.lng], 17, { duration: 0.8 });
      }
    }, 120);

    return () => window.clearTimeout(id);
  }, [focusRequestId, focusedSiteId, focusedWorkerName, workerContexts, selectWorker, setFocusedWorkerKey]);

  return (
    <section
      className={`screen screen--map-mobile ${activeScreen === 'map' ? 'active' : ''}`}
      id="screen-map"
    >
      <div className="map-mobile__canvas">
        <div ref={containerRef} className="map-mobile__leaflet" />
      </div>

      <div className="map-mobile__top">
        <div className="map-mobile__toolbar">
          {mode === 'near' && (
            <button
              className="map-mobile__icon-btn"
              onClick={backToOverview}
              aria-label="Zpět"
              type="button"
            >
              ←
            </button>
          )}

          <div className="map-mobile__search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat pracovníka nebo stavbu"
            />
            {search && (
              <button
                className="map-mobile__clear-btn"
                onClick={() => setSearch('')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="map-mobile__chips">
          <button
            className={`map-mobile__chip ${layers.sites ? 'is-active' : ''}`}
            onClick={() => setLayers((s) => ({ ...s, sites: !s.sites }))}
            type="button"
          >
            Stavby
          </button>

          <button
            className={`map-mobile__chip ${layers.workers ? 'is-active' : ''}`}
            onClick={() => setLayers((s) => ({ ...s, workers: !s.workers }))}
            type="button"
          >
            Lidé
          </button>

          <button
            className={`map-mobile__chip ${layers.zones ? 'is-active' : ''}`}
            onClick={() => setLayers((s) => ({ ...s, zones: !s.zones }))}
            type="button"
          >
            Zóny
          </button>
        </div>

        <div className="map-mobile__filters">
          {[
            ['all', 'Všichni'],
            ['green', 'OK'],
            ['clay', 'Kontrola'],
            ['red', 'Kritické'],
            ['outside', 'Mimo'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`map-mobile__filter-chip ${workerFilter === id ? 'is-active' : ''}`}
              onClick={() => setWorkerFilter(id as WorkerFilter)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="map-mobile__stats">
          {mode === 'far' ? (
            <>
              <div className="map-mobile__stat">
                <strong>{topSiteCount}</strong>
                <span>{workerFilter === 'all' && !q ? 'stavby' : 'viditelné stavby'}</span>
              </div>
              <div className="map-mobile__stat">
                <strong>{topWorkerCount}</strong>
                <span>{workerFilter === 'all' && !q ? 'pracovníci' : 'viditelní lidé'}</span>
              </div>
              <div className="map-mobile__stat">
                <strong className={topAlertSiteCount > 0 ? 'is-bad' : ''}>{topAlertSiteCount}</strong>
                <span>alerty</span>
              </div>
            </>
          ) : (
            <>
              <div className="map-mobile__stat">
                <strong>{selectedSiteStat?.insideCount ?? 0}</strong>
                <span>uvnitř</span>
              </div>
              <div className="map-mobile__stat">
                <strong className={(selectedSiteStat?.outsideCount ?? 0) > 0 ? 'is-warn' : ''}>
                  {selectedSiteStat?.outsideCount ?? 0}
                </strong>
                <span>mimo zónu</span>
              </div>
              <div className="map-mobile__stat">
                <strong className={(selectedSiteStat?.critical ?? 0) > 0 ? 'is-bad' : ''}>
                  {(selectedSiteStat?.critical ?? 0) + (selectedSiteStat?.warn ?? 0)}
                </strong>
                <span>ke kontrole</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="map-mobile__actions">
        <button onClick={() => mapRef.current?.zoomIn()} aria-label="Přiblížit" type="button">
          +
        </button>
        <button
          onClick={() => {
            if (mode === 'near') {
              backToOverview();
            } else {
              mapRef.current?.zoomOut();
            }
          }}
          aria-label="Oddálit"
          type="button"
        >
          −
        </button>
      </div>

      {!selectedWorker && (
        <div className={`map-mobile__sheet ${isSheetCollapsed ? 'is-collapsed' : ''}`}>
          <button
            type="button"
            className="map-mobile__sheet-toggle"
            onClick={() => setIsSheetCollapsed((v) => !v)}
            aria-label={isSheetCollapsed ? 'Rozbalit panel' : 'Sbalit panel'}
          >
            <div className="map-mobile__sheet-handle" />
          </button>

          <div className="map-mobile__sheet-header">
            <div>
              <strong>{mode === 'far' ? (entity === 'sites' ? 'Stavby' : 'Lidé na stavbách') : 'Pracovníci na stavbě'}</strong>
              <span>
                {mode === 'far'
                  ? entity === 'sites'
                    ? `${searchFilteredSiteStats.length} z ${siteStats.length}`
                    : `${globallyFilteredWorkers.length} z ${workerContexts.length}`
                  : `${filteredWorkers.length} z ${selectedSiteWorkersAll.length}`}
              </span>
            </div>

            {mode === 'near' && selectedSiteStat && (
              <span
                className="map-mobile__sheet-badge"
                style={{
                  background: BADGE_BG[selectedSiteStat.tone],
                  color: BADGE_FG[selectedSiteStat.tone],
                }}
              >
                {getSiteToneLabel(selectedSiteStat)}
              </span>
            )}
          </div>

          <div className="map-mobile__entity-switch" role="tablist" aria-label="Typ seznamu">
            <button
              className={entity === 'sites' ? 'is-active' : ''}
              onClick={() => setEntity('sites')}
              type="button"
              role="tab"
              aria-selected={entity === 'sites'}
            >
              Stavby
            </button>
            <button
              className={entity === 'workers' ? 'is-active' : ''}
              onClick={() => setEntity('workers')}
              type="button"
              role="tab"
              aria-selected={entity === 'workers'}
            >
              Lidé
            </button>
          </div>

          {!isSheetCollapsed && (
            <>
              <div className="map-mobile__sheet-list">
                {mode === 'far' && entity === 'sites' &&
                  searchFilteredSiteStats.map((row) => (
                    <button
                      key={row.site.id}
                      className="map-mobile__row"
                      onClick={() => openSite(row.site.id)}
                      type="button"
                    >
                      <span
                        className="map-mobile__row-accent"
                        style={{ background: WORKER_COLORS[row.tone] }}
                      />
                      <div className="map-mobile__row-main">
                        <strong>{row.site.name}</strong>
                        <span>{row.site.code} · {row.insideCount} uvnitř · {row.totalCount} lidí</span>
                      </div>
                      <span
                        className="map-mobile__row-badge"
                        style={{ background: BADGE_BG[row.tone], color: BADGE_FG[row.tone] }}
                      >
                        {getSiteToneLabel(row)}
                      </span>
                    </button>
                  ))}

                {mode === 'far' && entity === 'workers' &&
                  globallyFilteredWorkers.map((ctx) => (
                    <button
                      key={ctx.key}
                      className="map-mobile__row"
                      onClick={() => focusWorkerFromFar(ctx)}
                      type="button"
                    >
                      <span className="map-mobile__row-dot" style={{ background: WORKER_COLORS[ctx.displayTone] }} />
                      <div className="map-mobile__row-main">
                        <strong>{ctx.worker.name}</strong>
                        <span>{ctx.site.name} · {ctx.distanceM} m od stavby</span>
                      </div>
                      <span className="map-mobile__row-badge" style={{ background: BADGE_BG[ctx.displayTone], color: BADGE_FG[ctx.displayTone] }}>
                        {ctx.outside ? 'Mimo zónu' : STATUS_LABEL[ctx.displayTone]}
                      </span>
                    </button>
                  ))}

                {mode === 'far' && entity === 'sites' && searchFilteredSiteStats.length === 0 && (
                  <div className="map-mobile__empty">Žádná stavba neodpovídá hledání.</div>
                )}

                {mode === 'near' &&
                  selectedSite &&
                  filteredWorkers.map((ctx) => {
                    const active = focusedWorkerKey === ctx.key;

                    return (
                      <button
                        key={ctx.key}
                        className={`map-mobile__row ${active ? 'is-selected' : ''}`}
                        onClick={() => focusWorkerMarker(ctx)}
                        type="button"
                      >
                        <span
                          className="map-mobile__row-dot"
                          style={{ background: WORKER_COLORS[ctx.displayTone] }}
                        />
                        <div className="map-mobile__row-main">
                          <strong>{ctx.worker.name}</strong>
                          <span>{ctx.distanceM} m od středu stavby</span>
                        </div>
                        <span
                          className="map-mobile__row-badge"
                          style={{
                            background: BADGE_BG[ctx.displayTone],
                            color: BADGE_FG[ctx.displayTone],
                          }}
                        >
                          {ctx.outside ? 'Mimo zónu' : STATUS_LABEL[ctx.displayTone]}
                        </span>
                      </button>
                    );
                  })}

                {mode === 'near' && filteredWorkers.length === 0 && (
                  <div className="map-mobile__empty">Žádný pracovník neodpovídá filtru.</div>
                )}
              </div>

              <div className="map-mobile__legend">
                <span>
                  <i style={{ background: WORKER_COLORS.green }} /> Ověřeno
                </span>
                <span>
                  <i style={{ background: WORKER_COLORS.clay }} /> Kontrola
                </span>
                <span>
                  <i style={{ background: WORKER_COLORS.red }} /> Kritické
                </span>
                <span>
                  <i style={{ background: WORKER_COLORS.gray }} /> Mimo stavbu
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <WorkerSheet />
    </section>
  );
}