"use client";

import {
  S1_EMBED_CONFIG,
  S1_EMBED_READY,
  S1_EMBED_SLOT_CLICK,
} from "@/lib/s1-embed-protocol";
import type { SalonxV2AdminConfig, S1DemoSlotId } from "@/lib/salonx-config";
import { S1_FRAME_H, S1_FRAME_W } from "@/lib/s1-slot-geometry";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Props = {
  config: SalonxV2AdminConfig;
  scale: number;
  roundedClassName?: string;
  /** Clicks on handset image slots (iframe → parent). */
  onSlotClick?: (slot: S1DemoSlotId) => void;
  disabled?: boolean;
};

/**
 * Stylist home preview with accurate `curve-mask.svg` clipping: the clone runs at 1:1 inside an
 * iframe (no transform ancestors), then the iframe element is scaled. Parent page uses
 * `postMessage` so draft config from Build Station stays in sync.
 */
export function S1CurveMaskPreviewIframe({
  config,
  scale,
  roundedClassName = "rounded-xl",
  onSlotClick,
  disabled = false,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const post = useCallback((cfg: SalonxV2AdminConfig) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    const payload = JSON.parse(JSON.stringify(cfg)) as SalonxV2AdminConfig;
    w.postMessage({ type: S1_EMBED_CONFIG, payload }, window.location.origin);
  }, []);

  /** Layout effect so the iframe receives draft config before paint (avoids one-frame stale preview). */
  useLayoutEffect(() => {
    post(config);
  }, [config, post]);

  const onLoad = useCallback(() => {
    post(config);
  }, [config, post]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === S1_EMBED_READY) post(config);
      if (e.data?.type === S1_EMBED_SLOT_CLICK) {
        const slot = e.data?.slot as S1DemoSlotId | undefined;
        if (!slot || disabled) return;
        onSlotClick?.(slot);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [config, post, disabled, onSlotClick]);

  const scaledW = S1_FRAME_W * scale;
  const scaledH = S1_FRAME_H * scale;

  return (
    <div
      className={`mx-auto overflow-hidden bg-black ${roundedClassName}`}
      style={{ width: scaledW, height: scaledH }}
    >
      <iframe
        ref={iframeRef}
        title="Stylist home — curve-accurate preview"
        src="/embed/s1-clone"
        className="block border-0 bg-black"
        style={{
          width: S1_FRAME_W,
          height: S1_FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        onLoad={onLoad}
      />
    </div>
  );
}
