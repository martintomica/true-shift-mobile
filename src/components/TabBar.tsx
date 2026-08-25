import { useAppStore } from '../store/useAppStore';
import type { ScreenName } from '../types';

const TABS: { screen: ScreenName; icon: string; label: string; showBadge?: boolean }[] = [
  { screen: 'home', icon: 'space_dashboard', label: 'Přehled' },
  { screen: 'attendance', icon: 'schedule', label: 'Docházka' },
  { screen: 'map', icon: 'map', label: 'Mapa' },
  { screen: 'notifications', icon: 'notifications', label: 'Oznámení', showBadge: true },
];

export function TabBar() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const unresolvedCount = useAppStore((s) => s.unresolvedCount());

  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.screen}
          className={`tab ${activeScreen === tab.screen ? 'active' : ''}`}
          onClick={() => setActiveScreen(tab.screen)}
        >
          <span className="bar" />
          <span className="material-symbols-outlined">{tab.icon}</span>
          {tab.label}
          {tab.showBadge && unresolvedCount > 0 && (
            <span className="badge-count">{unresolvedCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
