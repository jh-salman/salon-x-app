## Salon X — Schema map (screen → tables)

This document maps the mobile UI to Prisma models in `prisma/schema.prisma`.
Keep it updated whenever UI adds new fields or cards.

### Multi-tenant & auth (API / Better Auth)

- **Tenant**: `Salon` — one salon has many `Client`, `Service`, `Product`, `Appointment` (each row carries `salonId`).
- **Membership**: `SalonMembership` — many users per salon and many salons per user (junction: unique `[salonId, userId]`), with `SalonMembershipRole`.
- **Better Auth**: `User`, `Session`, `Account`, `Verification` — mapped to tables `user`, `session`, `account`, `verification`. Run `npx @better-auth/cli generate` and merge if plugins add columns.
- **RLS**: Not in Prisma; tenant isolation is enforced in application code (and optionally PostgreSQL RLS policies in raw SQL migrations later).

**Mobile UI (local mock):** sign-in / workspace picker flows map to the same concepts; see `docs/auth-tenant.md`. Calendar data is not yet filtered by `salonId` in contexts (future API phase).

### Settings screen

See **`docs/backend/SETTINGS_SCHEMA.md`** for the full mapping of Settings rows → Prisma models (`UserProfile`, `UserThemePreference`, `StylistWeeklyAvailability`, `UserSalonNotificationPreference`, `SalonBusinessProfile`, etc.).

### Calendar (Day/Week/Month)

- **Primary**: `Appointment`
  - `salonId`, `startAt`, `endAt`, `status`, `seriesId`, `color`, `isParked`
  - `clientId` → `Client.fullName` for display
- **Client**: `Client` (scoped by `salonId`)

### New appointment / Modify appointment (`NewAppointmentScreen`)

- **Appointment**: `Appointment`
  - `clientId`, `startAt`, `endAt`, `seriesId`
  - `bookingNotes` (maps to notes field)
- **Catalog**:
  - `Service` (for service dropdown; `salonId`; optional `assignedUserId` → stylist `User`)
  - `Client` (for customer dropdown)
- **Appointment services**:
  - `AppointmentService` (snapshot of name/price per visit)

### Stylist screen (appointments + timers/stopwatch UI)

- **Appointments list**: `Appointment` + `Client`
- **Service countdown / stopwatch**:
  - Local-first UI persistence can remain in AsyncStorage
  - Optional backend later: add `AppointmentTimerState` if syncing across devices is required

### Client details (Experience cards) (`CompleteClientDetailsScreen`)

Overlay-driven card system pulls from:

- **Client**: `Client`
  - `fullName`, `phone`, `photoUrl`, `notes` (long-term preferences)
- **Appointment**: `Appointment`
  - `startAt`/`endAt` (date badge + duration)
- **Consultation card**: `AppointmentConsultation`
  - `techniqueNotes[]`, `personalNotes`, `durationMin`
- **Services card**: `AppointmentService[]`
  - `nameSnapshot`, `priceCentsSnapshot`, `completed`, `orderIndex`
- **Maintain this look**
  - Used today: `AppointmentProductUsed[]` (snapshot fields)
  - To maintain: `AppointmentProductRecommendation[]` (snapshot fields + reason)
- **Enhance result (optional)**: `AppointmentEnhancement`
- **Plan next visit**: `AppointmentNextVisitPlan`
- **Complete visit** (future): `Checkout`

### Clients list / search (`ClientsScreen`)

- **Client**: `Client`
  - `salonId`, `fullName`, `phone`, `photoUrl`
- Derived data:
  - Last visit date can be derived from latest `Appointment.startAt` for the client

