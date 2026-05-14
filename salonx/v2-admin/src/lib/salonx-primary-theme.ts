import type { CSSProperties } from "react";

export const DEFAULT_PRIMARY_HEX = "#3b82f6";

export function normalizePrimaryHex(hex: string | undefined): string {
  let t = (hex || DEFAULT_PRIMARY_HEX).trim();
  if (!t.startsWith("#")) t = `#${t}`;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    t = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(t)) return DEFAULT_PRIMARY_HEX;
  return t.toLowerCase();
}

export function hexToRgb(hex: string) {
  const h = normalizePrimaryHex(hex);
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp255(x: number) {
  return Math.max(0, Math.min(255, Math.round(x)));
}

export function lightenRgb(
  { r, g, b }: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: clamp255(r + (255 - r) * t),
    g: clamp255(g + (255 - g) * t),
    b: clamp255(b + (255 - b) * t),
  };
}

export function darkenRgb(
  { r, g, b }: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: clamp255(r * (1 - t)),
    g: clamp255(g * (1 - t)),
    b: clamp255(b * (1 - t)),
  };
}

export function rgbTupleString(rgb: { r: number; g: number; b: number }) {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/** Same as salonx-web-v2 `accentCardGradientCss`. */
export function accentCardGradientCss(hex: string) {
  const h = normalizePrimaryHex(hex);
  return `linear-gradient(to right, ${h} 0%, ${h}cc 18%, ${h}66 45%, ${h}00 85%)`;
}

/** Inline theme vars for a wrapper (mirrors `applySalonxPrimaryTheme`). */
export function salonxThemeInlineVars(hex: string): CSSProperties {
  const normalized = normalizePrimaryHex(hex);
  const base = hexToRgb(normalized);
  const soft = lightenRgb(base, 0.28);
  const dark = darkenRgb(base, 0.32);
  return {
    ["--salonx-primary" as string]: normalized,
    ["--salonx-primary-rgb" as string]: rgbTupleString(base),
    ["--salonx-primary-soft-rgb" as string]: rgbTupleString(soft),
    ["--salonx-primary-dark-rgb" as string]: rgbTupleString(dark),
  };
}
