"use client";

import { S1CurveMaskPreviewIframe } from "@/components/s1-preview/S1CurveMaskPreviewIframe";
import { S1_FRAME_W } from "@/lib/s1-slot-geometry";
import { type SalonxV2AdminConfig, mergeWithDefaults } from "@/lib/salonx-config";
import { useEffect, useState } from "react";

export function Screen1MediaForm() {
  const [config, setConfig] = useState<SalonxV2AdminConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error("load");
        const raw = await res.json();
        if (cancelled) return;
        setConfig(mergeWithDefaults(raw));
      } catch {
        if (!cancelled) setError("Could not load config");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!config) {
    return (
      <p
        className={`text-sm ${error ? "text-red-600" : "text-zinc-500 dark:text-zinc-400"}`}
      >
        {error ?? "Loading…"}
      </p>
    );
  }

  const previewScale = 0.62;
  const scaledW = S1_FRAME_W * previewScale;

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-[2rem] bg-zinc-900 p-3 shadow-xl ring-1 ring-white/10"
        style={{ width: scaledW + 24 }}
      >
        <S1CurveMaskPreviewIframe
          config={config}
          scale={previewScale}
          roundedClassName="rounded-[1.25rem]"
        />
      </div>
    </div>
  );
}
