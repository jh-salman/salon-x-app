"use client";

import type { CSSProperties } from "react";
import type { S1DemoSlotAdjust, S1DemoSlotId } from "@/lib/salonx-config";
import {
  SLOT_DISPLAY_BOX,
  S1_MASK_POS_PROMO,
  S1_MASK_SIZE,
  hexToRgbTriplet,
  slotImageTransform,
} from "@/lib/s1-slot-geometry";

const CURVE_STRIP_MASK = {
  WebkitMaskImage: "url(/curve-strip-content-mask.svg)",
  maskImage: "url(/curve-strip-content-mask.svg)",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskMode: "alpha",
  maskMode: "alpha",
} as CSSProperties;

function promoPanelMaskStyle(): CSSProperties {
  return {
    WebkitMaskImage: "url(/curve-mask.svg)",
    maskImage: "url(/curve-mask.svg)",
    WebkitMaskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
    maskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: `${S1_MASK_POS_PROMO.x}px ${S1_MASK_POS_PROMO.y}px`,
    maskPosition: `${S1_MASK_POS_PROMO.x}px ${S1_MASK_POS_PROMO.y}px`,
    WebkitMaskMode: "alpha",
    maskMode: "alpha",
  } as CSSProperties;
}

function slotShellStyle(
  slotId: S1DemoSlotId,
  primaryHex: string | undefined,
): CSSProperties {
  const rgb = hexToRgbTriplet(primaryHex ?? "#3b82f6");
  const accentBorder = `1.5px solid rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;

  switch (slotId) {
    case "topBar":
      return {
        backgroundColor: "#3c3c40",
        borderRadius: 11,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      };
    case "hero":
      return {
        backgroundColor: "#2d2d32",
        borderRadius: 16,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      };
    case "promo":
      return {
        backgroundColor: "#3a3a3f",
        borderRadius: 15,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        border: accentBorder,
        boxSizing: "border-box",
      };
    case "curveStrip":
      return {
        backgroundColor: "#000000",
        borderRadius: 0,
      };
    default:
      return {};
  }
}

function displayMaxPx(slotId: S1DemoSlotId): number {
  if (slotId === "curveStrip") return 65;
  if (slotId === "promo") return 395;
  return 388;
}

export function S1SlotPreview({
  slotId,
  src,
  adjust,
  placementOverride,
  className = "",
  curveMask = false,
  fillContainer = false,
  /** Theme border for promo (same alpha as `screen1.css`). */
  primaryHex,
  /** When the parent already applies `/curve-mask.svg` (mini device frame). */
  skipPromoPanelMask = false,
  /** Curve strip only: `image` URL may be a video asset. */
  mediaKind = "image",
}: {
  slotId: S1DemoSlotId;
  src: string;
  adjust: S1DemoSlotAdjust;
  placementOverride?: { w: number; h: number };
  className?: string;
  curveMask?: boolean;
  fillContainer?: boolean;
  primaryHex?: string;
  skipPromoPanelMask?: boolean;
  mediaKind?: "image" | "video";
}) {
  const { w, h } = placementOverride ?? SLOT_DISPLAY_BOX[slotId];
  const maxW = displayMaxPx(slotId);

  const sizeStyle: CSSProperties = fillContainer
    ? { width: "100%", height: "100%", minHeight: 0 }
    : {
        aspectRatio: `${w} / ${h}`,
        width: "100%",
        maxWidth: maxW,
      };

  const shell = slotShellStyle(slotId, primaryHex);
  const usePromoMask =
    slotId === "promo" && !skipPromoPanelMask && !curveMask;
  const maskStyles: CSSProperties = curveMask
    ? CURVE_STRIP_MASK
    : usePromoMask
      ? promoPanelMaskStyle()
      : {};

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...sizeStyle,
        ...shell,
        ...maskStyles,
      }}
    >
      {src ? (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {mediaKind === "video" && slotId === "curveStrip" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={src}
              className="h-full w-full select-none"
              muted
              playsInline
              loop
              autoPlay
              style={{
                objectFit: adjust.fit,
                transform: slotImageTransform(adjust),
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              className="h-full w-full select-none"
              style={{
                objectFit: adjust.fit,
                transform: slotImageTransform(adjust),
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
              draggable={false}
            />
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center px-1 text-center font-semibold text-[10px] tracking-[0.04em] text-white/[0.38]"
          style={
            slotId === "curveStrip"
              ? { fontSize: 8, padding: "0 2px" }
              : undefined
          }
        >
          Tap
        </div>
      )}
    </div>
  );
}
