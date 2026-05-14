"use client";

import { SalonxScreen1DemoClone } from "@/components/salonx-screen1-demo/SalonxScreen1DemoClone";
import { S1_EMBED_CONFIG, S1_EMBED_READY } from "@/lib/s1-embed-protocol";
import { mergeWithDefaults, type SalonxV2AdminConfig } from "@/lib/salonx-config";
import { S1_FRAME_H, S1_FRAME_W } from "@/lib/s1-slot-geometry";
import { useEffect, useState } from "react";

export default function S1CloneEmbedPage() {
  const [config, setConfig] = useState<SalonxV2AdminConfig | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === S1_EMBED_CONFIG && e.data.payload) {
        setConfig(mergeWithDefaults(e.data.payload as SalonxV2AdminConfig));
      }
    }
    window.addEventListener("message", onMsg);
    if (window.parent !== window) {
      window.parent.postMessage({ type: S1_EMBED_READY }, window.location.origin);
    }
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="m-0 flex min-h-0 justify-center bg-black p-0">
      {config ? (
        <SalonxScreen1DemoClone config={config} embed />
      ) : (
        <div
          className="bg-black"
          style={{ width: S1_FRAME_W, height: S1_FRAME_H }}
          aria-hidden
        />
      )}
    </div>
  );
}
