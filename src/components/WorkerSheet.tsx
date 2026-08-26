import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { workerDetails } from '../data/mockData';

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function WorkerSheet() {
  const selectedWorker = useAppStore((s) => s.selectedWorker);
  const selectWorker = useAppStore((s) => s.selectWorker);
  const setFocusedWorkerKey = useAppStore((s) => s.setFocusedWorkerKey);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const info = selectedWorker ? workerDetails[selectedWorker] : undefined;

  useEffect(() => {
    if (selectedWorker) {
      setIsCollapsed(false);
    }
  }, [selectedWorker]);

  if (!selectedWorker) return null;

  return (
    <div className={`worker-sheet open ${isCollapsed ? 'is-collapsed' : ''}`}>
      <button
        type="button"
        className="sheet-toggle"
        onClick={() => setIsCollapsed((v) => !v)}
        aria-label={isCollapsed ? 'Rozbalit detail pracovníka' : 'Sbalit detail pracovníka'}
      >
        <div className="sheet-handle" />
      </button>

      <button
        className="sheet-close"
        onClick={() => {
          selectWorker(null);
          setFocusedWorkerKey(null);
        }}
        aria-label="Zavřít detail pracovníka"
      >
        ✕
      </button>

      <div className="sheet-top">
        <span className="sheet-avatar">
          {initialsFor(selectedWorker)}
        </span>

        <div>
          <strong>{selectedWorker}</strong>
          <span className="mono muted">
            {info ? `${info.z} · ${info.cat}` : '—'}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="sheet-row">
            <span>Stavba</span>
            <span>{info?.site ?? '—'}</span>
          </div>

          <div className="sheet-row">
            <span>Metoda</span>
            <span>{info?.method ?? '—'}</span>
          </div>

          <div className="sheet-row">
            <span>Příchod</span>
            <span className="mono">{info?.time ?? '—'}</span>
          </div>

          <div className="sheet-row">
            <span>Trust</span>
            <span className="mono">{info?.trust ?? '—'}</span>
          </div>

          <div className="sheet-row">
            <span>Incident</span>
            <span>
              {info?.incident === 'alcohol'
                ? `Alkohol ${info.alcoholPromile ?? '—'} ‰`
                : info?.incident === 'late'
                  ? `Pozdní příchod ${info.lateMinutes ?? '—'} min`
                  : 'Bez incidentu'}
            </span>
          </div>

          <div className="sheet-actions">
            <button className="clock-btn start" type="button">
              <span className="material-symbols-outlined">call</span>
              Zavolat
            </button>

            <button className="secondary-btn" type="button">
              <span className="material-symbols-outlined">sms</span>
              Zpráva
            </button>
          </div>
        </>
      )}
    </div>
  );
}