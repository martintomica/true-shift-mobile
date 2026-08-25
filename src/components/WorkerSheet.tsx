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

  const info = selectedWorker ? workerDetails[selectedWorker] : undefined;

  return (
    <div className={`worker-sheet ${selectedWorker ? 'open' : ''}`}>
      <div className="sheet-handle" />

      <button className="sheet-close" onClick={() => selectWorker(null)}>
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="sheet-top">
        <span className="sheet-avatar">
          {selectedWorker ? initialsFor(selectedWorker) : ''}
        </span>

        <div>
          <strong>{selectedWorker ?? ''}</strong>
          <span className="mono muted" style={{ fontSize: '11.5px' }}>
            {info ? `${info.z} · ${info.cat}` : '—'}
          </span>
        </div>
      </div>

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

      <div className="sheet-actions">
        <button className="clock-btn start">
          <span className="material-symbols-outlined">call</span>
          Zavolat
        </button>

        <button className="secondary-btn">
          <span className="material-symbols-outlined">sms</span>
          Zpráva
        </button>
      </div>
    </div>
  );
}
