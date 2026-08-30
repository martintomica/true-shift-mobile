import { useAppStore } from '../../store/useAppStore';
import { sites, workerDetails } from '../../data/mockData';
import { ShiftCard } from '../ShiftCard';

function formatShiftTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function HomeScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const notifications = useAppStore((s) => s.notifications);
  const focusSite = useAppStore((s) => s.focusSite);
  const workerMode = useAppStore((s) => s.workerMode);
  const elapsedSeconds = useAppStore((s) => s.elapsedSeconds);

  const totalPresent = sites.reduce((sum, s) => sum + s.present, 0);
  const totalWorkers = sites.reduce((sum, s) => sum + s.total, 0);
  const totalFlags = sites.reduce((sum, s) => sum + s.flags, 0);

  const recentNotifications = notifications
    .filter((n) => n.section === 'today')
    .slice(0, 2);

  if (workerMode) {
    const workerDetail = workerDetails['Petr Malý'];
    const vacationRemaining = workerDetail?.vacationDaysTotal
      ? workerDetail.vacationDaysTotal - (workerDetail.vacationDaysUsed || 0)
      : 0;

    return (
      <section className={`screen ${activeScreen === 'home' ? 'active' : ''}`} id="screen-home">
        <div className="greet">
          <span className="eyebrow">Dělník · Hala Vítkovice</span>
          <h1>Dobré ráno, Petře</h1>
        </div>

        <ShiftCard />

        <div className="stat-row">
          <div className="stat-tile">
            <span className="material-symbols-outlined">schedule</span>
            <strong>{formatShiftTime(elapsedSeconds)}</strong>
            <span>čas na směně</span>
          </div>

          <div className="stat-tile">
            <span className="material-symbols-outlined">calendar_month</span>
            <strong>{vacationRemaining}</strong>
            <span>dní dovolené</span>
          </div>

          <div className="stat-tile">
            <span className="material-symbols-outlined">wb_cloudy</span>
            <strong>18 °C</strong>
            <span>Vítkovice, oblačno</span>
          </div>
        </div>

        <div className="section-label">Moje plánování</div>

        <div className="worker-plan-list">
          <div className="worker-plan-item">
            <span className="material-symbols-outlined">location_on</span>
            <div>
              <strong>Stavba dnes</strong>
              <small>Hala Vítkovice · příchod ve 06:30</small>
            </div>
          </div>

          <div className="worker-plan-item">
            <span className="material-symbols-outlined">check_circle</span>
            <div>
              <strong>Docházka</strong>
              <small>Opraveno: 98 % za tento měsíc</small>
            </div>
          </div>

          <div className="worker-plan-item">
            <span className="material-symbols-outlined">directions_car</span>
            <div>
              <strong>Výjezd</strong>
              <small>Naplánováno na středu 09:00</small>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`screen ${activeScreen === 'home' ? 'active' : ''}`} id="screen-home">
      <div className="greet">
        <span className="eyebrow">Stavbyvedoucí · {sites.length} stavby</span>
        <h1>Dobré ráno, Petře</h1>
      </div>

      <ShiftCard />

      <div className="stat-row">
        <div className="stat-tile">
          <span className="material-symbols-outlined">groups</span>
          <strong>
            {totalPresent} / {totalWorkers}
          </strong>
          <span>přítomno dnes</span>
        </div>

        <div className="stat-tile flagged">
          <span className="material-symbols-outlined">flag</span>
          <strong>{totalFlags}</strong>
          <span>anomálie k řešení</span>
        </div>

        <div className="stat-tile">
          <span className="material-symbols-outlined">wb_cloudy</span>
          <strong>18 °C</strong>
          <span>Vítkovice, oblačno</span>
        </div>
      </div>

      <div className="section-label">Moje stavby</div>

      <div className="site-scroll">
        {sites.map((site) => (
          <div
            key={site.id}
            className="site-card"
            onClick={() => {
            focusSite(site.id);
            setActiveScreen('map');
          }}
          >
            <div className="site-card-top">
              <strong>{site.name}</strong>
              <span className="mono muted" style={{ fontSize: '10.5px' }}>
                {site.code}
              </span>
            </div>

            <span className="type">{site.type}</span>

            <div className="presence-bar">
              <div
                className="presence-fill"
                style={{ width: `${Math.round((site.present / site.total) * 100)}%` }}
              />
            </div>

            <div className="site-card-bottom">
              <span className="mono" style={{ fontSize: '12px' }}>
                {site.present} / {site.total}
              </span>
              {site.flags > 0 && (
                <span className="flag-chip">
                  {site.flags}
                  <span className="material-symbols-outlined">flag</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section-label-row">
        <span className="section-label">Poslední oznámení</span>
        <a onClick={() => setActiveScreen('notifications')}>Zobrazit vše →</a>
      </div>

      <div className="notif-list">
        {recentNotifications.map((n) => (
          <div key={n.id} className={`notif-card ${n.kind} compact`}>
            <span className="material-symbols-outlined notif-icon">{n.icon}</span>
            <div className="notif-body">
              <span className="notif-title">{n.title}</span>
              <span className="notif-meta">{n.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
