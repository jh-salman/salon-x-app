## Salon X — Schema map (screen → tables)

This document maps the mobile UI to Prisma models in `prisma/schema.prisma`.
Keep it updated whenever UI adds new fields or cards.

### Calendar (Day/Week/Month)

- **Primary**: `Appointment`
  - `startAt`, `endAt`, `status`, `seriesId`, `color`, `isParked`
  - `clientId` → `Client.fullName` for display
- **Client**: `Client`

### New appointment / Modify appointment (`NewAppointmentScreen`)

- **Appointment**: `Appointment`
  - `clientId`, `startAt`, `endAt`, `seriesId`
  - `bookingNotes` (maps to notes field)
- **Catalog**:
  - `Service` (for service dropdown)
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
  - `fullName`, `phone`, `photoUrl`
- Derived data:
  - Last visit date can be derived from latest `Appointment.startAt` for the client

