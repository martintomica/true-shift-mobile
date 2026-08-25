import { useAppStore } from '../store/useAppStore';

export function Toast() {
  const toastVisible = useAppStore((s) => s.toastVisible);

  return (
    <div className={`toast ${toastVisible ? 'show' : ''}`}>
      Nahlášení incidentu by zde otevřelo krátký formulář s fotkou a polohou — vždy
      dostupné, i mimo hlavní obrazovky.
    </div>
  );
}
