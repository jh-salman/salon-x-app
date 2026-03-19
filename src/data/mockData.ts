/**
 * Single source of all mock data for the app.
 * When adding or changing mock data, do it here so the rest of the app stays consistent.
 * When wiring backend APIs, replace consumers to use API calls and keep this file for fallback/dev.
 */

import type {
  CalendarEvent,
  ClientDetails,
  ClientSummary,
  ServiceOption,
} from './types';

// ---- Calendar events ----
export const MOCK_EVENTS: CalendarEvent[] = [];

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

export const MOCK_SERVICES: ServiceOption[] = [];

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

export const MOCK_CLIENTS: ClientSummary[] = [];

export const MOCK_CLIENT_DETAILS: Record<string, ClientDetails> = {};

