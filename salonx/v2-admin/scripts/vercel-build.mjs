#!/usr/bin/env node
/**
 * Vercel build entry: run DB migrations only when DATABASE_URL is set.
 * Otherwise `prisma migrate deploy` fails and the whole deploy exits 1.
 *
 * Neon (and similar) often expose a *pooled* `DATABASE_URL` (PgBouncer). Prisma
 * migrations need a direct session — use `DIRECT_URL` (non-pooler host) in Vercel
 * for migrate only; keep pooled `DATABASE_URL` for the serverless app.
 */
import { execSync } from "node:child_process";

const dbUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim();
const skipMigrate =
  process.env.SKIP_PRISMA_MIGRATE === "1" ||
  process.env.VERCEL_SKIP_PRISMA_MIGRATE === "1";

/** Connection string used only for the `migrate deploy` subprocess. */
const migrateDatabaseUrl = (directUrl || dbUrl)?.trim();

if (dbUrl && skipMigrate) {
  console.warn(
    "[vercel-build] SKIP_PRISMA_MIGRATE=1 → skipping prisma migrate deploy",
  );
} else if (dbUrl && migrateDatabaseUrl) {
  console.log(
    `[vercel-build] prisma migrate deploy (via ${directUrl ? "DIRECT_URL" : "DATABASE_URL"})`,
  );
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: migrateDatabaseUrl },
    });
  } catch {
    console.error(
      "\n[vercel-build] prisma migrate deploy failed. Common fixes:\n" +
        "  • Neon: add DIRECT_URL = direct (non-pooler) connection string in Vercel; keep pooled DATABASE_URL for runtime.\n" +
        "  • Or set SKIP_PRISMA_MIGRATE=1 to finish the build, then run `npx prisma migrate deploy` against prod from a trusted machine.\n",
    );
    process.exit(1);
  }
} else {
  console.warn(
    "[vercel-build] DATABASE_URL missing → skipping migrations (add Postgres in Vercel env for persisted config).",
  );
}

console.log("[vercel-build] prisma generate");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("[vercel-build] next build");
execSync("npx next build", { stdio: "inherit" });
