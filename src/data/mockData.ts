/**
 * Single source of all mock data for the app.
 * When adding or changing mock data, do it here so the rest of the app stays consistent.
 * When wiring backend APIs, replace consumers to use API calls and keep this file for fallback/dev.
 *
 * IMPORTANT:
 * - Prisma-aligned DB mocks below are the source-of-truth.
 * - UI-facing mocks (MOCK_EVENTS/MOCK_CLIENTS/MOCK_CLIENT_DETAILS/MOCK_SERVICES) are derived from DB mocks
 *   so the app stays functional while backend schema stays consistent.
 */

import type {
  AppointmentStatus,
  CalendarEvent,
  ClientDetails,
  ClientSummary,
  DbAppointment,
  DbAppointmentConsultation,
  DbAppointmentEnhancement,
  DbAppointmentNextVisitPlan,
  DbAppointmentProductRecommendation,
  DbAppointmentProductUsed,
  DbAppointmentService,
  DbClient,
  DbProduct,
  DbService,
  IsoDateString,
  PrismaPriceType,
  RetailCatalogItem,
  ServiceOption,
} from './types';

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function toIso(d: Date): IsoDateString {
  return d.toISOString();
}

function cents(n: number): number {
  return Math.round(n * 100);
}

function dollarsFromCents(n?: number | null): number {
  return n == null ? 0 : Math.round(n / 100);
}

function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
}

// ---- Today-based appointment times (app seed) ----
const APT_1_START = todayAt(9, 0);
const APT_1_END = todayAt(11, 0);
const APT_2_START = todayAt(11, 20);
const APT_2_END = todayAt(12, 5);
const APT_3_START = todayAt(12, 15);
const APT_3_END = todayAt(13, 35);
const APT_4_START = todayAt(14, 0);
const APT_4_END = todayAt(16, 0);

// ---- Prisma-aligned backend mocks (source-of-truth) ----

export const DB_CLIENTS: DbClient[] = [
  {
    id: 'client-jon-klein',
    fullName: 'Jon Klein',
    phone: '541-556-6923',
    photoUrl: null,
    notes: 'Prefers soft, lived-in tone.',
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    id: 'client-mia-chen',
    fullName: 'Mia Chen',
    phone: '415-203-8891',
    photoUrl: null,
    notes: 'Sensitive scalp. Prefers fragrance-light products.',
    createdAt: toIso(APT_2_START),
    updatedAt: toIso(APT_2_START),
  },
  {
    id: 'client-aisha-rahman',
    fullName: 'Aisha Rahman',
    phone: '212-555-0148',
    photoUrl: null,
    notes: 'Low-maintenance shape between visits.',
    createdAt: toIso(APT_3_START),
    updatedAt: toIso(APT_3_START),
  },
  {
    id: 'client-carlos-vega',
    fullName: 'Carlos Vega',
    phone: '305-555-0199',
    photoUrl: null,
    notes: 'Dryness around hairline.',
    createdAt: toIso(APT_4_START),
    updatedAt: toIso(APT_4_START),
  },
];

export const DB_SERVICES: DbService[] = [
  {
    id: 'svc-balayage',
    name: 'Balayage',
    description: null,
    durationMin: 120,
    priceCents: cents(150),
    priceType: 'FIXED' satisfies PrismaPriceType,
    calendarColor: '#FF18EC',
    requireDeposit: false,
    depositCents: null,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    id: 'svc-toner',
    name: 'Toner Application',
    description: null,
    durationMin: 45,
    priceCents: cents(60),
    priceType: 'FIXED' satisfies PrismaPriceType,
    calendarColor: '#25AFFF',
    requireDeposit: false,
    depositCents: null,
    createdAt: toIso(APT_2_START),
    updatedAt: toIso(APT_2_START),
  },
  {
    id: 'svc-haircut',
    name: 'Haircut',
    description: null,
    durationMin: 30,
    priceCents: cents(75),
    priceType: 'FIXED' satisfies PrismaPriceType,
    calendarColor: '#FF7701',
    requireDeposit: false,
    depositCents: null,
    createdAt: toIso(APT_3_START),
    updatedAt: toIso(APT_3_START),
  },
  {
    id: 'svc-conditioning',
    name: 'Deep Conditioning Treatment',
    description: null,
    durationMin: 60,
    priceCents: cents(50),
    priceType: 'FIXED' satisfies PrismaPriceType,
    calendarColor: '#FF18EC',
    requireDeposit: false,
    depositCents: null,
    createdAt: toIso(APT_4_START),
    updatedAt: toIso(APT_4_START),
  },
];

export const DB_PRODUCTS: DbProduct[] = [
  {
    id: 'prd-rusk-colorx-conditioner',
    brand: 'Rusk',
    name: 'COLORx Conditioner',
    priceCents: cents(25),
    imageUrl: null,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    id: 'prd-rusk-vhab-shampoo',
    brand: 'Rusk',
    name: 'VHAB Shampoo',
    priceCents: cents(30),
    imageUrl: null,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
];

export const DB_APPOINTMENTS: DbAppointment[] = [
  {
    id: 'apt-1',
    clientId: 'client-jon-klein',
    startAt: toIso(APT_1_START),
    endAt: toIso(APT_1_END),
    status: 'BOOKED' satisfies AppointmentStatus,
    seriesId: null,
    color: '#FF18EC',
    isParked: false,
    bookingNotes: 'Soft tone + hydration',
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    id: 'apt-2',
    clientId: 'client-mia-chen',
    startAt: toIso(APT_2_START),
    endAt: toIso(APT_2_END),
    status: 'BOOKED' satisfies AppointmentStatus,
    seriesId: null,
    color: '#25AFFF',
    isParked: false,
    bookingNotes: 'Keep shine and softness. Avoid brass.',
    createdAt: toIso(APT_2_START),
    updatedAt: toIso(APT_2_START),
  },
  {
    id: 'apt-3',
    clientId: 'client-aisha-rahman',
    startAt: toIso(APT_3_START),
    endAt: toIso(APT_3_END),
    status: 'BOOKED' satisfies AppointmentStatus,
    seriesId: null,
    color: '#FF7701',
    isParked: false,
    bookingNotes: 'Light layers, keep length.',
    createdAt: toIso(APT_3_START),
    updatedAt: toIso(APT_3_START),
  },
  {
    id: 'apt-4',
    clientId: 'client-carlos-vega',
    startAt: toIso(APT_4_START),
    endAt: toIso(APT_4_END),
    status: 'BOOKED' satisfies AppointmentStatus,
    seriesId: null,
    color: '#FF18EC',
    isParked: false,
    bookingNotes: 'Focus on hydration and scalp comfort.',
    createdAt: toIso(APT_4_START),
    updatedAt: toIso(APT_4_START),
  },
];

export const DB_APPOINTMENT_CONSULTATIONS: DbAppointmentConsultation[] = [
  {
    appointmentId: 'apt-1',
    techniqueNotes: [
      'Soft tone + hydration',
      'Redken Shades EQ 7N, 7WB. No lift developer.',
      'Next time: use more 7N',
      '',
      "A Kool dude!!! Sister in law is pregnant and expecting twins. They just started rebuilding the cabin. Jennifer is going to FSU",
    ],
    personalNotes:
      "Loves a soft, lived-in tone. Wants to keep brightness without drying out.",
    durationMin: minutesBetween(APT_1_START, APT_1_END),
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    appointmentId: 'apt-2',
    techniqueNotes: ['Bright refresh + gloss', 'Gloss: neutral beige.', 'Avoid brass; keep shine.'],
    personalNotes: 'Sensitive scalp. Prefers fragrance-light products.',
    durationMin: minutesBetween(APT_2_START, APT_2_END),
    createdAt: toIso(APT_2_START),
    updatedAt: toIso(APT_2_START),
  },
  {
    appointmentId: 'apt-3',
    techniqueNotes: ['Clean shape + face frame', 'Light layers. Keep length.', 'Soft curtain framing.'],
    personalNotes: 'Wants low-maintenance shape between visits.',
    durationMin: minutesBetween(APT_3_START, APT_3_END),
    createdAt: toIso(APT_3_START),
    updatedAt: toIso(APT_3_START),
  },
  {
    appointmentId: 'apt-4',
    techniqueNotes: ['Repair + smooth finish', 'Hydration focus; scalp comfort.'],
    personalNotes: 'Dryness around hairline. Prefers cooler water rinses.',
    durationMin: minutesBetween(APT_4_START, APT_4_END),
    createdAt: toIso(APT_4_START),
    updatedAt: toIso(APT_4_START),
  },
];

export const DB_APPOINTMENT_SERVICES: DbAppointmentService[] = [
  // Jon
  {
    id: 'apt-svc-1',
    appointmentId: 'apt-1',
    serviceId: 'svc-balayage',
    nameSnapshot: 'Balayage',
    priceCentsSnapshot: cents(150),
    completed: true,
    orderIndex: 0,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  {
    id: 'apt-svc-2',
    appointmentId: 'apt-1',
    serviceId: 'svc-toner',
    nameSnapshot: 'Toner Application',
    priceCentsSnapshot: cents(60),
    completed: true,
    orderIndex: 1,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
  // Mia
  {
    id: 'apt-svc-3',
    appointmentId: 'apt-2',
    serviceId: 'svc-toner',
    nameSnapshot: 'Toner Application',
    priceCentsSnapshot: cents(60),
    completed: true,
    orderIndex: 0,
    createdAt: toIso(APT_2_START),
    updatedAt: toIso(APT_2_START),
  },
  // Aisha
  {
    id: 'apt-svc-4',
    appointmentId: 'apt-3',
    serviceId: 'svc-haircut',
    nameSnapshot: 'Haircut',
    priceCentsSnapshot: cents(75),
    completed: true,
    orderIndex: 0,
    createdAt: toIso(APT_3_START),
    updatedAt: toIso(APT_3_START),
  },
  // Carlos
  {
    id: 'apt-svc-5',
    appointmentId: 'apt-4',
    serviceId: 'svc-conditioning',
    nameSnapshot: 'Deep Conditioning Treatment',
    priceCentsSnapshot: cents(50),
    completed: true,
    orderIndex: 0,
    createdAt: toIso(APT_4_START),
    updatedAt: toIso(APT_4_START),
  },
];

export const DB_APPOINTMENT_PRODUCTS_USED: DbAppointmentProductUsed[] = [
  {
    id: 'apt-prd-used-1',
    appointmentId: 'apt-1',
    productId: 'prd-rusk-colorx-conditioner',
    brandSnapshot: 'Rusk',
    nameSnapshot: 'COLORx Conditioner',
    priceCentsSnapshot: cents(25),
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
];

export const DB_APPOINTMENT_PRODUCT_RECOMMENDATIONS: DbAppointmentProductRecommendation[] = [
  {
    id: 'apt-prd-rec-1',
    appointmentId: 'apt-1',
    productId: 'prd-rusk-vhab-shampoo',
    brandSnapshot: 'Rusk',
    nameSnapshot: 'VHAB Shampoo',
    priceCentsSnapshot: cents(30),
    reason: 'To maintain results',
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
];

export const DB_APPOINTMENT_ENHANCEMENTS: DbAppointmentEnhancement[] = [
  {
    appointmentId: 'apt-1',
    title: 'Enhance result',
    suggestion: 'Optional: Add moisture boost for softness',
    serviceNameSnapshot: 'Deep Conditioning Treatment',
    priceCents: cents(50),
    accepted: null,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
];

/**
 * Salon retail catalog — Jack Winn Pro (imported from CSV with image URLs).
 * Source: `docs/catalog/jack_winn_hair_care_products_with_images.csv`
 * category → brand → product hierarchy for Maintain this look → Add products flow.
 */
export const RETAIL_CATALOG: RetailCatalogItem[] = [
  {
    id: 'jw-rc-1',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Clear',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-2',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Frost',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-3',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Honey',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-4',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Smoke',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-5',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Champagne',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-6',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Expreso',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-7',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Fire',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-8',
    category: 'Gloss/Toner',
    brand: 'Jack Winn Pro',
    name: 'LumiGloss Brick',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633b04c149f4d9683501664815825.jpg',
  },
  {
    id: 'jw-rc-9',
    category: 'Shampoo',
    brand: 'Jack Winn Pro',
    name: 'Fix Shampoo',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/1000x1000/GSR_633de2f9da7b51014561665003785.png',
  },
  {
    id: 'jw-rc-10',
    category: 'Conditioner',
    brand: 'Jack Winn Pro',
    name: 'Fix Conditioner',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/1000x1000/GSR_633de2fe034e33555911665003790.png',
  },
  {
    id: 'jw-rc-11',
    category: 'Leave-In',
    brand: 'Jack Winn Pro',
    name: 'Fix Leave-In',
    price: 30,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/1000x1000/GSR_633de301a178d2739831665003793.jpg',
  },
  {
    id: 'jw-rc-12',
    category: 'Shine Serum',
    brand: 'Jack Winn Pro',
    name: 'PrimeShine',
    price: 34,
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/6021d8e0e856a911d791197f/b1e7e3ae-be23-49cb-8eb7-dd8d67c1d6ce/Jack-winn-Primeshine-kwstudio.bozeman.png',
  },
  {
    id: 'jw-rc-13',
    category: 'Humidity Armor',
    brand: 'Jack Winn Pro',
    name: 'Bam',
    price: 30,
    imageUrl:
      'https://images.squarespace-cdn.com/content/v1/6021d8e0e856a911d791197f/1614445837412-XKSPCP9CGK08JO4G5IVD/Jack-Winn_BAM-kwstudio.jpg',
  },
  {
    id: 'jw-rc-14',
    category: 'Boosting Cream',
    brand: 'Jack Winn Pro',
    name: 'Bawdy',
    price: 32,
    imageUrl:
      'https://cdn1.skinsafeproducts.com/photo/CA50554EE4AB58/large_1697191376.pngpng?1697191376=',
  },
  {
    id: 'jw-rc-15',
    category: 'Shampoo',
    brand: 'Jack Winn Pro',
    name: 'BioBond Shampoo',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/11/images/GSR_6372991b804591336101668458283.jpg',
  },
  {
    id: 'jw-rc-16',
    category: 'Conditioner',
    brand: 'Jack Winn Pro',
    name: 'BioBond Conditioner',
    price: 28,
    imageUrl: 'https://i.ebayimg.com/images/g/pxEAAOSw8PFlJdD5/s-l400.jpg',
  },
  {
    id: 'jw-rc-17',
    category: 'Leave-In',
    brand: 'Jack Winn Pro',
    name: 'BioBond Leave-In',
    price: 30,
    imageUrl:
      'https://di2ponv0v5otw.cloudfront.net/posts/2024/05/26/665326b8147b9849fb1fa102/m_665326db20684744e1d4385d.jpg',
  },
  {
    id: 'jw-rc-18',
    category: 'Purple Shampoo',
    brand: 'Jack Winn Pro',
    name: 'Frost',
    price: 26,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2023/05/images/GSR_645bfcb48dfcf2654411683753668.jpg',
  },
  {
    id: 'jw-rc-19',
    category: 'Matte Paste',
    brand: 'Jack Winn Pro',
    name: 'DefiniClay',
    price: 24,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/11/images/GSR_6372991b804591336101668458283.jpg',
  },
  {
    id: 'jw-rc-20',
    category: 'Semi-Matte Wax',
    brand: 'Jack Winn Pro',
    name: 'DefiniFlex',
    price: 24,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/11/images/GSR_6372991b804591336101668458283.jpg',
  },
  {
    id: 'jw-rc-21',
    category: 'Shampoo',
    brand: 'Jack Winn Pro',
    name: 'Quench Shampoo',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/1000x1000/GSR_633de3136fd7a7616611665003811.jpg',
  },
  {
    id: 'jw-rc-22',
    category: 'Conditioner',
    brand: 'Jack Winn Pro',
    name: 'Quench Conditioner',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/11/images/1000x1000/GSR_6372b2a58b5825709281668464821.jpg',
  },
  {
    id: 'jw-rc-23',
    category: 'Leave-In Therapy',
    brand: 'Jack Winn Pro',
    name: 'VitaminSilk',
    price: 32,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/1000x1000/GSR_633de325c032f2595491665003829.jpg',
  },
  {
    id: 'jw-rc-24',
    category: 'Defining Cream',
    brand: 'Jack Winn Pro',
    name: 'DayDream',
    price: 30,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2023/05/images/GSR_647653c11b15a6356201685479889.jpg',
  },
  {
    id: 'jw-rc-25',
    category: 'Volumizing Mousse',
    brand: 'Jack Winn Pro',
    name: 'LiftUp',
    price: 28,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/11/images/GSR_6372991b804591336101668458283.jpg',
  },
  {
    id: 'jw-rc-26',
    category: 'Strong Hold Hairspray',
    brand: 'Jack Winn Pro',
    name: 'MindBlown',
    price: 22,
    imageUrl:
      'https://cdn.raveretailer.com/32FD4738E9/2022/10/images/GSR_633de30e9d52c688161665003806.jpg',
  },
];

/**
 * Placeholder “Past visits” copy for Complete Client Details overlays.
 * Replace with API-backed visit history when the backend is wired.
 */
/**
 * Past consultation technique copy for the Consultation overlay timeline.
 * Visit dates are computed in the screen from the current appointment date; list is shown newest-first.
 */
export const MOCK_CONSULTATION_TIMELINE_PREVIOUS_BODIES: { techniqueLines: string[]; footnote?: string }[] = [
  {
    techniqueLines: [
      'Initial balayage consult',
      'Strand test OK; lift plan agreed. Cool-neutral toner preference.',
    ],
    footnote: 'Patch test recorded.',
  },
  {
    techniqueLines: [
      'Gloss-only refresh',
      'No lift; moisture mask finish.',
    ],
  },
  {
    techniqueLines: [
      'Tone refresh · root smudge',
      'Redken Shades EQ 7N, 7WB. Book next in 8 weeks.',
    ],
    footnote: 'Client prefers softer regrowth line.',
  },
];

export const MOCK_OVERLAY_PAST_VISITS: Record<
  'consultation' | 'services' | 'maintain' | 'notes',
  string
> = {
  consultation: '',
  services:
    'Earlier services (sample)\n\n' +
    '• 2.14.2026 — Highlights, gloss, trim\n' +
    '• 11.03.2025 — Balayage refresh\n\n' +
    'Replace with synced visit line items when available.',
  maintain:
    'Earlier retail (sample)\n\n' +
    '• 2.14.2026 — Bond repair shampoo, hydrating mask\n' +
    '• 11.03.2025 — Purple shampoo, leave-in\n\n' +
    'Replace with product history from your POS.',
  notes:
    'Earlier notes (sample)\n\n' +
    '• 2.14.2026 — Prefers cooler ends; sensitive scalp.\n' +
    '• 11.03.2025 — Use 20 vol only next visit.\n\n' +
    'Replace with archived notes from your CRM.',
};

export const DB_APPOINTMENT_NEXT_VISIT_PLANS: DbAppointmentNextVisitPlan[] = [
  {
    appointmentId: 'apt-1',
    suggestedDate: null,
    suggestedAfterWeeks: 5,
    suggestedServiceNameSnapshot: 'Balayage',
    note: null,
    createdAt: toIso(APT_1_START),
    updatedAt: toIso(APT_1_START),
  },
];

// ---- UI-facing derived mocks (keeps the app working) ----

export const MOCK_EVENTS: CalendarEvent[] = DB_APPOINTMENTS.map((a, idx) => {
  const client = DB_CLIENTS.find((c) => c.id === a.clientId);
  const consult = DB_APPOINTMENT_CONSULTATIONS.find((c) => c.appointmentId === a.id);
  const servicePrimary = DB_APPOINTMENT_SERVICES
    .filter((s) => s.appointmentId === a.id)
    .sort((x, y) => x.orderIndex - y.orderIndex)[0];

  return {
    id: `ev-apt-${idx + 1}`,
    title: client?.fullName ?? 'Client',
    clientName: consult?.techniqueNotes?.[0] ?? client?.notes ?? undefined,
    service: servicePrimary?.nameSnapshot ?? undefined,
    customerId: a.clientId,
    serviceId: servicePrimary?.serviceId ?? undefined,
    seriesId: a.seriesId ?? undefined,
    start: new Date(a.startAt),
    end: new Date(a.endAt),
    color: a.color ?? undefined,
    allDay: false,
    isParked: a.isParked,
    notes: a.bookingNotes ?? undefined,
  };
});

// ---- Services ----

export const SERVICE_CATEGORIES = [
  { id: 'hair', name: 'Hair' },
  { id: 'color', name: 'Color' },
  { id: 'nails', name: 'Nails' },
  { id: 'skincare', name: 'Skincare' },
] as const;

export const CALENDAR_COLORS = [
  '#FF18EC',
  '#25AFFF',
  '#FF7701',
  '#9DE684',
  'rgba(108, 108, 108, 0.9)',
] as const;

export const MOCK_SERVICES: ServiceOption[] = DB_SERVICES.map((s) => ({
  id: s.id,
  name: s.name,
  duration: s.durationMin ?? undefined,
  price: dollarsFromCents(s.priceCents),
  calendarColor: s.calendarColor ?? undefined,
}));

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

export const MOCK_CLIENTS: ClientSummary[] = DB_CLIENTS.map((c) => {
  const lastApt = DB_APPOINTMENTS
    .filter((a) => a.clientId === c.id)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

  return {
    id: c.id,
    clientName: c.fullName,
    lastVisit: lastApt ? new Date(lastApt.startAt) : new Date(),
  };
});

export const MOCK_CLIENT_DETAILS: Record<string, ClientDetails> = Object.fromEntries(
  DB_CLIENTS.map((c) => {
    const apt = DB_APPOINTMENTS
      .filter((a) => a.clientId === c.id)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

    const consult = apt ? DB_APPOINTMENT_CONSULTATIONS.find((x) => x.appointmentId === apt.id) : undefined;

    const services = apt
      ? DB_APPOINTMENT_SERVICES.filter((x) => x.appointmentId === apt.id).sort((a, b) => a.orderIndex - b.orderIndex)
      : [];

    const used = apt ? DB_APPOINTMENT_PRODUCTS_USED.filter((x) => x.appointmentId === apt.id) : [];
    const recs = apt ? DB_APPOINTMENT_PRODUCT_RECOMMENDATIONS.filter((x) => x.appointmentId === apt.id) : [];
    const enhancement = apt ? DB_APPOINTMENT_ENHANCEMENTS.find((x) => x.appointmentId === apt.id) : undefined;

    const detail: ClientDetails = {
      id: c.id,
      clientName: c.fullName,
      phone: c.phone ?? undefined,
      date: apt ? new Date(apt.startAt) : new Date(),
      duration: apt ? minutesBetween(new Date(apt.startAt), new Date(apt.endAt)) : 0,
      techniqueNotes: consult?.techniqueNotes ?? [],
      personalNotes: consult?.personalNotes ?? '',
      services: services.map((s) => ({
        id: s.id,
        name: s.nameSnapshot,
        price: dollarsFromCents(s.priceCentsSnapshot),
        completed: s.completed,
        catalogServiceId: s.serviceId ?? undefined,
      })),
      recommendations: enhancement
        ? [
            {
              id: `rec-${enhancement.appointmentId}`,
              name: enhancement.serviceNameSnapshot ?? enhancement.title,
              caption: enhancement.suggestion,
              price: dollarsFromCents(enhancement.priceCents),
              completed: Boolean(enhancement.accepted),
            },
          ]
        : [],
      products: [
        ...used.map((p) => ({
          id: p.id,
          brand: p.brandSnapshot,
          name: p.nameSnapshot,
          price: dollarsFromCents(p.priceCentsSnapshot),
        })),
        ...recs.map((p) => ({
          id: p.id,
          brand: p.brandSnapshot ?? '—',
          name: p.nameSnapshot,
          price: dollarsFromCents(p.priceCentsSnapshot),
        })),
      ],
    };

    return [c.id, detail] as const;
  })
);

