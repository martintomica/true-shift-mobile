import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatElapsed } from '../hooks/useShiftTimer';

interface ShiftCardProps {
  /** Large variant used on the Attendance screen. */
  large?: boolean;
}

export function ShiftCard({ large }: ShiftCardProps) {
  const shiftActive = useAppStore((s) => s.shiftActive);
  const elapsedSeconds = useAppStore((s) => s.elapsedSeconds);
  const toggleShift = useAppStore((s) => s.toggleShift);
  const [faceScanning, setFaceScanning] = useState(false);
  const faceScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (faceScanTimer.current) clearTimeout(faceScanTimer.current);
  }, []);

  function handleShiftToggle() {
    if (shiftActive) {
      toggleShift();
      return;
    }

    setFaceScanning(true);
    faceScanTimer.current = setTimeout(() => {
      toggleShift();
      setFaceScanning(false);
    }, 1200);
  }

  return (
    <div
      className={`clock-card chamfer ${large ? 'lg' : ''} ${shiftActive ? '' : 'off'}`}
    >
      <div className="clock-top">
        <span className={`status-dot ${shiftActive ? '' : 'off'}`} />
        <span className="clock-status">
          {shiftActive ? 'Na směně · Hala Vítkovice' : 'Mimo směnu'}
        </span>
      </div>

      <div className="clock-timer">{formatElapsed(elapsedSeconds)}</div>

      <div className="clock-meta">
        {shiftActive && (
          <span className="gps-chip">
            <span className="material-symbols-outlined">my_location</span>
            V areálu stavby
          </span>
        )}

        <button
          className={`clock-btn ${shiftActive ? 'end' : 'start'}`}
          onClick={handleShiftToggle}
          disabled={faceScanning}
          aria-busy={faceScanning}
        >
          {shiftActive ? 'Ukončit směnu' : faceScanning ? 'Ověřuji...' : 'Zahájit směnu'}
        </button>
      </div>

      {faceScanning && (
        <div className="faceid-overlay" role="status" aria-live="polite">
          <div className="faceid-frame">
            <span className="material-symbols-outlined">face</span>
            <span className="faceid-scan-line" />
          </div>
          <strong>Ověřuji obličej</strong>
          <span>Podívejte se na obrazovku</span>
        </div>
      )}
    </div>
  );
}
