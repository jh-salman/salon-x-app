# Calendar features – TODO list

Track for: **Parked**, **Waitlist**, **Day view**, **Week view**.

---

## Parked

- [x] Parked pills/orb and bar use **orange** (`colors.event.orange`)
- [x] Long-press + drag from AllDaySection to calendar to unpark
- [x] Drop position uses `DAY_START_HOUR = 6` and `SLOT_HEIGHT = 56` so it aligns with calendar y-axis
- [x] Haptic on drag start; ghost orb appears at pill/row center
- [ ] (Optional) Park zone highlight colour configurable

---

## Waitlist

- [x] Waitlist pills and indicators use **green** (`#9DE684` / `colors.event.green`)
- [x] `waitlistAddedAt` on events for timestamp; sort list **chronological (oldest first)**
- [x] Show **date and time** for each waitlist entry: format **`M/d  HH:mm`** (e.g. `3/7  12:31`)
- [x] Single person = show name; multiple = show count (“Waiting (N)”)
- [x] Week view: green dot in day header when day has waitlist; tap → modal “Choose a day to drop an appointment by clicking on it”
- [x] No drag-and-drop from waitlist/parked in week view (unpark/move only in day view)
- [ ] (Optional) Backend: persist `waitlistAddedAt` and ordering

---

## Day view

- [x] Move, unpark, resize, park **only in day view** (disabled in week/month)
- [x] Drag-and-drop enabled in day view (move, resize, park)
- [x] Single time axis on the left inside CalendarMiddleSection
- [x] Vertical scroll for time slots; grid lines for hour boundaries
- [x] Park zone (AllDaySection) and calendar share `calendarLayout` for correct drop position
- [ ] (Optional) Scroll to current time on date change

---

## Week view

- [x] **No** drag-and-drop (only tap day to go to day view)
- [x] **One** shared time axis (y-axis) on the left; 5 days visible at a glance
- [x] Single vertical scroll for time axis + day columns (synced)
- [x] Horizontal scroll for day columns only; time axis fixed
- [x] Tap day header or empty slot → switch to day view and set date; header shows “Day” active
- [x] Day columns and content clip so appointments don’t bleed
- [x] Waitlist indicator (green) and modal on tap
- [ ] (Optional) Show all-day events per day in week view without breaking scroll

---

## Data & format

- [x] `CalendarEvent.waitlistAddedAt?: number | Date` for waitlist timestamp
- [x] `CalendarEvent.isParked` for parked state
- [x] Waitlist date+time display: **`M/d  HH:mm`** (e.g. `3/7  12:31`)
- [ ] (Optional) API contract for parked/waitlist when backend is ready

---

## Cursor rule

- [x] Rule added: `.cursor/rules/calendar-parked-waitlist-views.mdc` (parked, waitlist, day/week view behaviour and constants)

---

*Last updated: calendar parked, waitlist, day and week view features.*
