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
  /** Same customer across repeat appointments */
  customerId?: string;
  /** Same service across repeat appointments */
  serviceId?: string;
  /** When set, moving one appointment in the series moves all with same seriesId by the same offset */
  seriesId?: string;
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
  /** Optional notes (shown in modify form) */
  notes?: string;
  /** Optional price (shown in modify form) */
  price?: number | string;
}

/** Stylist per-appointment stopwatch (card label; separate from service countdown). */
export interface AppointmentStopwatchPersist {
  appointmentId: string;
  accumulatedMs: number;
  startedAtEpoch?: number;
  updatedAtEpoch: number;
}

// ---- Prisma-aligned backend types (planning) ----

/** ISO date string used by API payloads. */
export type IsoDateString = string;

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'PARKED';
export type CheckoutStatus = 'PENDING' | 'PAID' | 'VOID';
export type PrismaPriceType = 'FIXED' | 'STARTS_FROM' | 'VARIES';

export interface DbClient {
  id: string;
  fullName: string;
  phone?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbClientNote {
  id: string;
  clientId: string;
  body: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
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

export interface DbService {
  id: string;
  name: string;
  description?: string | null;
  durationMin?: number | null;
  priceCents?: number | null;
  priceType: PrismaPriceType;
  calendarColor?: string | null;
  requireDeposit: boolean;
  depositCents?: number | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// ---- Clients ----

export interface Service {
  id: string;
  name: string;
  price: number;
  completed?: boolean;
  /** Salon catalog id (`MOCK_SERVICES` / `DbAppointmentService.serviceId`) for wheel exclusion. */
  catalogServiceId?: string;
  /** Optional short line (e.g. enhance-result suggestion) shown above `name`. */
  caption?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  /** Local asset (legacy / require). */
  image?: number;
  /** Remote catalog image (Jack Winn / retail import). */
  imageUrl?: string;
  /** Retail shelf category (salon retail / Maintain this look). */
  retailCategory?: string;
}

/** Sample retail catalog row (CSV import / backend catalog). */
export interface RetailCatalogItem {
  id: string;
  category: string;
  brand: string;
  name: string;
  /** Dollars for UI (CSV had no MSRP; placeholder retail for mock). */
  price: number;
  /** Product image from catalog import (remote URL). */
  imageUrl?: string;
}

export interface DbProduct {
  id: string;
  brand: string;
  name: string;
  priceCents?: number | null;
  imageUrl?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface ClientDetails {
  id: string;
  clientName: string;
  clientPhoto?: number;
  phone?: string;
  /** Completed visits (lifetime / known history). Shown in S2 header. */
  visitCount?: number;
  /** AFTERBURNER: show referral badge on profile when client referred others. */
  showReferralBadge?: boolean;
  /** GHOST NOTES: pre-arrival AI summary for stylist (S2 Info / Consultation). */
  aiConsultationBrief?: string;
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

export interface DbAppointment {
  id: string;
  clientId: string;
  startAt: IsoDateString;
  endAt: IsoDateString;
  status: AppointmentStatus;
  seriesId?: string | null;
  color?: string | null;
  isParked: boolean;
  bookingNotes?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbAppointmentConsultation {
  appointmentId: string;
  techniqueNotes: string[];
  personalNotes: string;
  durationMin?: number | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** One dated block in the Consultation overlay (chronological timeline). */
export interface ConsultationTimelineEntry {
  id: string;
  /** ISO timestamp for sorting (visit / consultation time). */
  sortAt: IsoDateString;
  dateLabel: string;
  durationMin: number;
  techniqueLines: string[];
  footnote?: string;
  /** Most recent visit (matches current appointment). */
  isCurrentVisit?: boolean;
}

export interface DbAppointmentService {
  id: string;
  appointmentId: string;
  serviceId?: string | null;
  nameSnapshot: string;
  priceCentsSnapshot?: number | null;
  completed: boolean;
  orderIndex: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbAppointmentProductUsed {
  id: string;
  appointmentId: string;
  productId?: string | null;
  brandSnapshot: string;
  nameSnapshot: string;
  priceCentsSnapshot?: number | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbAppointmentProductRecommendation {
  id: string;
  appointmentId: string;
  productId?: string | null;
  brandSnapshot?: string | null;
  nameSnapshot: string;
  priceCentsSnapshot?: number | null;
  reason?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbAppointmentEnhancement {
  appointmentId: string;
  title: string;
  suggestion: string;
  serviceNameSnapshot?: string | null;
  priceCents?: number | null;
  accepted?: boolean | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbAppointmentNextVisitPlan {
  appointmentId: string;
  suggestedDate?: IsoDateString | null;
  suggestedAfterWeeks?: number | null;
  suggestedServiceNameSnapshot?: string | null;
  note?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface DbCheckout {
  id: string;
  appointmentId: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  status: CheckoutStatus;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Combined payload expected by client-details API in backend phase. */
export interface AppointmentClientDetailsPayload {
  appointment: DbAppointment;
  client: DbClient;
  consultation?: DbAppointmentConsultation;
  services: DbAppointmentService[];
  productsUsed: DbAppointmentProductUsed[];
  productRecommendations: DbAppointmentProductRecommendation[];
  enhancement?: DbAppointmentEnhancement;
  nextVisitPlan?: DbAppointmentNextVisitPlan;
  checkout?: DbCheckout;
  clientNotes?: DbClientNote[];
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

// ---- Local auth / tenant (User + Salon + SalonMembership; until Better Auth + API) ----

/** Mirrors `SalonMembershipRole` in `prisma/schema.prisma`. */
export type SalonMembershipRole = 'OWNER' | 'ADMIN' | 'STYLIST' | 'RECEPTIONIST';

/** Mirrors `Salon` rows for picker UI (mock + future API). */
export type SalonPlan = 'FREE' | 'PRO';

export interface LocalSalonSummary {
  id: string;
  name: string;
  slug: string;
  timezone?: string | null;
  /** Better Auth organization id when salon is linked (synced from org plugin). */
  organizationId?: string | null;
  plan?: SalonPlan;
}

/** One membership row for the signed-in user. */
export interface LocalSalonMembership {
  salonId: string;
  role: SalonMembershipRole;
}

/** Session payload persisted locally (maps to `User`). */
export interface LocalAuthSession {
  userId: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
}

