# Auth & tenant (local mock)

**Status:** done (local-only). Replace with Better Auth + API when backend ships.

## Behavior

- **Sign in / Sign up** — `AuthContext` stores a session in AsyncStorage and a device-local user registry (`StoredUserRecord`). Passwords are **plain mock only**; not production-safe.
- **Tenant** — `TenantContext` stores `currentSalonId` and `SalonMembership[]` per user key (`@salonx_tenant_v1_<userId>`). Seeded with **Demo Salon** (`MOCK_SALONS` in `src/data/mockData.ts`).
- **Routing** — `app/index.tsx` redirects: no session → `/sign-in`; no `currentSalonId` → `/select-salon`; else → `/(tabs)`.
- **After sign-up** — `/workspace-setup`: optional salon display name + workspace blurb; **Skip** goes straight to tabs (mock catalog defaults); **Continue** saves overrides to tenant storage (`workspaceDisplayName`, `workspaceInfo`).
- **Settings** — Account section: email, workspace name, switch workspace, sign out.

## Schema alignment

Types mirror `User`, `Salon`, `SalonMembership` in `prisma/schema.prisma` (`SalonMembershipRole`, etc.).

## Future

- Swap `AuthProvider` for Better Auth session source.
- Resolve salons/memberships from `GET /salons` + JWT `salonId` context.
