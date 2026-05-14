"use client";

import {
  DEFAULT_PRIMARY_HEX,
  getActiveBrand,
  SALONX_PRIMARY_STORAGE_KEY,
  S1_DEMO_SESSION_STORAGE_KEY,
  type S1DemoSlotId,
  mergeWithDefaults,
} from "@/lib/salonx-config";
import { useCallback, useState } from "react";

function absolutizeImages(
  images: Record<S1DemoSlotId, string>,
  base: string,
): Record<S1DemoSlotId, string> {
  const b = base.replace(/\/$/, "");
  const out = { ...images };
  (Object.keys(out) as S1DemoSlotId[]).forEach((k) => {
    const v = out[k];
    if (v.startsWith("/")) out[k] = `${b}${v}`;
  });
  return out;
}

export function ExportSyncButton() {
  const [message, setMessage] = useState<string | null>(null);

  const copySnippet = useCallback(async () => {
    setMessage(null);
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const res = await fetch("/api/config");
    if (!res.ok) {
      setMessage("Could not load config");
      return;
    }
    const raw = await res.json();
    const cfg = mergeWithDefaults(raw);
    const active = getActiveBrand(cfg);
    const images = absolutizeImages(active.s1Demo.images, origin);
    const sessionPayload = JSON.stringify({
      images,
      adjust: active.s1Demo.adjust,
    });
    const lines = [
      `// Paste in DevTools console on salonx-web-v2 (same browser), then reload.`,
      `localStorage.setItem(${JSON.stringify(SALONX_PRIMARY_STORAGE_KEY)}, ${JSON.stringify(active.primaryHex || DEFAULT_PRIMARY_HEX)});`,
      `sessionStorage.setItem(${JSON.stringify(S1_DEMO_SESSION_STORAGE_KEY)}, ${JSON.stringify(sessionPayload)});`,
      `location.reload();`,
    ];
    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    setMessage("Copied sync snippet to clipboard.");
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void copySnippet()}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Copy browser sync snippet
      </button>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Open salonx-web-v2, paste into the console, run once. Theme and stylist demo
        images apply to that tab.
      </p>
      {message ? (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
