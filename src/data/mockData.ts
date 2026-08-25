import type {
  Site,
  Worker,
  WorkerDetail,
  Notification,
  WeekRow,
} from '../types';

export const sites: Site[] = [
  {
    id: 'ST-021',
    name: 'Hala Vítkovice',
    code: 'ST-021',
    type: 'Průmyslová hala',
    lat: 49.8209,
    lng: 18.2625,
    radius: 220,
    present: 51,
    total: 62,
    flags: 3,
  },
  {
    id: 'ST-014',
    name: 'Rezidence Vinohrady',
    code: 'ST-014',
    type: 'Bytový dům',
    lat: 49.8347,
    lng: 18.3035,
    radius: 170,
    present: 38,
    total: 46,
    flags: 1,
  },
];

export const workers: Worker[] = [
  { name: 'Karel Procházka', lat: 49.8215, lng: 18.2618, status: 'green' },
  { name: 'Lukáš Beneš', lat: 49.8204, lng: 18.2631, status: 'green' },
  { name: 'Jan Dvořák', lat: 49.822, lng: 18.2622, status: 'red' },
];

export const workerDetails: Record<string, WorkerDetail> = {
  'Karel Procházka': {
    z: 'Z1021',
    cat: 'Stavbyvedoucí',
    site: 'Hala Vítkovice',
    method: 'Face recognition',
    time: '06:48',
    trust: '96',
  },
  'Lukáš Beneš': {
    z: 'Z1042',
    cat: 'Dělník',
    site: 'Hala Vítkovice',
    method: 'Face recognition',
    time: '06:51',
    trust: '94',
  },
  'Jan Dvořák': {
    z: 'Z1013',
    cat: 'Řidič',
    site: 'Hala Vítkovice',
    method: 'QR',
    time: '06:52',
    trust: '31',
  },
};

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    kind: 'urgent',
    icon: 'warning',
    title: 'Dechová zkouška — pozitivní',
    meta: 'Jan Dvořák · Z1013 · Hala Vítkovice · 06:52',
    detail:
      'Naměřeno 0,3 ‰ při příchodu na terminál. Pracovník byl vpuštěn na stavbu, případ vyžaduje okamžité řešení.',
    actions: [
      { label: 'Poslat domů', primary: true },
      { label: 'Zavolat', icon: 'call', resolves: false },
      { label: 'Vyřešeno' },
    ],
    resolved: false,
    section: 'today',
  },
  {
    id: 'n2',
    kind: 'review',
    icon: 'schedule',
    title: 'Zpoždění 22 min + náhradní metoda',
    meta: 'Petr Malý · Z1067 · Rezidence Vinohrady · 07:34',
    detail:
      'Nad toleranci 10 min. Rozpoznání tváře selhalo 2×, použita karta + PIN — příchod povolen.',
    actions: [
      { label: 'Schválit', primary: true },
      { label: 'Zamítnout' },
    ],
    resolved: false,
    section: 'today',
  },
  {
    id: 'n3',
    kind: 'info',
    icon: 'cloud_off',
    title: 'Terminál Hala Vítkovice — slabé spojení',
    meta: 'Včera · 18:12',
    detail: 'Data mohou být stará až 11 minut. Zobrazuje se poslední známá hodnota.',
    resolved: false,
    section: 'earlier',
  },
  {
    id: 'n4',
    kind: 'success',
    icon: 'check_circle',
    title: '42 příchodů automaticky schváleno',
    meta: 'Včera · souhrn dne · trust > 90',
    resolved: false,
    section: 'earlier',
  },
];

export const weekRows: WeekRow[] = [
  { day: 'Po', date: '18. 8.', checkIn: '06:55', checkOut: '15:02', hours: '8,12 h' },
  { day: 'Út', date: '19. 8.', checkIn: '06:58', checkOut: '15:07', hours: '8,15 h' },
  { day: 'St', date: '20. 8.', checkIn: '07:02', checkOut: '15:11', hours: '8,15 h' },
  { day: 'Čt', date: '21. 8.', checkIn: '06:50', checkOut: '17:20', hours: '10,50 h' },
  {
    day: 'Pá',
    date: '22. 8.',
    checkIn: '06:52',
    checkOut: '— probíhá',
    hours: '6,40 h',
    isToday: true,
  },
];

export const screenTitles: Record<string, string> = {
  home: 'Přehled',
  attendance: 'Docházka',
  map: 'Stavby a pracovníci',
  notifications: 'Oznámení',
};
