/**
 * Single source of all mock data for the app.
 * When adding or changing mock data, do it here so the rest of the app stays consistent.
 * When wiring backend APIs, replace consumers to use API calls and keep this file for fallback/dev.
 */

import dayjs from 'dayjs';
import type { CalendarEvent, ClientDetails, ClientSummary, ServiceOption } from './types';

// ---- Calendar events ----

function ev(
  id: string,
  title: string,
  date: dayjs.Dayjs,
  opts: {
    clientName?: string;
    service?: string;
    startH?: number;
    startM?: number;
    endH?: number;
    endM?: number;
    allDay?: boolean;
    color?: string;
    isParked?: boolean;
  }
): CalendarEvent {
  const {
    clientName,
    service,
    startH = 0,
    startM = 0,
    endH = 0,
    endM = 0,
    allDay = false,
    color = '#FA1BFE',
    isParked,
  } = opts;
  return {
    id,
    title,
    clientName,
    service,
    start: date.hour(startH).minute(startM).toDate(),
    end: date.hour(endH).minute(endM).toDate(),
    allDay,
    color,
    isParked,
  };
}

/** Event title = client name. clientName in ev() = service description on calendar. */
export const MOCK_EVENTS: CalendarEvent[] = [
  // Today – timed
  ev('ev-1', 'Sarah Johnson', dayjs(), {
    clientName: 'Balayage',
    service: 'Balayage',
    startH: 9,
    endH: 10,
    endM: 30,
    color: '#FA1BFE',
  }),
  ev('ev-2', 'Emma Williams', dayjs(), {
    clientName: 'Full color',
    service: 'Full color',
    startH: 11,
    endH: 12,
    color: '#25AFFF',
  }),
  ev('ev-3', 'Olivia Brown', dayjs(), {
    clientName: 'Foil highlights & Toner',
    service: 'Foil highlights',
    startH: 13,
    endH: 14,
    endM: 15,
    color: '#9DE684',
  }),
  ev('ev-4', 'Sophia Davis', dayjs(), {
    clientName: 'Haircut',
    service: 'Haircut',
    startH: 15,
    endH: 15,
    endM: 45,
    color: '#6C6C6C',
  }),
  ev('ev-5', 'Isabella Martinez', dayjs(), {
    clientName: 'Full balayage & style',
    service: 'Full balayage',
    startH: 16,
    endH: 18,
    color: '#FA1BFE',
  }),
  // Today – all-day
  ev('ev-6', 'Claire Mills', dayjs(), { allDay: true, color: '#FF7701' }),
  ev('ev-7', 'Joshua Mitchell', dayjs(), { allDay: true, color: '#FF7701' }),
  ev('ev-8', 'Nita Haredoo', dayjs(), { allDay: true, color: '#9DE684', isParked: true }),
  ev('ev-9', 'Amy Park', dayjs(), { allDay: true, color: '#FF7701' }),
  // Waitlist (all-day, not parked)
  {
    ...ev('ev-10', 'Ben Wu', dayjs(), { allDay: true, color: '#9DE684', service: 'Color' }),
    waitlistAddedAt: dayjs().subtract(2, 'hour').toDate().getTime(),
  },
  {
    ...ev('ev-w1', 'Chris Lee', dayjs(), { allDay: true, color: '#9DE684', service: 'Cut' }),
    waitlistAddedAt: dayjs().subtract(1, 'hour').toDate().getTime(),
  },
  {
    ...ev('ev-w2', 'Taylor Smith', dayjs(), { allDay: true, color: '#9DE684', service: 'Perm' }),
    waitlistAddedAt: dayjs().subtract(45, 'minute').toDate().getTime(),
  },
  {
    ...ev('ev-w3', 'Jordan Kim', dayjs(), { allDay: true, color: '#9DE684', service: 'Highlights' }),
    waitlistAddedAt: dayjs().subtract(30, 'minute').toDate().getTime(),
  },
  {
    ...ev('ev-w4', 'Sam Davis', dayjs(), { allDay: true, color: '#9DE684', service: 'Balayage' }),
    waitlistAddedAt: dayjs().subtract(15, 'minute').toDate().getTime(),
  },
  // Tomorrow
  ev('ev-11', 'Sarah Johnson', dayjs().add(1, 'day'), {
    clientName: 'Root touch-up',
    service: 'Root touch-up',
    startH: 10,
    endH: 11,
    color: '#25AFFF',
  }),
  ev('ev-12', 'Emma Williams', dayjs().add(1, 'day'), {
    clientName: 'Cut & style',
    service: 'Cut & style',
    startH: 14,
    endH: 15,
    color: '#FA1BFE',
  }),
  ev('ev-13', 'Alex Brown', dayjs().add(1, 'day'), { allDay: true, color: '#FF7701' }),
  // Yesterday
  ev('ev-14', 'Olivia Brown', dayjs().subtract(1, 'day'), {
    clientName: 'Toner',
    service: 'Toner',
    startH: 11,
    endH: 11,
    endM: 30,
    color: '#9DE684',
  }),
  ev('ev-15', 'Sophia Davis', dayjs().subtract(1, 'day'), { allDay: true, color: '#FF7701' }),
  // 2 days from now
  ev('ev-16', 'Isabella Martinez', dayjs().add(2, 'day'), {
    clientName: 'Bridal trial',
    service: 'Bridal trial',
    startH: 16,
    endH: 17,
    color: '#FA1BFE',
  }),
];

// ---- Services ----

export const SERVICE_CATEGORIES = [
  { id: 'hair', name: 'Hair' },
  { id: 'color', name: 'Color' },
  { id: 'nails', name: 'Nails' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'massage', name: 'Massage' },
  { id: 'other', name: 'Other' },
] as const;

export const CALENDAR_COLORS = [
  '#FF18EC',
  '#25AFFF',
  '#FF7701',
  '#9DE684',
  'rgba(108, 108, 108, 0.9)',
] as const;

export const MOCK_SERVICES: ServiceOption[] = [
  { id: 's1', name: 'Haircut', duration: 45, price: 55 },
  { id: 's2', name: 'Full color', duration: 90, price: 95 },
  { id: 's3', name: 'Balayage', duration: 180, price: 185 },
  { id: 's4', name: 'Blow dry', duration: 30, price: 45 },
  { id: 's5', name: 'Manicure', duration: 45, price: 35 },
  { id: 's6', name: 'Pedicure', duration: 60, price: 50 },
  { id: 's7', name: 'Facial', duration: 60, price: 85 },
  { id: 's8', name: 'Trim', duration: 15, price: 25 },
];

// ---- Work schedule (Mon–Sun) ----

export const MOCK_WORK_SCHEDULE = {
  mon: { available: true, startTime: '9:00 AM', endTime: '6:00 PM' },
  tue: { available: true, startTime: '9:00 AM', endTime: '6:00 PM' },
  wed: { available: true, startTime: '9:00 AM', endTime: '6:00 PM' },
  thu: { available: true, startTime: '9:00 AM', endTime: '6:00 PM' },
  fri: { available: true, startTime: '9:00 AM', endTime: '6:00 PM' },
  sat: { available: true, startTime: '10:00 AM', endTime: '4:00 PM' },
  sun: { available: false, startTime: '9:00 AM', endTime: '6:00 PM' },
} as const;

// ---- Clients ----

export const MOCK_CLIENTS: ClientSummary[] = [
  { id: '1', clientName: 'Sarah Johnson', lastVisit: new Date(2025, 1, 15) },
  { id: '2', clientName: 'Emma Williams', lastVisit: new Date(2025, 1, 14) },
  { id: '3', clientName: 'Olivia Brown', lastVisit: new Date(2025, 1, 12) },
  { id: '4', clientName: 'Sophia Davis', lastVisit: new Date(2025, 1, 10) },
  { id: '5', clientName: 'Isabella Martinez', lastVisit: new Date(2025, 1, 8) },
];

export const MOCK_CLIENT_DETAILS: Record<string, ClientDetails> = {
  '1': {
    id: '1',
    clientName: 'Sarah Johnson',
    phone: '541-556-6923',
    date: new Date(2025, 1, 15),
    duration: 90,
    techniqueNotes: ['Balayage highlights', 'Root touch-up'],
    personalNotes: 'Prefers cooler tones. Allergic to PPD.',
    services: [
      { id: 's1', name: 'Balayage', price: 185, completed: true },
      { id: 's2', name: 'Root touch-up', price: 75, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Deep conditioning treatment', price: 35 }],
    products: [
      { id: 'p1', name: 'Purple Shampoo', brand: 'Olaplex', price: 28 },
      { id: 'p2', name: 'No. 6 Bond Smoother', brand: 'Olaplex', price: 28 },
    ],
  },
  '2': {
    id: '2',
    clientName: 'Emma Williams',
    date: new Date(2025, 1, 14),
    duration: 60,
    techniqueNotes: ['Single process color'],
    personalNotes: 'Regular client, prefers natural look.',
    services: [
      { id: 's1', name: 'Full color', price: 95, completed: true },
      { id: 's2', name: 'Cut & style', price: 65, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Keratin treatment', price: 150 }],
    products: [
      { id: 'p1', name: 'Color Protect Shampoo', brand: 'Redken', price: 24 },
      { id: 'p2', name: 'Volume Injection', brand: 'Redken', price: 22 },
    ],
  },
  '3': {
    id: '3',
    clientName: 'Olivia Brown',
    date: new Date(2025, 1, 12),
    duration: 75,
    techniqueNotes: ['Highlights', 'Toner'],
    personalNotes: 'Sensitive scalp. Use gentle products.',
    services: [
      { id: 's1', name: 'Foil highlights', price: 165, completed: true },
      { id: 's2', name: 'Toner', price: 35, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Gloss treatment', price: 55 }],
    products: [
      { id: 'p1', name: 'Scalp serum', brand: 'Aveda', price: 32 },
      { id: 'p2', name: 'Damage Remedy', brand: 'Aveda', price: 34 },
    ],
  },
  '4': {
    id: '4',
    clientName: 'Sophia Davis',
    date: new Date(2025, 1, 10),
    duration: 45,
    techniqueNotes: ['Trim'],
    personalNotes: 'New client. Great conversation.',
    services: [
      { id: 's1', name: 'Haircut', price: 55, completed: true },
      { id: 's2', name: 'Blow dry', price: 35, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Balayage', price: 185 }],
    products: [
      { id: 'p1', name: 'Smooth Shampoo', brand: 'Redken', price: 20 },
      { id: 'p2', name: 'Smooth Conditioner', brand: 'Redken', price: 20 },
    ],
  },
  '5': {
    id: '5',
    clientName: 'Isabella Martinez',
    date: new Date(2025, 1, 8),
    duration: 120,
    techniqueNotes: ['Full balayage', 'Olaplex treatment'],
    personalNotes: 'Bridal prep. Wants volume for wedding.',
    services: [
      { id: 's1', name: 'Full balayage', price: 225, completed: true },
      { id: 's2', name: 'Olaplex No. 1 & 2', price: 45, completed: true },
    ],
    recommendations: [{ id: 'r1', name: 'Bridal trial', price: 85 }],
    products: [
      { id: 'p1', name: 'No. 3 Hair Perfector', brand: 'Olaplex', price: 28 },
      { id: 'p2', name: ' volumizing spray', brand: 'Living Proof', price: 26 },
    ],
  },
};
