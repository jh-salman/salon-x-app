# Settings screen ↔ Prisma (`prisma/schema.prisma`)

Maps each **Settings** row to models and scoping (`userId` vs `salonId`).

## ACCOUNT (session + workspace)

| UI | Model(s) | Scope |
|----|-----------|--------|
| Signed-in email | `User.email` | `userId` |
| Workspace name / info | `SalonMemberWorkspace.displayNameOverride`, `.info` + `Salon.name` | `userId` + `salonId` |
| Switch workspace | `SalonMembership` | `userId` + `salonId` |

## PERSONAL

| UI | Model(s) | Scope |
|----|-----------|--------|
| Personal & Contact Info | `UserProfile` | **`userId` only** |
| My Work Schedule | `StylistWeeklyAvailability` | **`userId` + `salonId`** |
| My Assigned Services | `StylistAssignedService` | **`userId` + `salonId`** → `Service` |
| My Preferences | `UserSalonNotificationPreference` | **`userId` + `salonId`** |
| Security | `UserSecuritySettings` (+ Better Auth 2FA when wired) | **`userId` only** |

## APPEARANCE

| UI | Model(s) | Scope |
|----|-----------|--------|
| Theme | `UserThemePreference.primaryAccent` | **`userId` only** |

## MY TEAM

| UI | Model(s) | Scope |
|----|-----------|--------|
| Manage Team (members) | `SalonMembership` | `userId` + `salonId` |
| Invites (optional) | `SalonTeamInvitation` | **`salonId`** |

## MY BUSINESS

| UI | Model(s) | Scope |
|----|-----------|--------|
| Business Details | `SalonBusinessProfile` | **`salonId` only** |
| Website | `SalonBusinessProfile.websiteUrl` | **`salonId`** |

## Relation summary

- **User** 1:1 `UserProfile`, `UserThemePreference`, `UserSecuritySettings`.
- **User + Salon** M:N via `SalonMembership`; settings rows that need both use `userId` + `salonId` with `@@unique` where appropriate.
- **StylistAssignedService** links `User` ↔ `Service` with redundant `salonId` for indexing (must match `Service.salonId` at application layer).
