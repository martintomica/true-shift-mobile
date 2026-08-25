import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useShiftTimer } from './hooks/useShiftTimer';
import { StatusBar } from './components/StatusBar';
import { AppHeader } from './components/AppHeader';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { HomeScreen } from './components/screens/HomeScreen';
import { AttendanceScreen } from './components/screens/AttendanceScreen';
import { MapScreen } from './components/screens/MapScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';

export default function App() {
  useShiftTimer();

  const showToast = useAppStore((s) => s.showToast);
  const hideToast = useAppStore((s) => s.hideToast);
  const toastVisible = useAppStore((s) => s.toastVisible);

  // Auto-hide the incident toast after a few seconds, like the original setTimeout.
  useEffect(() => {
    if (!toastVisible) return;
    const id = setTimeout(hideToast, 2800);
    return () => clearTimeout(id);
  }, [toastVisible, hideToast]);

  return (
    <div className="app-root">
      <div className="phone">
        <StatusBar />
        <AppHeader />

        <main className="screens">
          <HomeScreen />
          <AttendanceScreen />
          <MapScreen />
          <NotificationsScreen />
        </main>

        <button className="fab chamfer-sm" onClick={showToast} title="Nahlásit incident">
          <span className="material-symbols-outlined">report</span>
        </button>

        <Toast />
        <TabBar />
      </div>
    </div>
  );
}
