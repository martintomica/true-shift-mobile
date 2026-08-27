import { create } from 'zustand';
import type { ScreenName, Notification } from '../types';
import { initialNotifications } from '../data/mockData';

interface AppState {
  // navigation
  activeScreen: ScreenName;
  setActiveScreen: (screen: ScreenName) => void;

  // shift clock
  shiftActive: boolean;
  elapsedSeconds: number;
  toggleShift: () => void;
  tickShift: () => void;

  // notifications
  notifications: Notification[];
  resolveNotification: (id: string) => void;
  unresolvedCount: () => number;

  // attendance screen
  manualPanelOpen: boolean;
  toggleManualPanel: () => void;

  // map screen
  selectedWorker: string | null;
  selectWorker: (name: string | null) => void;

  // map focus
  focusedSiteId: string | null;
  focusedWorkerName: string | null;
  focusRequestId: number;
  focusSite: (siteId: string) => void;
  focusWorker: (siteId: string, workerName: string) => void;

  // toast
  toastVisible: boolean;
  showToast: () => void;
  hideToast: () => void;

  //focus Worker
  focusedWorkerKey: string | null;
  setFocusedWorkerKey: (key: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeScreen: 'home',
  setActiveScreen: (screen) => set({ activeScreen: screen, selectedWorker: null }),

  shiftActive: true,
  elapsedSeconds: 6 * 3600 + 24 * 60 + 12,
  toggleShift: () => set((s) => ({ shiftActive: !s.shiftActive })),
  tickShift: () =>
    set((s) => (s.shiftActive ? { elapsedSeconds: s.elapsedSeconds + 1 } : {})),

  notifications: initialNotifications,
  resolveNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, resolved: true } : n
      ),
    })),
  unresolvedCount: () =>
    get().notifications.filter((n) => !n.resolved && n.actions?.length).length,

  manualPanelOpen: false,
  toggleManualPanel: () => set((s) => ({ manualPanelOpen: !s.manualPanelOpen })),

  selectedWorker: null,
  selectWorker: (name) => set({ selectedWorker: name }),

  focusedSiteId: null,
  focusedWorkerName: null,
  focusRequestId: 0,
  focusSite: (siteId) =>
    set((s) => ({ focusedSiteId: siteId, focusedWorkerName: null, focusRequestId: s.focusRequestId + 1 })),
  focusWorker: (siteId, workerName) =>
    set((s) => ({ focusedSiteId: siteId, focusedWorkerName: workerName, focusRequestId: s.focusRequestId + 1 })),

  toastVisible: false,
  showToast: () => set({ toastVisible: true }),
  hideToast: () => set({ toastVisible: false }),

  focusedWorkerKey: null,
  setFocusedWorkerKey: (key) => set({ focusedWorkerKey: key })
}));
