import { useAppStore } from '../store/useAppStore';
import { screenTitles } from '../data/mockData';

export function AppHeader() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const workerMode = useAppStore((s) => s.workerMode);
  const setWorkerMode = useAppStore((s) => s.setWorkerMode);
  const unresolvedCount = useAppStore((s) => s.unresolvedCount());

  return (
    <div className="app-header">
      <div className="brand-lockup">
        <div className="brand-lockup__tag">
          <span className="brand-lockup__build">BUILD</span>
          <span className="brand-lockup__name">
            SYN
            <span className="brand-lockup__grid" aria-hidden="true">
              {[1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1].map((on, i) => (
                <span key={i} className={on ? 'brand-lockup__grid-cell' : ''} />
              ))}
            </span>
            RGY
            <span className="brand-lockup__registered">®</span>
          </span>
        </div>
      </div>

      <h2>{screenTitles[activeScreen]}</h2>

      <div className="header-right">
        <span className="sync-chip">
          <span className="sync-dot" />
          Online
        </span>

        <button
          className="profile-btn"
          onClick={() => {
            if (workerMode) {
              setWorkerMode(false);
              setActiveScreen('home');
              return;
            }

            setWorkerMode(true);
            setActiveScreen('home');
          }}
          aria-label="Profil dělníka"
          title="Profil dělníka"
        >
          <span className="material-symbols-outlined">person</span>
        </button>

        {!workerMode && (
          <button className="bell-btn" onClick={() => setActiveScreen('notifications')}>
            <span className="material-symbols-outlined">notifications</span>
            {unresolvedCount > 0 && <span className="badge-count">{unresolvedCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
