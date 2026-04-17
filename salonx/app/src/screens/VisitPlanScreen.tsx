import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClientDetails } from "../data/types";
import { colors } from "../theme";
import { wp, hp, ms, vs } from "../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { CalendarBackArrow } from "../components/CalendarHeaderDynamic";
import { useVisitPlanStorage } from "../hooks/useVisitPlanStorage";

type Props = {
  detailId: string;
  clientDetails: ClientDetails;
};

export default function VisitPlanScreen({ detailId, clientDetails }: Props) {
  const { primaryColor } = useTheme();
  const { clientName, services, recommendations } = clientDetails;

  const { computed, resolvedSelected, saveSelection } = useVisitPlanStorage(detailId, {
    services,
    recommendations,
  });

  const selectedServiceIds = useMemo(() => new Set(resolvedSelected.services.map((s) => s.id)), [resolvedSelected.services]);
  const selectedRecIds = useMemo(
    () => new Set(resolvedSelected.recommendations.map((s) => s.id)),
    [resolvedSelected.recommendations],
  );

  const toggleService = useCallback(
    async (id: string) => {
      const next = new Set(selectedServiceIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      await saveSelection({
        selectedServiceIds: [...next],
        selectedRecommendationIds: [...selectedRecIds],
      });
    },
    [saveSelection, selectedServiceIds, selectedRecIds],
  );

  const toggleRec = useCallback(
    async (id: string) => {
      const next = new Set(selectedRecIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      await saveSelection({
        selectedServiceIds: [...selectedServiceIds],
        selectedRecommendationIds: [...next],
      });
    },
    [saveSelection, selectedServiceIds, selectedRecIds],
  );

  const total = useMemo(() => {
    const price = (x: { price?: unknown }) => (typeof x.price === "number" && Number.isFinite(x.price) ? x.price : 0);
    const sTotal = resolvedSelected.services.reduce((sum, s) => sum + price(s), 0);
    const rTotal = resolvedSelected.recommendations.reduce((sum, s) => sum + price(s), 0);
    return sTotal + rTotal;
  }, [resolvedSelected]);

  const appointmentId = useMemo(() => {
    if (typeof detailId !== "string") return null;
    if (!detailId.startsWith("appointment-")) return null;
    const id = detailId.replace("appointment-", "");
    return id.trim().length > 0 ? id : null;
  }, [detailId]);

  const usedToday = useMemo(() => {
    const p = Array.isArray(clientDetails.products) ? clientDetails.products : [];
    return p.slice(0, 2);
  }, [clientDetails.products]);

  const takeHomeSuggested = useMemo(() => {
    const p = Array.isArray(clientDetails.products) ? clientDetails.products : [];
    const fallback = [
      { id: "th-a", brand: "DJ RAMPART", name: "Texture Clay", price: 26 },
      { id: "th-b", brand: "DJ Color", name: "Protect Serum", price: 32 },
    ];
    return p.slice(2, 4).length > 0 ? p.slice(2, 4) : (fallback as any[]);
  }, [clientDetails.products]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12} accessibilityRole="button">
            <CalendarBackArrow />
          </Pressable>
          <Text style={styles.title}>{clientName ? `${clientName.split(" ")[0] ?? "Client"}’s Visit Plan` : "Visit Plan"}</Text>
          <View style={styles.topbarSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Review · Upgrade · Recommend</Text>

        <View style={[styles.planCard, styles.planCardPurple]}>
          <Text style={styles.cardKicker}>◆ SERVICES TODAY</Text>
          {computed.coreServices.map((s) => {
            const selected = selectedServiceIds.has(s.id);
            return (
              <Pressable key={s.id} onPress={() => void toggleService(s.id)} style={styles.cardRow}>
                <Text style={[styles.cardRowName, !selected && styles.cardRowMuted]} numberOfLines={2}>
                  {selected ? "✓ " : ""}{s.name}
                </Text>
                <Text style={[styles.cardRowPrice, styles.pricePurple]}>${Number((s as any).price ?? 0).toFixed(0)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.planCard, styles.planCardMagenta]}>
          <Text style={styles.cardKicker}>✚ UPGRADE NUDGES</Text>
          {[...computed.upgrades, ...computed.addOns].slice(0, 2).map((r) => {
            const selected = selectedRecIds.has(r.id);
            return (
              <Pressable key={r.id} onPress={() => void toggleRec(r.id)} style={styles.toggleRow}>
                <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                  <Text style={[styles.checkboxText, selected && styles.checkboxTextOn]}>{selected ? "✓" : ""}</Text>
                </View>
                <View style={styles.toggleMeta}>
                  <Text style={styles.toggleName} numberOfLines={2}>
                    {r.name}
                  </Text>
                  <Text style={styles.toggleNote} numberOfLines={2}>
                    {selected ? "Locks in vibrancy — essential" : "High recommendation"}
                  </Text>
                </View>
                <Text style={[styles.cardRowPrice, styles.priceMagenta]}>${Number((r as any).price ?? 0).toFixed(0)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.planCard, styles.planCardTeal]}>
          <Text style={styles.cardKicker}>⬤ BACK BAR + TAKE‑HOME</Text>
          <Text style={styles.groupLabel}>USED TODAY</Text>
          {usedToday.length === 0 ? <Text style={styles.cardMuted}>—</Text> : usedToday.map((p: any) => (
            <Text key={String(p.id)} style={styles.bulletLine} numberOfLines={1}>
              • {(p.brand ? `${p.brand} · ` : "") + (p.name ?? "Product")}
            </Text>
          ))}
          <View style={styles.cardDivider} />
          <Text style={styles.groupLabel}>SUGGEST TAKE‑HOME</Text>
          {takeHomeSuggested.map((p: any) => {
            const id = String(p.id);
            const selected = selectedRecIds.has(id);
            return (
              <Pressable key={id} onPress={() => void toggleRec(id)} style={styles.takeHomeRow}>
                <View style={[styles.checkboxSmall, selected && styles.checkboxSmallOn]}>
                  <Text style={[styles.checkboxTextSmall, selected && styles.checkboxTextOn]}>{selected ? "✓" : ""}</Text>
                </View>
                <Text style={styles.takeHomeText} numberOfLines={1}>
                  {(p.brand ? `${p.brand} ` : "") + (p.name ?? "Product")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            // Appointment flow lives inside Client Details tabs now.
            // Keep this as a safe fallback: go back to the client detail route for the appointment.
            if (appointmentId) {
              router.push({ pathname: "/client/[id]", params: { id: `appointment-${appointmentId}` } });
              return;
            }
            router.back();
          }}
          style={[styles.primaryCta, { backgroundColor: primaryColor }]}
          accessibilityRole="button"
          accessibilityLabel="Book Next Experience"
        >
          <Text style={styles.primaryCtaText}>Book Next Experience →</Text>
        </Pressable>

        <Text style={styles.totalHint}>Running total: ${total.toFixed(0)}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeTop: { backgroundColor: colors.background },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingTop: vs(6),
    paddingBottom: vs(6),
  },
  backButton: { width: ms(44), height: ms(44), alignItems: "flex-start", justifyContent: "center" },
  title: { color: colors.text.primary, fontWeight: "900", fontSize: ms(16), letterSpacing: ms(0.2) },
  topbarSpacer: { width: ms(44), height: ms(44) },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(5), paddingBottom: hp(4), gap: vs(12) },

  subtitle: { color: colors.text.muted, fontSize: ms(12), fontWeight: "800", marginTop: vs(2), marginBottom: vs(4) },

  planCard: {
    borderRadius: ms(18),
    padding: ms(14),
    borderWidth: 1,
    borderColor: colors.border.subtle10,
  },
  planCardPurple: { backgroundColor: colors.surface.glass55 },
  planCardMagenta: { backgroundColor: colors.surface.glass55 },
  planCardTeal: { backgroundColor: colors.surface.glass55 },

  cardKicker: { color: colors.text.muted, fontSize: ms(10), fontWeight: "900", letterSpacing: ms(1.2), marginBottom: vs(10) },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: vs(8) },
  cardRowName: { flex: 1, paddingRight: ms(10), color: colors.text.primary, fontSize: ms(13), fontWeight: "900" },
  cardRowMuted: { opacity: 0.5 },
  cardRowPrice: { color: colors.text.primary, fontSize: ms(13), fontWeight: "900" },
  pricePurple: { color: colors.brand },
  priceMagenta: { color: colors.primary },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: ms(10), paddingVertical: vs(10), borderTopWidth: 1, borderTopColor: colors.border.subtle08 },
  checkbox: { width: ms(22), height: ms(22), borderRadius: ms(8), borderWidth: 1, borderColor: colors.border.subtle18, backgroundColor: colors.surface.white06, alignItems: "center", justifyContent: "center" },
  checkboxOn: { borderColor: colors.primary, backgroundColor: colors.surface.white06 },
  checkboxText: { color: colors.text.muted, fontSize: ms(12), fontWeight: "900" },
  checkboxTextOn: { color: colors.text.primary },
  toggleMeta: { flex: 1, minWidth: 0 },
  toggleName: { color: colors.text.primary, fontSize: ms(13), fontWeight: "900" },
  toggleNote: { color: colors.text.quiet, fontSize: ms(11), fontWeight: "800", marginTop: vs(2) },

  groupLabel: { color: colors.text.quiet, fontSize: ms(10), fontWeight: "900", letterSpacing: ms(1.1), marginTop: vs(6) },
  bulletLine: { color: colors.text.secondary, fontSize: ms(12), fontWeight: "800", marginTop: vs(8) },
  cardMuted: { color: colors.text.quiet, fontSize: ms(12), fontWeight: "800", marginTop: vs(8) },
  cardDivider: { height: 1, backgroundColor: colors.border.subtle10, marginTop: vs(12), marginBottom: vs(10) },
  takeHomeRow: { flexDirection: "row", alignItems: "center", gap: ms(10), paddingVertical: vs(10) },
  checkboxSmall: { width: ms(18), height: ms(18), borderRadius: ms(6), borderWidth: 1, borderColor: colors.border.subtle18, backgroundColor: colors.surface.white06, alignItems: "center", justifyContent: "center" },
  checkboxSmallOn: { borderColor: colors.brand, backgroundColor: colors.surface.white06 },
  checkboxTextSmall: { color: colors.text.muted, fontSize: ms(11), fontWeight: "900" },
  takeHomeText: { flex: 1, minWidth: 0, color: colors.text.primary, fontSize: ms(12), fontWeight: "900" },

  primaryCta: { marginTop: vs(8), borderRadius: ms(16), paddingVertical: vs(16), alignItems: "center", justifyContent: "center" },
  primaryCtaText: { color: colors.text.primary, fontWeight: "900", fontSize: ms(13) },
  totalHint: { color: colors.text.quiet, fontSize: ms(11), fontWeight: "800", textAlign: "center" },
});

