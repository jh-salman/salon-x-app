"use client";

import type { CSSProperties } from "react";
import type { SalonxV2AdminConfig } from "@/lib/salonx-config";
import { getActiveBrand } from "@/lib/salonx-config";
import {
  S1_FRAME_H,
  S1_FRAME_W,
  S1_LAYOUT,
  S1_MASK_POS_STACK,
  S1_MASK_SIZE,
} from "@/lib/s1-slot-geometry";
import { S1SlotPreview } from "@/components/S1SlotPreview";

const STACK_H =
  S1_LAYOUT.topBarH + S1_LAYOUT.heroGap + S1_LAYOUT.heroH;

const stackPanelMask = {
  WebkitMaskImage: "url(/curve-mask.svg)",
  maskImage: "url(/curve-mask.svg)",
  WebkitMaskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
  maskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: `${S1_MASK_POS_STACK.x}px ${S1_MASK_POS_STACK.y}px`,
  maskPosition: `${S1_MASK_POS_STACK.x}px ${S1_MASK_POS_STACK.y}px`,
  WebkitMaskMode: "alpha",
  maskMode: "alpha",
} as CSSProperties;

/**
 * 393×852 mini handset with slots positioned like `screen1.css` (demo image).
 * Scaled down for the admin page; same geometry as salonx-web-v2 stylist home.
 */
export function S1DeviceMiniPreview({ config }: { config: SalonxV2AdminConfig }) {
  const scale = 0.62;
  const scaledW = S1_FRAME_W * scale;
  const brand = getActiveBrand(config);
  const primaryHex = brand.primaryHex;
  const { images, adjust } = brand.s1Demo;
  const curveStripMediaKind =
    brand.s1Demo.mediaKinds?.curveStrip === "video" ? "video" : "image";

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Live layout preview ({S1_FRAME_W}×{S1_FRAME_H}px) — matches stylist home demo slots
      </p>
      <div
        className="overflow-hidden rounded-[2rem] bg-zinc-900 p-3 shadow-xl ring-1 ring-white/10"
        style={{ width: scaledW + 24 }}
      >
        <div
          className="overflow-hidden rounded-[1.25rem] bg-black"
          style={{
            width: S1_FRAME_W,
            height: S1_FRAME_H,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginBottom: -(S1_FRAME_H * (1 - scale)),
          }}
        >
          <div className="relative h-full w-full bg-black">
            <div
              className="absolute flex flex-col"
              style={{
                left: S1_LAYOUT.stackLeft,
                top: S1_LAYOUT.stackTop,
                width: S1_LAYOUT.stackWidth,
                height: STACK_H,
                ...stackPanelMask,
              }}
            >
              <div className="shrink-0" style={{ height: S1_LAYOUT.topBarH }}>
                <S1SlotPreview
                  slotId="topBar"
                  src={images.topBar}
                  adjust={adjust.topBar}
                  placementOverride={{
                    w: S1_LAYOUT.stackWidth,
                    h: S1_LAYOUT.topBarH,
                  }}
                  fillContainer
                  primaryHex={primaryHex}
                  className="h-full max-w-none ring-0"
                />
              </div>
              <div
                className="shrink-0"
                style={{
                  marginTop: S1_LAYOUT.heroGap,
                  height: S1_LAYOUT.heroH,
                }}
              >
                <S1SlotPreview
                  slotId="hero"
                  src={images.hero}
                  adjust={adjust.hero}
                  placementOverride={{
                    w: S1_LAYOUT.stackWidth,
                    h: S1_LAYOUT.heroH,
                  }}
                  fillContainer
                  primaryHex={primaryHex}
                  className="h-full max-w-none ring-0"
                />
              </div>
            </div>

            <div
              className="absolute"
              style={{
                left: S1_LAYOUT.promoLeft,
                top: S1_LAYOUT.promoTop,
                width: S1_LAYOUT.promoW,
                height: S1_LAYOUT.promoH,
              }}
            >
              <S1SlotPreview
                slotId="promo"
                src={images.promo}
                adjust={adjust.promo}
                placementOverride={{
                  w: S1_LAYOUT.promoW,
                  h: S1_LAYOUT.promoH,
                }}
                fillContainer
                primaryHex={primaryHex}
                className="h-full max-w-none ring-0"
              />
            </div>

            <div
              className="absolute bg-black"
              style={{
                left: S1_LAYOUT.curveLeft,
                top: S1_LAYOUT.curveTop,
                width: S1_LAYOUT.curveW,
                height: S1_LAYOUT.curveH,
              }}
            >
              <S1SlotPreview
                slotId="curveStrip"
                src={images.curveStrip}
                adjust={adjust.curveStrip}
                curveMask
                fillContainer
                primaryHex={primaryHex}
                className="h-full max-w-none ring-0"
                mediaKind={curveStripMediaKind}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
