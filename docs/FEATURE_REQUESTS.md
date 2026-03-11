# Feature request lists

Boss review: two lists are maintained below.

---

## 1️⃣ Current implementation tasks

| # | Task | Status | Notes |
|---|------|--------|--------|
| 1 | **Checkout Rebook flow** – Rebook button on client checkout; system suggests next appointment (pattern or default 5 weeks) | Done | Rebook opens new-appointment with pre-fill; default 5 weeks same time |
| 2 | **Same time auto suggestion** – Rebook suggestion uses same time of day (e.g. today 2:00 PM → 5 weeks later 2:00 PM) | Done | suggestedDate = addWeeks(appt date, 5) |
| 3 | **Appointment card pre-population** – Rebooking screen: auto-fill client name, same service, same stylist, same duration, same time suggestion | Done | Pre-fill client, service, duration, suggested date/time from params |
| 4 | **Book single vs multiple toggle** – Toggle: “Book only one appointment?” YES = single, NO = multiple; toggle pink when active | Done | YES/NO toggle; pink (#FF18EC) when active |
| 5 | **Multiple appointment booking** – When NO: show multi-book field, repeat options, number of appointments (e.g. every 5 weeks, book multiple ahead) | Done | When NO, Repeat row shown; opens Repeat screen for end date + interval |
| 6 | **Modify appointment** – Calendar appointment → “Modify appointment”; change services, duration, notes, financial, timeframe | Done | updateEvent in context; pre-fill from event; Save updates existing |
| 7 | **Modify → Service menu** – Modify opens service menu: add / remove / change service | Pending | Change service via dropdown; add/remove multiple TBD |
| 8 | **Set New Time button** – When changing time (wheel selector), bottom button “Set New Time” to confirm and update time | Done | Date/Time row → modal + Set New Time button |

---

## 2️⃣ Future feature requests

| # | Task | Priority | Notes |
|---|------|----------|--------|
| 9 | **AI upsell suggestions** – Rebooking screen: AI suggests additional services, upgrades, new services client hasn’t tried (increase ticket, retail, revenue) | Future | e.g. “Would you like to add conditioning treatment?” |
| 10 | **Appointment time block preview** – When service durations change, visually show appointment structure (e.g. 30 min block, open block, 40 min block) | Optional / low | Nice-to-have |
| — | **Revenue engine focus** – Platform as revenue engine: upselling services, increasing average ticket, retail sales | Theme | Cross-cutting goal |

---

## Recommended implementation order

1. Checkout Rebook button  
2. Auto 5-week suggestion logic  
3. Same time auto select  
4. Appointment card pre-population  
5. Single vs multiple toggle  
6. Multiple booking logic  
7. Modify appointment feature  
8. Service menu modification  
9. Set New Time button  
10. (Future) AI upsell system  
11. (Optional) Appointment block preview  
