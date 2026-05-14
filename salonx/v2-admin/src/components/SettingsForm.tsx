"use client";

import {
  DEFAULT_PRIMARY_HEX,
  getActiveBrand,
  mergeWithDefaults,
  normalizePrimaryHex,
  SALONX_THEME_PRESETS,
} from "@/lib/salonx-config";
import { useCallback, useEffect, useState } from "react";

export function SettingsForm() {
  const [config, setConfig] = useState<ReturnType<typeof mergeWithDefaults> | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error("Load failed");
        const data = await res.json();
        if (!cancelled) setConfig(mergeWithDefaults(data));
      } catch {
        if (!cancelled) setError("Could not load settings");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primary = config
    ? getActiveBrand(config).primaryHex
    : DEFAULT_PRIMARY_HEX;

  const saveHex = useCallback(async (hex: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryHex: hex, publishToApp: true }),
      });
      if (!res.ok) throw new Error("Save failed");
      const next = await res.json();
      setConfig(mergeWithDefaults(next));
    } catch {
      setError("Could not save theme");
    } finally {
      setSaving(false);
    }
  }, []);

  if (!config && !error) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
    );
  }

  if (error && !config) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Stored as{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          salonx.primaryHex
        </code>{" "}
        when you use the sync snippet on salonx-web-v2.
      </p>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Presets
        </h2>
        <div className="flex flex-wrap gap-3">
          {SALONX_THEME_PRESETS.map(({ label, hex }) => {
            const active = normalizePrimaryHex(hex) === normalizePrimaryHex(primary);
            return (
              <button
                key={hex}
                type="button"
                title={label}
                disabled={saving}
                aria-pressed={active}
                onClick={() => void saveHex(hex)}
                className={`h-11 w-11 rounded-full shadow-inner ring-2 ring-offset-2 transition ${
                  active
                    ? "ring-zinc-900 dark:ring-zinc-100"
                    : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600"
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Custom
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>Pick color</span>
            <input
              type="color"
              value={primary}
              disabled={saving}
              aria-label="Primary color"
              onChange={(e) => void saveHex(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-zinc-200 bg-white dark:border-zinc-700"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveHex(DEFAULT_PRIMARY_HEX)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Reset to default blue
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saving ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Saving…</p>
      ) : null}
    </div>
  );
}
