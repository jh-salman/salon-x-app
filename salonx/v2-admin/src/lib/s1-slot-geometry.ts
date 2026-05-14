/**
 * Must stay in sync with `Screen1DemoImage.jsx` → `SLOT_PLACEMENT_BOX`
 * and `screen1.css` `--s1-bg-w` / `--s1-bg-h` / demo gray vars.
 */
import type { S1DemoSlotAdjust, S1DemoSlotId } from "./salonx-config";

export const S1_FRAME_W = 393;
export const S1_FRAME_H = 852;

/** Width ÷ height — full-bleed Climax / Screen 5 use the full logical handset. */
export const HANDSET_FRAME_ASPECT = S1_FRAME_W / S1_FRAME_H;

/**
 * Marquee login band in `salonx-web-v2` `Screen0.jsx` — full frame width, 3/5 of handset height.
 * Admin preview + crop modal use this aspect so framing matches the device slot.
 */
export const MARQUEE_SLOT_HEIGHT_RATIO = 0.6;
export const MARQUEE_SLOT_H = S1_FRAME_H * MARQUEE_SLOT_HEIGHT_RATIO;
export const MARQUEE_SLOT_ASPECT = S1_FRAME_W / MARQUEE_SLOT_H;

/**
 * Pinch / resize sheet box in `Screen1DemoImage.jsx` — logical 393-width strip.
 * Prefer `SLOT_DISPLAY_BOX` for admin previews so pixel shapes match `screen1.css`.
 */
export const SLOT_PLACEMENT_BOX: Record<S1DemoSlotId, { w: number; h: number }> = {
  topBar: { w: 393, h: 20 },
  hero: { w: 393, h: 157 },
  promo: { w: 395, h: 70 },
  curveStrip: { w: 65, h: 852 },
};

/**
 * On-screen pixel boxes (`.s1demo-grayStack` width 388×20 / 388×157, promo 395×70).
 * Matches `screen1.css` — stack = 380 + (393 − 385) bleed.
 */
export const SLOT_DISPLAY_BOX: Record<S1DemoSlotId, { w: number; h: number }> = {
  topBar: { w: 388, h: 20 },
  hero: { w: 388, h: 157 },
  promo: { w: 395, h: 70 },
  curveStrip: { w: 65, h: 852 },
};

/** Same asset as `screen1.css` `.s1demo-curveStripSlot` — silhouette beside the neon stroke. */
export const S1_CURVE_STRIP_CONTENT_MASK_URL = "/curve-strip-content-mask.svg" as const;

/** Full-screen curve bite (gray stack / promo) — `screen1.css` `mask-image`. */
export const S1_CURVE_MASK_URL = "/curve-mask.svg" as const;

/**
 * Pixels from top of `.s1demo-grayStack` column to top of hero (top bar + `margin-top` on hero).
 * Matches `screen1.css` `.s1demo-grayStack__topBar` height + `__hero` margin-top.
 */
export const STYLIST_HERO_TOP_IN_STACK_PX = SLOT_DISPLAY_BOX.topBar.h + 10;

/**
 * Border radii for stylist slot frames — keep in sync with `screen1.css`
 * `.s1demo-grayStack__topBar` / `__hero` / `.s1demo-grayPromo` (curve strip uses SVG mask, not radius).
 */
export const S1_SLOT_FRAME_RADIUS_PX: Record<S1DemoSlotId, number> = {
  topBar: 11,
  hero: 16,
  promo: 15,
  curveStrip: 0,
};

/** Same as `.s1demo-grayStack` / `.s1demo-grayPromo` mask canvas in `screen1.css`. */
export const S1_MASK_SIZE = { w: 398, h: 852 } as const;

/** `mask-position` for stack (panel top = stack margin 10px, curve-top -5). */
export const S1_MASK_POS_STACK = { x: -5, y: -15 } as const;

/** `mask-position` Y for hero-only crop modal (aligns `curve-mask.svg` to hero band). */
export const STYLIST_HERO_CROP_MASK_POS_Y =
  S1_MASK_POS_STACK.y - STYLIST_HERO_TOP_IN_STACK_PX;

/** Promo `top: 205px` → curve-top − panel-top = −5 − 205. */
export const S1_MASK_POS_PROMO = { x: -5, y: -210 } as const;

export function hexToRgbTriplet(hex: string): { r: number; g: number; b: number } {
  let t = (hex || "#3b82f6").trim();
  if (!t.startsWith("#")) t = `#${t}`;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    t = `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(t)) return { r: 59, g: 130, b: 246 };
  const n = parseInt(t.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Layout geometry for the mini device frame (matches `screen1.css` demo image rules). */
export const S1_LAYOUT = {
  stackLeft: 5,
  stackTop: 10,
  stackWidth: 388,
  topBarH: 20,
  heroGap: 10,
  heroH: 157,
  promoLeft: 5,
  promoTop: 205,
  promoW: 395,
  promoH: 70,
  curveLeft: 333,
  curveTop: 0,
  curveW: 65,
  curveH: 852,
} as const;

/** Same transform string as `Screen1DemoImage` slots. */
export function slotImageTransform(adjust: S1DemoSlotAdjust): string {
  return `translate(${adjust.tx}%, ${adjust.ty}%) rotate(${adjust.rotate}deg) scale(${adjust.scale})`;
}
