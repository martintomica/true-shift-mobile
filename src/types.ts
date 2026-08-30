export type ScreenName = 'home' | 'attendance' | 'trip' | 'map' | 'notifications';

export type WorkerStatus = 'green' | 'red' | 'clay' | 'gray';

export interface Site {
  id: string;
  name: string;
  code: string;
  type: string;
  lat: number;
  lng: number;
  radius: number;
  present: number;
  total: number;
  flags: number;
}

export interface Worker {
  name: string;
  lat: number;
  lng: number;
  status: WorkerStatus;
}

export type WorkerIncident = 'none' | 'late' | 'alcohol';

export type WorkerDetail = {
  z: string;
  cat: string;
  site: string;
  method: string;
  time: string;
  trust: string;
  incident?: WorkerIncident;
  lateMinutes?: number;
  alcoholPromile?: number;
  vacationDaysUsed?: number;
  vacationDaysTotal?: number;
};

export type NotifKind = 'urgent' | 'review' | 'info' | 'success';

export interface NotifAction {
  label: string;
  primary?: boolean;
  icon?: string;
  /** Whether tapping this action resolves (dismisses) the notification. Defaults to true. */
  resolves?: boolean;
}

export interface Notification {
  id: string;
  kind: NotifKind;
  icon: string;
  title: string;
  meta: string;
  detail?: string;
  actions?: NotifAction[];
  resolved: boolean;
  section: 'today' | 'earlier';
  targetSiteId?: string;
  targetWorkerName?: string;
}

export interface WeekRow {
  day: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  isToday?: boolean;
}

export interface TravelRoute {
  id: string;
  date: string;
  departure: string;
  arrival: string;
  from: string;
  to: string;
  distanceKm: string;
  durationMin: number;
}
