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
          onClick={toggleShift}
        >
          {shiftActive ? 'Ukončit směnu' : 'Zahájit směnu'}
        </button>
      </div>
    </div>
  );
}
