import { useAppStore } from '../store/useAppStore';
import type { ScreenName } from '../types';

const TABS: { screen: ScreenName; icon: string; label: string; showBadge?: boolean; action?: boolean }[] = [
  { screen: 'home', icon: 'space_dashboard', label: 'Přehled' },
  { screen: 'attendance', icon: 'schedule', label: 'Docházka' },
  { screen: 'trip', icon: 'directions_car', label: 'Výjezd', action: true },
  { screen: 'map', icon: 'map', label: 'Mapa' },
  { screen: 'notifications', icon: 'notifications', label: 'Oznámení', showBadge: true },
];

export function TabBar() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const workerMode = useAppStore((s) => s.workerMode);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const unresolvedCount = useAppStore((s) => s.unresolvedCount());

  const tabs = workerMode
    ? TABS.filter((tab) => tab.screen === 'home' || tab.screen === 'attendance')
    : TABS;

  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={`${tab.screen}-${tab.label}`}
          className={`tab ${tab.action ? 'tab--departure' : ''} ${!tab.action && activeScreen === tab.screen ? 'active' : ''}`}
          onClick={() => setActiveScreen(tab.screen)}
        >
          <span className="bar" />
          <span className={tab.action ? 'tab-departure-icon' : ''}>
            <span className="material-symbols-outlined">{tab.icon}</span>
          </span>
          {tab.label}
          {tab.showBadge && unresolvedCount > 0 && (
            <span className="badge-count">{unresolvedCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
