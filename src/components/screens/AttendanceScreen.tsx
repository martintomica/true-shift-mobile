import { useAppStore } from '../../store/useAppStore';
import { weekRows } from '../../data/mockData';
import { ShiftCard } from '../ShiftCard';

export function AttendanceScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const manualPanelOpen = useAppStore((s) => s.manualPanelOpen);
  const toggleManualPanel = useAppStore((s) => s.toggleManualPanel);

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

      <div className="section-label">Tento týden</div>

      <div className="week-list">
        {weekRows.map((row) => (
          <div key={row.date} className={`week-row ${row.isToday ? 'today' : ''}`}>
            <div className="week-day">
              <strong>{row.day}</strong>
              <span>{row.date}</span>
            </div>

            <div className="week-times">
              <span>{row.checkIn}</span>
              <span className="out">{row.checkOut}</span>
            </div>

            <span className="hours">{row.hours}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
