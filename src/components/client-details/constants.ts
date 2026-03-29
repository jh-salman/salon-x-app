export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return hexColor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const NEUTRAL_BORDER = "rgba(255,255,255,0.16)";
export const NEUTRAL_PILL_BORDER = "rgba(255,255,255,0.22)";

/** Services overlay: sub-prompts as tappable chips (scrollable row) → append to Update field. */
export const SERVICES_OVERLAY_QUICK_PROMPTS = [
  { id: "review", label: "Review line items", snippet: "Review line items: " },
  { id: "enhance", label: "Enhance result", snippet: "Enhance result: " },
  { id: "timing", label: "Timing / notes", snippet: "Timing / notes: " },
  { id: "price", label: "Price check", snippet: "Price check: " },
] as const;
