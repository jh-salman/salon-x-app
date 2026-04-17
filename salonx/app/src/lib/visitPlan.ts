import type { Service } from "../data/types";

export type VisitPlan = {
  coreServices: Service[];
  upgrades: Service[];
  addOns: Service[];
  estimatedTotal: number;
};

function safePrice(s: Service): number {
  const v = (s as unknown as { price?: unknown }).price;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function computeVisitPlan(input: {
  services: Service[];
  recommendations: Service[];
}): VisitPlan {
  const services = Array.isArray(input.services) ? input.services : [];
  const recs = Array.isArray(input.recommendations) ? input.recommendations : [];

  // Current app semantics: `recommendations` are "Enhance result" add-ons.
  const upgrades = recs.slice(0, 1);
  const addOns = recs.slice(1);

  const estimatedTotal =
    services.reduce((sum, s) => sum + safePrice(s), 0) +
    upgrades.reduce((sum, s) => sum + safePrice(s), 0) +
    addOns.reduce((sum, s) => sum + safePrice(s), 0);

  return {
    coreServices: services,
    upgrades,
    addOns,
    estimatedTotal,
  };
}

