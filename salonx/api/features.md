# SalonX API — feature branch summary

This branch contains the **Express API** under `salonx/api` (relative to the monorepo root).

## Auth & organizations (Better Auth)

- **Better Auth** with **bearer** + **organization** + **phone (OTP)** plugins (`src/lib/auth.ts`).
- **Organization ↔ Salon sync** (`src/lib/auth-org-sync.ts`): on org create / invite accept, sync `Salon` + `SalonMembership` with BA roles mapped to `OWNER` / `ADMIN` / `STYLIST`.
- **Removed** legacy `/api/v1/team` routes in favor of `/api/auth/organization/*`.

## Prisma & migrations

- **Organization**, **Member**, **Invitation** models; **Session.activeOrganizationId**; **Salon.organizationId** (1:1 with org).
- **Salon.plan**: enum `FREE` | `PRO` (default `FREE`).
- **SalonBusinessProfile**: partial **unique** indexes on normalized **email** and **phone** (global uniqueness across salons).
- Migrations under `prisma/migrations/` (including org plugin + salon plan / business contact uniqueness).

## HTTP API

- **`GET /api/v1/me/salons`** — authenticated user’s salons + `organizationId` + `plan` (`modules/user/`).
- **`PATCH /api/v1/salon`** — update **`plan`** (`FREE` | `PRO`), OWNER/ADMIN only (`modules/salon/settings.routes.ts`).
- **`GET|PATCH /api/v1/business`** — business profile; **global uniqueness** enforced for business email/phone vs other salons (`modules/business/services.business.ts`).
- **`GET|PATCH /api/v1/workspace`**, **`/appointments`**, **`/health`**, etc. (tenant routes use **`x-salon-id`** + `requireSalonMembership`).

## Supporting libs

- **`src/lib/phone-business.ts`** — US E.164 validation for business phone.

## Postman

- **`postman/SalonX-API.postman_collection.json`** — Health, Auth, Session, **Me (salons)**, Tenant, **Organization (Better Auth)**.

## Run / deploy

- Apply DB: `npx prisma migrate deploy` (from `api/`).
- Env: `DATABASE_URL`, `BETTER_AUTH_*`, `CORS_ORIGINS`, etc.
