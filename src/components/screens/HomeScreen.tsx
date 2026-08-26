import { useAppStore } from '../../store/useAppStore';
import { sites } from '../../data/mockData';
import { ShiftCard } from '../ShiftCard';

export function HomeScreen() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const notifications = useAppStore((s) => s.notifications);
  const focusSite = useAppStore((s) => s.focusSite);

  const totalPresent = sites.reduce((sum, s) => sum + s.present, 0);
  const totalWorkers = sites.reduce((sum, s) => sum + s.total, 0);
  const totalFlags = sites.reduce((sum, s) => sum + s.flags, 0);

  const recentNotifications = notifications
    .filter((n) => n.section === 'today')
    .slice(0, 2);

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
