import type { S1DemoSlotAdjust } from "@/lib/salonx-config";

export type CropPan = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Map Build Station visual editor state → salonx-web-v2 slot transform (same storage as pinch editor).
 * Matches `VisualImageAdjustModal` image style:
 * `translate(crop.x%, crop.y%) rotate(...) scale(zoom)` — same order as `slotImageTransform`.
 */
export function cropInteractionToAdjust(
  crop: CropPan,
  zoom: number,
  rotation: number,
  fit: "cover" | "contain",
): S1DemoSlotAdjust {
  const z = clamp(zoom, 1, 8);
  return {
    scale: clamp(z, 0.35, 60),
    rotate: clamp(rotation, -180, 180),
    tx: clamp(crop.x, -50, 50),
    ty: clamp(crop.y, -50, 50),
    fit,
  };
}

/** Best-effort inverse so reopening the modal starts near the saved framing. */
export function adjustToCropInteraction(a: S1DemoSlotAdjust): {
  crop: CropPan;
  zoom: number;
  rotation: number;
} {
  return {
    crop: {
      x: clamp(a.tx, -150, 150),
      y: clamp(a.ty, -150, 150),
    },
    zoom: clamp(typeof a.scale === "number" ? a.scale : 1, 1, 8),
    rotation: clamp(a.rotate, -180, 180),
  };
}
