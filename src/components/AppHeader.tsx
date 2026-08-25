import { useAppStore } from '../store/useAppStore';
import { screenTitles } from '../data/mockData';

export function AppHeader() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const unresolvedCount = useAppStore((s) => s.unresolvedCount());

  return (
    <div className="app-header">
      <div className="brandmark">
        <span>TS</span>
      </div>

      <h2>{screenTitles[activeScreen]}</h2>

      <div className="header-right">
        <span className="sync-chip">
          <span className="sync-dot" />
          Online
        </span>

        <button className="bell-btn" onClick={() => setActiveScreen('notifications')}>
          <span className="material-symbols-outlined">notifications</span>
          {unresolvedCount > 0 && <span className="badge-count">{unresolvedCount}</span>}
        </button>
      </div>
    </div>
  );
}
