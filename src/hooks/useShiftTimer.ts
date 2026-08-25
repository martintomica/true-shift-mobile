import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** Ticks the shift timer once a second, matching the original setInterval. */
export function useShiftTimer() {
  const tickShift = useAppStore((s) => s.tickShift);

  useEffect(() => {
    const id = setInterval(tickShift, 1000);
    return () => clearInterval(id);
  }, [tickShift]);
}

/** Formats elapsed seconds as HH:MM:SS. */
export function formatElapsed(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
