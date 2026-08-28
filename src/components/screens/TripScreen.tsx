import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { sites } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';

type Phase = 'idle' | 'starting' | 'active';
type RoutePoint = [number, number];

const DEPARTURE_ADDRESS = 'Konská 278, 739 61 Třinec 1';
const DEPARTURE_ORIGIN: RoutePoint = [49.6865626, 18.6346325];
const DEPARTURE_TIME = '07:42';

const START_STEPS = [
  ['Ověřuji polohu', 'GPS OK'],
  ['Kontroluji vozidlo', 'Připraveno'],
  ['Zaznamenávám výjezd', 'Uloženo'],
] as const;

function tripSiteIcon(selected: boolean) {
  return L.divIcon({
    className: 'trip-map-marker',
    html: `<span class="trip-map-marker__dot ${selected ? 'is-selected' : ''}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="trip-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function expectedArrival(departure: string, durationMin: number | null) {
  if (durationMin === null) return 'Počítám…';
  const [hours, minutes] = departure.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMin;
  return `${String(Math.floor((totalMinutes % 1440) / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function TripScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const [phase, setPhase] = useState<Phase>('idle');
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '');
  const [completedSteps, setCompletedSteps] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const siteLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [departureOrigin, setDepartureOrigin] = useState<RoutePoint>(DEPARTURE_ORIGIN);
  const [departureAddress, setDepartureAddress] = useState(DEPARTURE_ADDRESS);
  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const gpsStepStatus = departureAddress === DEPARTURE_ADDRESS ? 'Výchozí adresa' : 'GPS OK';

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return;
        setDepartureOrigin([coords.latitude, coords.longitude]);
        setDepartureAddress('Aktuální poloha');
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const siteLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    siteLayerRef.current = siteLayer;
    routeLayerRef.current = routeLayer;

    const bounds = L.latLngBounds(sites.map((item) => [item.lat, item.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.12), { padding: [18, 18] });

    return () => {
      map.remove();
      mapRef.current = null;
      siteLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    const map = mapRef.current;
    const siteLayer = siteLayerRef.current;
    if (!map || !siteLayer) return;

    siteLayer.clearLayers();
    sites.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], { icon: tripSiteIcon(item.id === siteId) });
      marker.bindTooltip(item.name, { direction: 'top', className: 'map-mobile-tooltip' });
      marker.on('click', () => setSiteId(item.id));
      marker.addTo(siteLayer);
    });
    map.invalidateSize();
  }, [siteId, activeScreen, phase, mapExpanded]);

  useEffect(() => {
    if (!site) return;

    let cancelled = false;
    setRouteStatus('loading');
    setRoute([]);
    setRouteDistanceKm(null);
    setRouteDurationMin(null);

    const loadRoute = async (origin: RoutePoint) => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${site.lng},${site.lat}?overview=full&geometries=geojson`,
        );
        if (!response.ok) throw new Error('OSRM request failed');
        const data = (await response.json()) as {
          routes?: { distance: number; duration: number; geometry?: { coordinates: [number, number][] } }[];
        };
        const firstRoute = data.routes?.[0];
        if (!firstRoute?.geometry) throw new Error('Route not found');
        if (cancelled) return;
        setRoute(firstRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        setRouteDistanceKm(Math.round((firstRoute.distance / 1000) * 10) / 10);
        setRouteDurationMin(Math.max(1, Math.round(firstRoute.duration / 60)));
        setRouteStatus('ready');
      } catch {
        if (!cancelled) setRouteStatus('error');
      }
    };

    void loadRoute(departureOrigin);

    return () => {
      cancelled = true;
    };
  }, [site, departureOrigin]);

  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    if (!routeLayer) return;
    routeLayer.clearLayers();
    if (phase !== 'active' || route.length === 0) return;

    L.polyline(route, {
      color: '#3f5d74',
      weight: 5,
      opacity: 0.9,
      dashArray: '10 7',
    }).addTo(routeLayer);
  }, [route, phase]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function startTrip() {
    clearTimers();
    setPhase('starting');
    setCompletedSteps(0);
    START_STEPS.forEach((_, index) => {
      timers.current.push(
        setTimeout(() => {
          setCompletedSteps(index + 1);
          if (index === START_STEPS.length - 1) setPhase('active');
        }, 700 * (index + 1)),
      );
    });
  }

  function cancelTrip() {
    clearTimers();
    setPhase('idle');
  }

  if (!site) return null;

  return (
    <section className={`screen trip-screen ${activeScreen === 'trip' ? 'active' : ''}`} id="screen-trip">
      {phase === 'idle' && (
        <div className="trip-flow">
          <div className="trip-card">
            <div className="trip-kicker">Výjezd</div>
            <h2>Zahájení pracovní cesty</h2>
            <p className="trip-copy">Potvrďte zahájení cesty na stavbu. Zaznamenáme čas a vypočítáme očekávaný příjezd.</p>
            <div className={`trip-map-shell ${mapExpanded ? 'is-fullscreen' : ''}`}>
              <div className="trip-map" ref={mapContainerRef} aria-label="Mapa staveb a trasy" />
              <button
                className="trip-map-expand"
                type="button"
                onClick={() => setMapExpanded((expanded) => !expanded)}
                aria-label={mapExpanded ? 'Zavřít mapu přes celou obrazovku' : 'Zobrazit mapu přes celou obrazovku'}
              >
                <span className="material-symbols-outlined">{mapExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
              </button>
            </div>
            <label className="trip-label" htmlFor="trip-site">Cíl cesty</label>
            <select id="trip-site" value={siteId} onChange={(event) => setSiteId(event.target.value)}>
              {sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="trip-site-list" aria-label="Seznam cílů cesty">
              {sites.map((item) => (
                <button
                  key={item.id}
                  className={item.id === siteId ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setSiteId(item.id)}
                >
                  <span className="trip-site-list__dot" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.code} · {item.type}</small>
                  </span>
                  {item.id === siteId && <span className="trip-site-list__check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <button className="trip-primary" type="button" onClick={startTrip}>Zahájit pracovní cestu</button>
        </div>
      )}

      {phase === 'starting' && (
        <div className="trip-card">
          <div className="trip-kicker">Výjezd</div>
          <h2>Zahájení pracovní cesty</h2>
          <ol className="trip-steps" aria-live="polite">
            {START_STEPS.slice(0, Math.min(completedSteps + 1, START_STEPS.length)).map(([pending, done], index) => (
              <li key={pending}>
                <span className={`trip-step-icon ${index < completedSteps ? 'is-done' : 'is-loading'}`}>{index < completedSteps ? '✓' : '…'}</span>
                <span>{pending}{index < completedSteps ? '' : '…'}</span>
                {index < completedSteps && <strong>{index === 0 ? gpsStepStatus : done}</strong>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === 'active' && (
        <div className="trip-flow">
          <div className="trip-card trip-card--active">
            <div className="trip-status"><span /> Probíhá</div>
            <div className="trip-arrival">
              <span>Očekávaný příjezd</span>
              <strong>{expectedArrival(DEPARTURE_TIME, routeDurationMin)}</strong>
            </div>
            <dl className="trip-details">
              <DetailRow label="Cíl" value={site.name} />
              <DetailRow label="Start" value={departureAddress} />
              <DetailRow label="Vzdálenost" value={routeDistanceKm !== null ? `${routeDistanceKm} km` : 'Počítám…'} />
              <DetailRow label="Doba jízdy" value={routeDurationMin !== null ? `${routeDurationMin} min` : 'Počítám…'} />
              <DetailRow label="Odjezd" value={DEPARTURE_TIME} />
            </dl>
            <div className={`trip-map-shell ${mapExpanded ? 'is-fullscreen' : ''}`}>
              <div className="trip-map trip-map--active" ref={mapContainerRef} aria-label="Vypočítaná trasa cesty" />
              <button
                className="trip-map-expand"
                type="button"
                onClick={() => setMapExpanded((expanded) => !expanded)}
                aria-label={mapExpanded ? 'Zavřít mapu přes celou obrazovku' : 'Zobrazit mapu přes celou obrazovku'}
              >
                <span className="material-symbols-outlined">{mapExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
              </button>
            </div>
            <div className="trip-route-status" aria-live="polite">
              <span className="trip-route-status__line" />
              {routeStatus === 'loading' && 'Počítám trasu…'}
              {routeStatus === 'ready' && `${routeDistanceKm} km · přibližně ${routeDurationMin} min`}
              {routeStatus === 'error' && 'Trasu se nepodařilo načíst'}
            </div>
            <p className="trip-copy">Cesta je aktivní. Po příjezdu zaznamenejte ukončení pracovní cesty.</p>
          </div>
          <button className="trip-secondary" type="button" onClick={cancelTrip}>Zrušit jízdu</button>
        </div>
      )}
    </section>
  );
}
