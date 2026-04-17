import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Service } from "../data/types";
import { computeVisitPlan, type VisitPlan } from "../lib/visitPlan";

export type VisitPlanStored = {
  /** IDs of selected core service items (matches `clientDetails.services` IDs). */
  selectedServiceIds: string[];
  /** IDs of selected recommended items (matches `clientDetails.recommendations` IDs). */
  selectedRecommendationIds: string[];
  updatedAt: number;
};

function planKey(detailId: string) {
  return `@visit_plan:${detailId}`;
}

async function readStored(detailId: string): Promise<VisitPlanStored | null> {
  const raw = await AsyncStorage.getItem(planKey(detailId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as VisitPlanStored;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function writeStored(detailId: string, next: VisitPlanStored): Promise<void> {
  await AsyncStorage.setItem(planKey(detailId), JSON.stringify(next));
}

export function useVisitPlanStorage(detailId: string | null | undefined, input: { services: Service[]; recommendations: Service[] }) {
  const [stored, setStored] = useState<VisitPlanStored | null>(null);
  const [loading, setLoading] = useState(false);

  const computed = useMemo<VisitPlan>(() => computeVisitPlan(input), [input]);

  const refresh = useCallback(async () => {
    if (!detailId) return;
    setLoading(true);
    try {
      setStored(await readStored(detailId));
    } finally {
      setLoading(false);
    }
  }, [detailId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSelection = useCallback(
    async (next: { selectedServiceIds: string[]; selectedRecommendationIds: string[] }) => {
      if (!detailId) return;
      const payload: VisitPlanStored = {
        selectedServiceIds: next.selectedServiceIds,
        selectedRecommendationIds: next.selectedRecommendationIds,
        updatedAt: Date.now(),
      };
      await writeStored(detailId, payload);
      setStored(payload);
    },
    [detailId],
  );

  const resolvedSelected = useMemo(() => {
    const sIds = new Set(stored?.selectedServiceIds ?? computed.coreServices.map((s) => s.id));
    const rIds = new Set(stored?.selectedRecommendationIds ?? []);
    return {
      services: computed.coreServices.filter((s) => sIds.has(s.id)),
      recommendations: [...computed.upgrades, ...computed.addOns].filter((r) => rIds.has(r.id)),
    };
  }, [stored, computed]);

  return { computed, stored, loading, refresh, saveSelection, resolvedSelected };
}

