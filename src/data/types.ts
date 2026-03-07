/**
 * Single source of all app data types.
 * Use this file for types; use mockData.ts for mock arrays/objects.
 */

// ---- Calendar / appointments ----

export interface CalendarEvent {
  id: string;
  title: string;
  clientName?: string;
  service?: string;
  start: Date;
  end: Date;
  color?: string;
  allDay?: boolean;
  isParked?: boolean;
  /** When added to waitlist (ms or Date); for chronological order and display in AllDaySection */
  waitlistAddedAt?: number | Date;
  /** Minutes into service when processing begins (from service) */
  processingTimeStart?: number;
  /** Minutes into service when processing ends (from service) */
  processingTimeEnd?: number;
}

// ---- Services ----

export type PriceType = 'fixed' | 'starts_from' | 'varies';

export interface ServiceOption {
  id: string;
  name: string;
  duration?: number;
  price?: number;
  imageUri?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  calendarColor?: string;
  showOnWebsite?: boolean;
  processingTimeStart?: number;
  processingTimeEnd?: number;
  processingBlocksStylist?: boolean;
  blockTimeAfter?: number;
  priceType?: PriceType;
  requireDeposit?: boolean;
  depositAmount?: number;
  teamMemberId?: string;
  teamMemberName?: string;
  options?: { name: string; duration?: number; price?: number }[];
}

// ---- Clients ----

export interface Service {
  id: string;
  name: string;
  price: number;
  completed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image?: number;
}

export interface ClientDetails {
  id: string;
  clientName: string;
  clientPhoto?: number;
  phone?: string;
  date: Date;
  duration: number;
  techniqueNotes: string[];
  personalNotes: string;
  services: Service[];
  recommendations: Service[];
  products: Product[];
}

export interface ClientSummary {
  id: string;
  clientName: string;
  clientPhoto?: number;
  lastVisit: Date;
}

/** Used to build ClientDetails from an appointment when client not in mock data */
export interface AppointmentLike {
  id: string;
  clientName: string;
  service: string;
  startTime: Date;
  endTime: Date;
}

// ---- Work schedule ----

export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DaySchedule {
  available: boolean;
  startTime: string;
  endTime: string;
}
