import { ExportSyncButton } from "@/components/ExportSyncButton";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Admin for <strong>salonx-web-v2</strong>: theme (primary color), marquee login art, and
          stylist home demo slots. Config is stored on disk; uploads are served as static files.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/station"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Build Station</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Up to 10 brands — Marquee, Stylist, Climax, Screen 5 — locks, activate for the live
            app.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
            Open Build Station →
          </span>
        </Link>

        <Link
          href="/settings"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Theme</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Primary color presets and picker — maps to{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
              salonx.primaryHex
            </code>
            .
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
            Open theme →
          </span>
        </Link>

        <Link
          href="/screen1"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Stylist media</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Upload images for top bar, hero, promo, and curve strip — same structure as{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
              @salonx/s1-demo-image/v1
            </code>
            .
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
            Manage slots →
          </span>
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Push to salonx-web-v2
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          The Vite app keeps theme in <code className="text-xs">localStorage</code> and
          stylist demo assets in <code className="text-xs">sessionStorage</code>. Copy
          the snippet while both apps can reach this admin URL for image links.
        </p>
        <div className="mt-4">
          <ExportSyncButton />
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">API</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">GET /api/config</code>{" "}
            — full JSON config (CORS enabled)
          </li>
          <li>
            <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">PATCH /api/config</code>{" "}
            — partial updates
          </li>
          <li>
            <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">POST /api/upload</code>{" "}
            — multipart field <code className="text-xs">file</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
