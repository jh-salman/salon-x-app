# SalonX mobile app — feature branch summary

This branch contains the **Expo app** under `salonx/app` (relative to the monorepo root).

## Auth & API clients

- **`lib/authApi.ts`** — signup, OTP send/verify, sign-out (Bearer token).
- **`lib/orgApi.ts`** — Better Auth organization: `listOrganizations`, `setActiveOrganization`, `createOrganization`, **`checkOrganizationSlugAvailable`**.
- **`lib/salonApi.ts`** — `listMySalons`, `v1Json`, workspace/business PATCH, **`patchSalonSettings`** (plan).

## Tenant & onboarding

- **`context/TenantContext.tsx`** — Persists `currentSalonId`, memberships, `activeOrganizationId`; **`refreshSalons()`**; **`setCurrentSalonId(..., { force, organizationId })`** for post-create sync; syncs BA **set-active** when switching salon with linked org.
- **`app/index.tsx`** — If no memberships → **`/workspace-setup`**; else if no current salon → **`/select-salon`**; else tabs.
- **`screens/auth/WorkspaceSetupScreen.tsx`** — **4-step** onboarding: name/description → business email/phone (optional “use my account”) → **public slug** (`{slug}.xsalonx.com` preview) + address → **Free / Pro**; then `createOrganization` + business + workspace + optional `PRO` plan.
- **`screens/auth/SelectSalonScreen.tsx`** — Real salon list; **no mock salons**; link to create another workspace.

## Slugs & types

- **`lib/orgSlug.ts`** — `PUBLIC_WEB_DOMAIN`, `normalizePublicSlug`, `isValidPublicSlug`; legacy `makeOrganizationSlug` for random slug fallback.
- **`data/types.ts`** — `LocalSalonSummary.plan`, `SalonPlan`.

## Mocks

- **`data/mockData.ts`** — Removed **`MOCK_SALONS`** / **`getSalonById`** for tenant picking (calendar mocks unchanged).

## Config

- **`EXPO_PUBLIC_API_URL`** (or `expo.extra.apiUrl`) for API base URL.
