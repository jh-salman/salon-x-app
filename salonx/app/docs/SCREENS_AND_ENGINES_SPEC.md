# Salon X — Screens & Engines Specification

Product / UX architecture reference (EN + BN). For wireframes, Figma, and engineering alignment.

---

## SCREEN · PHASE 1 — S1 Dashboard

**EN:** The first screen a stylist sees every morning. Daily command center.  
**BN:** Stylist-এর সকালের প্রথম screen। দৈনিক কাজের কেন্দ্র।

### Draw checklist

- [ ] Stylist name + avatar at top
- [ ] Collapsible KPI section — warm language, no hard numbers
- [ ] Scrollable appointment list: client name, time, service
- [ ] Waiting list section below appointments
- [ ] Bottom navigation: **Stylist · Clients · Calendar · Checkout**
- [ ] Daily Resolve cards at very bottom (notification stack)

### Receives from

| Source  | Role                  |
|---------|------------------------|
| EMPIRE  | Commission data        |
| MUSE    | Growth nudge           |
| SIGNAL  | Warm KPI language      |
| SKINZ   | Style / brand voice    |

### Sends to

- **S2** — tap any appointment

### Suggestion

Draw this first. One column, no clutter.

---

## SCREEN · PHASE 2 — S2 Client Screen

**EN:** Relationship engine. Deepest screen.  
**BN:** Client সম্পর্কে সব। প্ল্যাটফর্মের গভীরতম screen।

### Draw checklist

- [ ] Persistent header: avatar · name · phone · visit count
- [ ] 5-step progress: **Info → Consult → Create → Care → Rebook**
- [ ] Client history (formulas, services, notes)
- [ ] Consultation field with pre-loaded AI brief
- [ ] **Requested vs Suggested services** — two parallel columns
- [ ] Photo section — clearly **OPTIONAL**
- [ ] Referral badge when applicable

### Receives from

| Source       | Role             |
|--------------|------------------|
| GHOST NOTES  | AI brief preload |
| MUSE         | Growth path      |
| AFTERBURNER  | Referral badge   |
| TAG          | Client intel     |

### Sends to

- **S4** — checkout flow
- Stays on **S2** through full service

### Suggestion

Draw tall. **Sticky header** at top while scrolling.

---

## SCREEN · PHASE 3 — S3 Calendar

**EN:** Schedule; drag-and-drop; real-time.  
**BN:** Schedule দেখা; drag; live আপডেট।

### Draw checklist

- [ ] Toggle: **Day · 5-Day · Week · Month**
- [ ] Color-coded blocks by service type
- [ ] Drag handles on blocks
- [ ] Waiting list on the side
- [ ] Real-time updates

### Receives from

- **S1** — Calendar in bottom nav

### Sends to

- **S2** — tap block

### Suggestion

One grid, blocks, handles — keep simple.

---

## SCREEN · PHASE 4 — S4 The Climax (Checkout)

**EN:** Appointment becomes an asset; value at checkout.  
**BN:** Checkout-এ asset; value generation।

### Draw checklist

- [ ] Care package (products used)
- [ ] Co-brand product zone
- [ ] **RAMP post** — prominent CTA
- [ ] Referral links
- [ ] **The Drop** (~3 min after checkout, background job)
- [ ] Trust Bridge copy (per salon)
- [ ] **Star rating before RAMP** (order matters)

### Receives from

| Source      | Role                       |
|-------------|----------------------------|
| THE INK     | RAMP gate from review      |
| AFTERBURNER | Referral links             |
| SKINZ       | Brand language             |

### Sends to

- **S5**

### Suggestion — CRITICAL

**RAMP hidden** until rating **4 or 5 stars**.

---

## SCREEN · PHASE 5 — S5 RAMP / Review

**EN:** Social post; peak satisfaction; one tap live.  
**BN:** Post screen; attribution সহ live।

### Draw checklist

- [ ] Stars 1–5 large at top
- [ ] After photo upload / compiled asset
- [ ] Post preview
- [ ] Three paths: **① AI post ② Canva deep-link ③ Copy link**
- [ ] Attribution: stylist + brand + referral
- [ ] Rating **1–3**: hide post UI

### Receives from

- RAMP engine, THE INK (gate)

### Sends to

- **S1** — loop closes

### Suggestion

Two artboards: **4–5** (post visible) vs **1–3** (hidden).

---

## ENGINE · PHASE 6 — GHOST NOTES

**EN:** Pre-arrival intelligence.  
**BN:** আসার আগে brief ও intake।

### Draw checklist

- [ ] Status: **NEW · REPEAT · LAPSED · VIP**
- [ ] AI brief for stylist
- [ ] Token intake + delivery status
- [ ] Photos **optional**, never required
- [ ] Questions by client type

### Receives from

- `appointment.created`, Token Form, SMS

### Sends to

- **S2**

### Suggestion

Preparation flow, not mid-service screen.

---

## ENGINE · PHASE 7 — EMPIRE

**EN:** Commission; warm vs precise views.  
**BN:** Payout; stylist vs owner UI।

### Draw checklist

- [ ] Structures: flat %, tiered, hourly+commission, bonus
- [ ] **Solo · Multi-Stylist · Owner**
- [ ] Stylist: warm KPI, no raw dollars
- [ ] Owner: numbers, rings, actions
- [ ] `equity_mode` — admin only
- [ ] 160 seats (20 per partner)
- [ ] Payout period state

### Receives from

- `appointment.created`, Stripe, seats table

### Sends to

- **S1**, AFTERBURNER, MUSE

### Suggestion

Separate **STYLIST** vs **OWNER** frames.

---

## ENGINE · PHASE 8 — THE INK

**EN:** Post-visit; RAMP gate; The Drop.  
**BN:** রিভিউ gate; delayed Drop; aftercare record।

### Draw checklist

- [ ] Score 1–5
- [ ] **IF ≥ 4 → show RAMP**
- [ ] The Drop job (e.g. BullMQ ~3 min)
- [ ] Aftercare record
- [ ] 4-star follow-up draft (manual)

### Receives from

- Queue + checkout

### Sends to

- **S4**, **S5**, RAMP, The Drop → client

### Suggestion

Label edge: **ONLY IF 4–5 stars**.

---

## ENGINE · PHASE 9 — AFTERBURNER

**EN:** Referral attribution; badges; co-brand rules.  
**BN:** L1/L2 lock; badge; 10 referrals + 30d।

### Draw checklist

- [ ] L1 immutable at subscription
- [ ] L2 two tiers up
- [ ] Active referral count
- [ ] Co-brand: 10 active + 30 days
- [ ] Badge on first completed appt (referred)
- [ ] Badge on **S2**
- [ ] Volume tiers 5–9, 10–19, 20–29, 30+

### Receives from

- EMPIRE, **S4**, attribution log

### Sends to

- **S2**, **S4**

### Suggestion

Two boxes: AFTERBURNER (attribution) ↔ EMPIRE (payout).

---

## ENGINE · PHASE 10 — SKINZ

**EN:** Per-partner morphing; server-side moat.  
**BN:** partner_config + Redis StyleProfile; সব content engine-এ inject।

### Draw checklist

- [ ] DB `partner_config`
- [ ] Redis StyleProfiles
- [ ] Injection into all generators
- [ ] GHOST NOTES / Drop / RAMP copy vary by brand
- [ ] No stylist-facing “skin” toggle

### Receives from

- Redis, `appointment.created`

### Sends to

- **S1, S2, S4** + content engines

### Suggestion

Draw as **full-width layer** under other modules.

---

## ENGINE · PHASE 11 — TAG

**EN:** **GRAB → SNAPSHOT → TAG**; 10 predictions.  
**BN:** Prospect pipeline + mind map (V1).

### Draw checklist

- [ ] GRAB / SNAPSHOT / TAG
- [ ] Mind map
- [ ] Never-abandon follow-ups

### Receives from

- `appointment.created`, **S2**

### Sends to

- **S2**

### Suggestion

Linear pipeline diagram.

---

## INFRA · PHASE 12 — `appointment.created` (Spine)

**EN:** Single cascade root.  
**BN:** এক ইভেন্ট — সব engine।

### Draw checklist

- [ ] Central event node
- [ ] Fan-out: **GHOST NOTES · EMPIRE · MUSE · SIGNAL · SKINZ · TAG**
- [ ] Label **`appointment.created`**
- [ ] Tree root

### Receives from

- Booking widget, Calendar, Walk-in

### Sends to

- All engines (parallel)

### Suggestion

Draw this node first in architecture maps.

---

## Diagram hint

Extend `app/docs/diagrams/` with spine + screen graphs; this file is the source of truth for labels and gates.

---

*Consolidated from product brief: screens S1–S5, engines phases 6–11, spine phase 12.*
