/**
 * Salon X — backend seed plan (no runtime dependency today).
 *
 * This file is a placeholder for when Prisma is introduced in the backend.
 * Keep seed objects aligned with `prisma/schema.prisma`.
 *
 * IMPORTANT:
 * - Do not import from `src/` (avoid coupling UI mocks to backend seed).
 * - Use simple JSON-like data for easy porting.
 */

export type SeedUser = {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role: 'OWNER' | 'STYLIST' | 'ADMIN';
};

export type SeedClient = {
  id: string;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  notes?: string;
};

export type SeedService = {
  id: string;
  name: string;
  description?: string;
  durationMin?: number;
  priceCents?: number;
  priceType: 'FIXED' | 'STARTS_FROM' | 'VARIES';
  calendarColor?: string;
};

export type SeedProduct = {
  id: string;
  brand: string;
  name: string;
  priceCents?: number;
  imageUrl?: string;
};

export type SeedAppointment = {
  id: string;
  clientId: string;
  stylistId?: string;
  startAt: string; // ISO
  endAt: string; // ISO
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'PARKED';
  seriesId?: string;
  color?: string;
  isParked?: boolean;
  bookingNotes?: string;
};

export const seed = {
  users: [
    {
      id: 'user-owner-1',
      email: 'owner@salonx.local',
      fullName: 'Salon Owner',
      role: 'OWNER',
    },
    {
      id: 'user-stylist-1',
      email: 'stylist@salonx.local',
      fullName: 'Stylist One',
      role: 'STYLIST',
    },
  ] satisfies SeedUser[],

  clients: [
    {
      id: 'client-jon-klein',
      fullName: 'Jon Klein',
      phone: '541-556-6923',
      notes: 'Prefers soft, lived-in tone.',
    },
  ] satisfies SeedClient[],

  services: [
    {
      id: 'svc-balayage',
      name: 'Balayage',
      durationMin: 120,
      priceCents: 15000,
      priceType: 'FIXED',
    },
    {
      id: 'svc-toner',
      name: 'Toner Application',
      durationMin: 45,
      priceCents: 6000,
      priceType: 'FIXED',
    },
  ] satisfies SeedService[],

  products: [
    {
      id: 'prd-rusk-colorx-conditioner',
      brand: 'Rusk',
      name: 'COLORx Conditioner',
      priceCents: 2500,
    },
    {
      id: 'prd-rusk-vhab-shampoo',
      brand: 'Rusk',
      name: 'VHAB Shampoo',
      priceCents: 3000,
    },
  ] satisfies SeedProduct[],

  appointments: [
    {
      id: 'apt-1',
      clientId: 'client-jon-klein',
      stylistId: 'user-stylist-1',
      startAt: new Date('2025-08-15T15:00:00.000Z').toISOString(),
      endAt: new Date('2025-08-15T15:45:00.000Z').toISOString(),
      status: 'BOOKED',
      isParked: false,
    },
  ] satisfies SeedAppointment[],
};

