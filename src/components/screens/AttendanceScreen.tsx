import { useState } from 'react';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { sites, travelRoutes, weekRows } from '../../data/mockData';
import { ShiftCard } from '../ShiftCard';

export function AttendanceScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const manualPanelOpen = useAppStore((s) => s.manualPanelOpen);
  const toggleManualPanel = useAppStore((s) => s.toggleManualPanel);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const routeMapRef = useRef<L.Map | null>(null);
  const routeMapContainerRef = useRef<HTMLDivElement>(null);
  const selectedDay = weekRows.find((row) => row.date === selectedDate);
  const selectedRoutes = travelRoutes.filter((route) => route.date === selectedDate);
  const selectedRoute = selectedRoutes.find((route) => route.id === selectedRouteId) ?? null;

  useEffect(() => {
    if (!selectedRoute || !routeMapContainerRef.current) return;

    const origin = selectedRoute.from.startsWith('Konská')
      ? [49.6865626, 18.6346325] as [number, number]
      : (() => {
          const item = sites.find((site) => site.name === selectedRoute.from);
          return item ? [item.lat, item.lng] as [number, number] : null;
        })();
    const destination = selectedRoute.to.startsWith('Konská')
      ? [49.6865626, 18.6346325] as [number, number]
      : (() => {
          const item = sites.find((site) => site.name === selectedRoute.to);
          return item ? [item.lat, item.lng] as [number, number] : null;
        })();

    if (!origin || !destination) return;

    const map = L.map(routeMapContainerRef.current, { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const bounds = L.latLngBounds([origin, destination]);
    map.fitBounds(bounds.pad(0.2), { padding: [20, 20] });
    L.circleMarker(origin, { radius: 7, color: '#fff', weight: 2, fillColor: '#2e7d5b', fillOpacity: 1 }).addTo(map);
    L.circleMarker(destination, { radius: 7, color: '#fff', weight: 2, fillColor: '#d9931f', fillOpacity: 1 }).addTo(map);

    let cancelled = false;
    fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`)
      .then((response) => {
        if (!response.ok) throw new Error('OSRM request failed');
        return response.json() as Promise<{ routes?: { geometry?: { coordinates: [number, number][] } }[] }>;
      })
      .then((data) => {
        const coordinates = data.routes?.[0]?.geometry?.coordinates;
        if (cancelled || !coordinates) return;
        const route = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        L.polyline(route, { color: '#3f5d74', weight: 5, opacity: 0.9 }).addTo(map);
        map.fitBounds(L.latLngBounds(route), { padding: [20, 20] });
      })
      .catch(() => undefined);

    routeMapRef.current = map;
    return () => {
      cancelled = true;
      map.remove();
      routeMapRef.current = null;
    };
  }, [selectedRoute]);

  return (
    <section
      className={`screen ${activeScreen === 'attendance' ? 'active' : ''}`}
      id="screen-attendance"
    >
      <ShiftCard large />

      <button className="secondary-btn" onClick={toggleManualPanel}>
        <span className="material-symbols-outlined">person_add</span>
        Zapsat příchod pracovníka
      </button>

      <div className={`manual-panel ${manualPanelOpen ? 'open' : ''}`}>
        <p>
          Rychlý ruční zápis docházky za pracovníka bez karty nebo s nefunkčním
          terminálem — např. při zapomenutém odznaku. Záznam se označí jako{' '}
          <span className="mono">metoda: manuál</span>, aby zůstal auditovatelný
          stejně jako ostatní příchody.
        </p>
      </div>

      {selectedDay ? (
        <div className="attendance-day-detail">
          <button className="attendance-back" type="button" onClick={() => setSelectedDate(null)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Zpět na týden
          </button>
          <div className="attendance-detail-heading">
            <div>
              <span className="section-label">Detail dne</span>
              <h3>{selectedDay.day} {selectedDay.date}</h3>
            </div>
            <span className="attendance-detail-hours">{selectedDay.hours}</span>
          </div>
          <div className="attendance-route-summary">
            <span className="material-symbols-outlined">route</span>
            <div>
              <strong>{selectedRoutes.length} {selectedRoutes.length === 1 ? 'trasa' : 'trasy'}</strong>
              <span>Historie pohybu stavbyvedoucího</span>
            </div>
          </div>
          <div className="attendance-route-list">
            {selectedRoutes.map((route) => (
              <div className="attendance-route" key={route.id}>
                <div className="attendance-route-time">
                  <strong>{route.departure}</strong>
                  <span>{route.arrival}</span>
                </div>
                <div className="attendance-route-line"><span /></div>
                <div className="attendance-route-info">
                  <strong>{route.from}</strong>
                  <span>{route.to}</span>
                  <small>{route.distanceKm} km · {route.durationMin} min</small>
                </div>
                <button className="attendance-route-map-button" type="button" onClick={() => setSelectedRouteId(route.id)}>
                  <span className="material-symbols-outlined">map</span>
                  Mapa trasy
                </button>
              </div>
            ))}
            {selectedRoutes.length === 0 && <p className="attendance-no-routes">Pro tento den není zaznamenaná žádná trasa.</p>}
          </div>
          {selectedRoute && (
            <div className="attendance-route-map-card">
              <div className="attendance-route-map-heading">
                <div>
                  <span className="section-label">Trasa na mapě</span>
                  <strong>{selectedRoute.from} → {selectedRoute.to}</strong>
                </div>
                <button type="button" onClick={() => setSelectedRouteId(null)} aria-label="Zavřít mapu trasy">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="attendance-route-map" ref={routeMapContainerRef} aria-label={`Mapa trasy ${selectedRoute.from} do ${selectedRoute.to}`} />
            </div>
          )}
        </div>
      ) : (
        <>
      <div className="section-label">Tento týden</div>

      <div className="week-list">
        {weekRows.map((row) => (
          <button key={row.date} type="button" onClick={() => setSelectedDate(row.date)} className={`week-row ${row.isToday ? 'today' : ''}`}>
            <div className="week-day">
              <strong>{row.day}</strong>
              <span>{row.date}</span>
            </div>

            <div className="week-times">
              <span>{row.checkIn}</span>
              <span className="out">{row.checkOut}</span>
            </div>

            <span className="hours">{row.hours}</span>
            <span className="week-row-arrow material-symbols-outlined">chevron_right</span>
          </button>
        ))}
      </div>
        </>
      )}
    </section>
  );
}
