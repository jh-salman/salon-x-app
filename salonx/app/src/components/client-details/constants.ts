import type { Product, Service } from "../../data/types";
import { colors } from "../../theme";

export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return hexColor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const NEUTRAL_BORDER = colors.border.subtle14;
export const NEUTRAL_PILL_BORDER = colors.border.subtle18;

/** Services overlay: sub-prompts as tappable chips (scrollable row) → append to Update field. */
export const SERVICES_OVERLAY_QUICK_PROMPTS = [
  { id: "review", label: "Review line items", snippet: "Review line items: " },
  { id: "enhance", label: "Enhance result", snippet: "Enhance result: " },
  { id: "timing", label: "Timing / notes", snippet: "Timing / notes: " },
  { id: "price", label: "Price check", snippet: "Price check: " },
] as const;

/** Create (Visit Plan) tab — fixed mock lines for UI / flow demos. */
export const CREATE_TAB_VISIT_PLAN_MOCK: { services: Service[]; recommendations: Service[] } = {
  services: [
    { id: "create-mock-svc-vivid", name: "Vivid Color — Bright Green", price: 175 },
    { id: "create-mock-svc-shadow", name: "Shadow Root Blend", price: 45 },
  ],
  recommendations: [
    {
      id: "create-mock-rec-gloss",
      name: "Gloss Finish Treatment",
      price: 19,
      caption: "Locks in vibrancy — essential for vivid.",
    },
    {
      id: "create-mock-rec-olaplex",
      name: "Olaplex Bond Builder",
      price: 35,
      caption: "First chemical service · high recommendation.",
    },
    /** Same ids as `CREATE_TAB_PRODUCTS_MOCK.takeHome` so take-home checkmarks persist via visit-plan storage. */
    { id: "create-mock-th-clay", name: "Texture Clay", price: 26 },
    { id: "create-mock-th-serum", name: "Protect Serum", price: 32 },
  ],
};

export const CREATE_TAB_PRODUCTS_MOCK: { usedToday: Product[]; takeHome: Product[] } = {
  usedToday: [
    { id: "create-mock-used-neon", brand: "DJ Color", name: "Neon Green", price: 0 },
    { id: "create-mock-used-clay", brand: "DJ RAMPART", name: "Texture Clay", price: 0 },
  ],
  takeHome: [
    { id: "create-mock-th-clay", brand: "DJ RAMPART", name: "Texture Clay", price: 26 },
    { id: "create-mock-th-serum", brand: "DJ Color", name: "Protect Serum", price: 32 },
  ],
};
