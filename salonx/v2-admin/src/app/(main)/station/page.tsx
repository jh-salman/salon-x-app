import { BuildStationApp } from "@/components/build-station/BuildStationApp";

function AutoSavedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
      <svg
        className="size-5 shrink-0"
        viewBox="0 0 256 256"
        fill="currentColor"
        aria-hidden
      >
        <path d="M128 24a104 104 0 1 0 104 104A104.2 104.2 0 0 0 128 24Zm45.7 85.7-56 56a8.2 8.2 0 0 1-11.4 0l-24-24a8.1 8.1 0 0 1 11.4-11.4L112 148.7l50.3-50.4a8.1 8.1 0 0 1 11.4 11.4Z" />
      </svg>
      Auto-saved
    </span>
  );
}

export default function BuildStationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Build Station
        </h1>
        <AutoSavedBadge />
      </div>
      <BuildStationApp />
    </div>
  );
}
