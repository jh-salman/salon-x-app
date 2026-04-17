import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type { ClientDetails } from "../../data/types";
import { TabCareContent, TabConsultContent, TabCreateContent, TabInfoContent, TabRebookContent } from "./AppointmentFlowTabContent";
import { colors } from "../../theme";
import { ms, vs } from "../../utils/responsive";
import { useAppointmentMedia } from "../../hooks/useAppointmentMedia";
import { useVisitPlanStorage } from "../../hooks/useVisitPlanStorage";
import { useNextAppointmentStorage } from "../../hooks/useNextAppointmentStorage";
import RampPostBuilderScreen from "./RampPostBuilderScreen";

export type ClientDetailsJourneyStepId = "info" | "consultation" | "services" | "maintain" | "planNext";
export type ClientDetailsStepState = "completed" | "current" | "upcoming";
export type ClientDetailsStep = { label: string; state: ClientDetailsStepState; key?: ClientDetailsJourneyStepId };

const JOURNEY_STEPS: { key: ClientDetailsJourneyStepId; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "consultation", label: "Consult" },
  { key: "services", label: "Create" },
  { key: "maintain", label: "Care" },
  { key: "planNext", label: "Rebook" },
];

const DEFAULT_PROGRESS: Record<ClientDetailsJourneyStepId, boolean> = {
  info: true,
  consultation: true,
  services: true,
  maintain: true,
  planNext: false,
};

/** S2 mock content for top-tabs (Phase 2 Client Screen). */
export const S2_TAB_MOCK = {
  info: {
    history: [
      { date: "3.02.2026", service: "Gloss + Trim", note: "Formula: 6N + 7G · 1:1 · 20m" },
      { date: "1.12.2026", service: "Balayage Refresh", note: "Money piece lift · low heat" },
      { date: "11.18.2025", service: "Root Melt", note: "Soft blend, keep dimension" },
    ],
    intel: [
      "Acquisition: referral (Afterburner)",
      "Preference: cool-toned finish, low maintenance",
      "Boundary: no strong fragrance in products",
      "Timing: prefers 10am–2pm",
    ],
  },
  consult: {
    aiBrief: [
      "Client status: REPEAT · VIP potential",
      "Last visit focus: tone correction + shine",
      "Today target: glossy neutral with soft face frame",
      "Watch-outs: sensitive scalp; avoid high heat",
    ],
    intake: [
      { label: "Allergies", value: "None reported" },
      { label: "Heat styling", value: "2–3x / week" },
      { label: "Goal", value: "Shine + low-maintenance color" },
    ],
  },
  create: {
    requested: [
      { name: "Root touch-up", price: "$85" },
      { name: "Gloss", price: "$55" },
      { name: "Trim", price: "$25" },
    ],
    suggested: [
      { name: "Bond builder", price: "$25" },
      { name: "Face frame", price: "$45" },
    ],
    notes: [
      "Timing: keep total under 2h",
      "Technique: low heat, protect scalp",
      "Finish: soft waves, glossy serum",
    ],
  },
  care: {
    optionalPhoto: {
      label: "OPTIONAL — add before/after photo",
      status: "Not added yet",
    },
    products: [
      { name: "Hydrating Shampoo", brand: "SalonX", price: "$28" },
      { name: "Gloss Mask", brand: "SalonX", price: "$34" },
      { name: "Heat Protect Spray", brand: "SalonX", price: "$22" },
    ],
    aftercare: [
      "Wash 2–3x/week",
      "Heat protect every styling",
      "Mask 1x/week for shine",
    ],
  },
  rebook: {
    suggestedDate: "5 weeks",
    suggestedService: "Gloss + Trim",
    reason: "Maintain tone and shine; keep ends healthy",
    checkout: ["Confirm services", "Capture products used", "Proceed to checkout (S4)"],
  },
} as const;

export function getProgressPercent(steps: ClientDetailsStep[] | undefined): string {
  if (!Array.isArray(steps) || steps.length === 0) return "0%";
  const completedCount = steps.filter((step) => step.state === "completed").length;
  return `${(completedCount / steps.length) * 100}%`;
}

export function getProgressRatio(steps: ClientDetailsStep[] | undefined): number {
  if (!Array.isArray(steps) || steps.length === 0) return 0;
  const completedCount = steps.filter((step) => step.state === "completed").length;
  return completedCount / steps.length;
}

export const TEST_CASES: Array<{ name: string; input: ClientDetailsStep[]; expected: string }> = [
  {
    name: "2 of 5 steps completed",
    input: [
      { label: "Info", state: "completed" },
      { label: "Consult", state: "completed" },
      { label: "Create", state: "current" },
      { label: "Care", state: "upcoming" },
      { label: "Rebook", state: "upcoming" },
    ],
    expected: "40%",
  },
  {
    name: "all steps completed",
    input: [
      { label: "Info", state: "completed" },
      { label: "Consult", state: "completed" },
      { label: "Create", state: "completed" },
      { label: "Care", state: "completed" },
      { label: "Rebook", state: "completed" },
    ],
    expected: "100%",
  },
  {
    name: "no steps completed yet",
    input: [
      { label: "Info", state: "current" },
      { label: "Consult", state: "upcoming" },
      { label: "Create", state: "upcoming" },
      { label: "Care", state: "upcoming" },
      { label: "Rebook", state: "upcoming" },
    ],
    expected: "0%",
  },
  {
    name: "empty steps array",
    input: [],
    expected: "0%",
  },
];

export type ClientDetailsHeaderProps = {
  displayName: string;
  visitCount?: number | null;
  /** `require()` asset id or undefined for placeholder initial */
  photo?: ImageSourcePropType | null;
  /** First line shown after “Today’s focus: ” */
  focusSnippet?: string | null;
  primaryColor: string;
  progressStepsVisited?: Partial<Record<ClientDetailsJourneyStepId, boolean>>;
  /** When present, appointment flow screens render inside tabs */
  appointmentId?: string;
  /** Usually `appointment-${appointmentId}` */
  detailId?: string;
  clientDetails?: ClientDetails;
};

const TopTabs = createMaterialTopTabNavigator();

export type ClientDetailsFlowApi = {
  goTo: (name: "Info" | "Consult" | "Create" | "Rebook" | "Care") => void;
  openRamp: () => void;
};

export const ClientDetailsFlowContext = createContext<ClientDetailsFlowApi | null>(null);

export function ClientDetailsHeaderSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-ms(120), ms(240)] });
  const shimmerStyle = { transform: [{ translateX }], opacity: 0.9 };

  const SkeletonBlock = ({ style }: { style: any }) => (
    <View style={[s.skelBlock, style]}>
      <Animated.View style={[s.skelShimmer, shimmerStyle]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.topBlock}>
        <SkeletonBlock style={s.skelAvatar} />
        <View style={s.rightStack}>
          <View style={s.metaRow}>
            <SkeletonBlock style={s.skelVisits} />
            <SkeletonBlock style={s.skelName} />
          </View>
          <SkeletonBlock style={s.skelFocus} />
        </View>
      </View>

      <View style={[s.pillsWrap, s.tabBarFixedHeight]}>
        <View style={s.pillsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} style={s.skelPill} />
          ))}
        </View>
        <SkeletonBlock style={s.skelProgress} />
      </View>

      {/* body placeholder */}
      <ScrollView style={s.dummyScroll} contentContainerStyle={s.dummyScrollContent} showsVerticalScrollIndicator={false}>
        <SkeletonBlock style={s.skelCard} />
        <SkeletonBlock style={s.skelCard} />
        <SkeletonBlock style={s.skelCard} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: "100%",
    backgroundColor: colors.background,
    paddingHorizontal: ms(16),
    paddingTop: vs(10),
    paddingBottom: vs(10),
    flex: 1,
  },
  topBlock: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: ms(1),
  },
  rightStack: {
    flex: 1,
    minWidth: 0,
    gap: vs(8),
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    width: "100%",
  },

  avatarOuter: {
    width: ms(72),
    height: ms(72),
    padding: ms(2),
    borderRadius: ms(38),
  },
  avatarRing: {
    flex: 1,
    borderRadius: ms(36),
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: colors.surface.white06,
    borderColor: colors.border.subtle20,
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: ms(36) },
  avatarPlaceholder: {
    backgroundColor: "#EDC4C4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: ms(28), color: "#000000", fontWeight: "800" },

  visitsPill: {
    flexShrink: 0,
    paddingHorizontal: ms(12),
    paddingVertical: vs(5),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: colors.text.primary,
    backgroundColor: colors.bg,
  },
  visitsText: { color: colors.text.primary, fontSize: ms(12), fontWeight: "800" },

  nameBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    justifyContent: "flex-start",
  },
  nameText: { color: colors.text.primary, fontSize: ms(17), fontWeight: "800", flexShrink: 1 },
  nameDash: { color: colors.text.primary, fontSize: ms(17), fontWeight: "600" },

  focusLine: {
    color: colors.text.primary,
    fontSize: ms(13),
    fontWeight: "400",
    textAlign: "left",
  },

  pillsWrap: { width: "100%", marginTop: vs(2) },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ms(4),
    width: "100%",
  },
  pill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(5),
    borderRadius: ms(999),
    paddingVertical: vs(2),
    paddingHorizontal: ms(1),
    borderWidth: 1,
    overflow: "hidden",
  },
  pillFuture: {
    borderColor: colors.text.primary,
    backgroundColor: "transparent",
    opacity: 0.55,
  },
  pillUpcomingWhite: {
    borderColor: colors.text.primary,
    backgroundColor: colors.bg,
  },
  pillTextCompleted: { color: colors.text.primary, fontSize: ms(11), fontWeight: "700" },
  pillTextCurrent: { color: colors.text.primary, fontSize: ms(11), fontWeight: "700" },
  pillTextFuture: { color: colors.text.muted, fontSize: ms(11), fontWeight: "700" },
  pillTextUpcomingDark: { color: colors.text.muted, fontSize: ms(11), fontWeight: "700" },
  pillGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: ms(999),
  },
  pillGlass: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: ms(999),
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  progressTrack: {
    height: vs(4),
    borderRadius: ms(999),
    backgroundColor: colors.bg,
    overflow: "hidden",
    marginTop: vs(6),
  },
  progressFillFull: {
    height: "100%",
    width: "100%",
    borderRadius: ms(999),
    alignSelf: "flex-start",
  },
  /** Give the top-tabs container real height so tabBar renders. */
  topTabsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  /** Fixed visual height for the pill+progress tab bar. */
  tabBarFixedHeight: {
    paddingTop: vs(2),
    paddingBottom: vs(4),
  },

  // --- Dummy content (tab bodies) ---
  dummyScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dummyScrollContent: {
    paddingHorizontal: ms(16),
    paddingTop: vs(18),
    paddingBottom: vs(28),
    gap: vs(12),
  },
  dummyTitle: {
    color: colors.text.primary,
    fontSize: ms(18),
    fontWeight: "800",
    marginBottom: vs(4),
  },
  dummyCard: {
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: colors.border.subtle12,
    backgroundColor: colors.bg,
    paddingHorizontal: ms(14),
    paddingVertical: vs(14),
  },
  dummyCardTitle: {
    color: colors.text.primary,
    fontSize: ms(14),
    fontWeight: "800",
    marginBottom: vs(6),
  },
  dummyCardBody: {
    color: colors.text.secondary,
    fontSize: ms(13),
    fontWeight: "600",
    lineHeight: ms(18),
  },

  // --- Skeleton ---
  skelBlock: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: ms(16),
    overflow: "hidden",
  },
  skelShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: ms(160),
  },
  skelAvatar: { width: ms(72), height: ms(72), borderRadius: ms(36) },
  skelVisits: { width: ms(92), height: vs(26), borderRadius: ms(999) },
  skelName: { flex: 1, height: vs(26), borderRadius: ms(12) },
  skelFocus: { width: "92%", height: vs(20), borderRadius: ms(10) },
  skelPill: { flex: 1, height: vs(30), borderRadius: ms(999) },
  skelProgress: { width: "100%", height: vs(8), borderRadius: ms(999), backgroundColor: colors.bg },
  skelCard: { height: vs(88), borderRadius: ms(16) },

  overlayFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 50,
  },
  overlayClose: {
    position: "absolute",
    right: ms(16),
    top: vs(10),
    borderRadius: ms(999),
    paddingHorizontal: ms(14),
    paddingVertical: vs(10),
    backgroundColor: colors.surface.white06,
    borderWidth: 1,
    borderColor: colors.border.subtle12,
  },
  overlayCloseText: { color: colors.text.primary, fontSize: ms(12), fontWeight: "900" },
});

export function ClientDetailsHeader({
  displayName,
  visitCount,
  photo,
  focusSnippet,
  primaryColor,
  progressStepsVisited: progressOverride,
  appointmentId,
  detailId,
  clientDetails,
}: ClientDetailsHeaderProps) {
  const progressStepsVisited = useMemo(
    () => ({ ...DEFAULT_PROGRESS, ...progressOverride }),
    [progressOverride]
  );

  const safeName =
    typeof displayName === "string" && displayName.trim().length > 0 ? displayName.trim() : "Client";
  const initial = safeName.charAt(0).toUpperCase();
  const visitLabel =
    typeof visitCount === "number" && visitCount >= 0 ? `${visitCount} visits` : "— visits";
  const focusBody = focusSnippet?.trim() ? focusSnippet.trim() : "—";
  const hasFlowContext = Boolean(appointmentId && detailId && clientDetails);

  // Unlock system (only applies when we have appointment context)
  const media = useAppointmentMedia(hasFlowContext ? detailId! : "noop");
  const plan = useVisitPlanStorage(hasFlowContext ? detailId! : "noop", {
    services: hasFlowContext ? (Array.isArray(clientDetails!.services) ? clientDetails!.services : []) : [],
    recommendations: hasFlowContext ? (Array.isArray(clientDetails!.recommendations) ? clientDetails!.recommendations : []) : [],
  });
  const next = useNextAppointmentStorage(hasFlowContext ? detailId! : "noop");

  const hasBefore = hasFlowContext ? Boolean(media.hasBefore) : true;
  const hasPlan = hasFlowContext ? (plan.resolvedSelected?.services?.length ?? 0) > 0 : true;
  const hasNext = hasFlowContext ? Boolean(next.resolved?.startAt && next.resolved?.endAt) : true;

  const unlockedByTab = useMemo(() => {
    if (!hasFlowContext) return { Info: true, Consult: true, Create: true, Rebook: true, Care: true };
    return {
      Info: true,
      Consult: true,
      Create: hasBefore,
      Rebook: hasBefore && hasPlan,
      Care: hasBefore && hasPlan && hasNext,
    };
  }, [hasFlowContext, hasBefore, hasPlan, hasNext]);

  const [overlay, setOverlay] = useState<null | "ramp">(null);
  const overlayActive = overlay != null;

  const tabNavRef = useRef<any>(null);

  const currentStep = useMemo<ClientDetailsJourneyStepId>(() => {
    const firstNotVisited = JOURNEY_STEPS.find((s) => !progressStepsVisited[s.key]);
    return (firstNotVisited?.key ?? "planNext") as ClientDetailsJourneyStepId;
  }, [progressStepsVisited]);

  return (
    <View style={s.root}>
      <View style={s.topBlock}>
        <View style={s.avatarOuter}>
          <View style={s.avatarRing}>
            {photo != null ? (
              <Image source={photo} style={s.avatarImg} resizeMode="cover" />
            ) : (
              <View style={[s.avatarImg, s.avatarPlaceholder]}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.rightStack}>
          <View style={s.metaRow}>
            <View style={s.visitsPill}>
              <Text style={s.visitsText}>{visitLabel}</Text>
            </View>
            <View style={s.nameBlock}>
              <Text style={s.nameText} numberOfLines={1}>
                {safeName}
              </Text>
              <Text style={s.nameDash}> — </Text>
              <MaterialCommunityIcons name="dots-vertical" size={ms(18)} color={colors.text.primary} />
            </View>
          </View>
          <Text style={s.focusLine} numberOfLines={2}>
            Today’s focus: {focusBody}
          </Text>
        </View>
      </View>

      {/* TopTabBar (steps) + content area (fills to bottom) */}
      <View style={s.topTabsContainer}>
        <ClientDetailsFlowContext.Provider
          value={{
            goTo: (name) => {
              if (!unlockedByTab[name]) return;
              if (overlayActive) setOverlay(null);
              tabNavRef.current?.navigate?.(name);
            },
            openRamp: () => setOverlay("ramp"),
          }}
        >
          <TopTabs.Navigator
            initialRouteName="Info"
            screenOptions={{
              swipeEnabled: false,
              lazy: true,
              sceneStyle: { paddingTop: 0 },
            }}
            tabBar={(props) => (
              <ClientDetailsStepsTopTabBar
                {...props}
                primaryColor={primaryColor}
                unlockedByTab={unlockedByTab}
                setTabNav={(nav: any) => {
                  tabNavRef.current = nav;
                }}
              />
            )}
          >
            <TopTabs.Screen name="Info">
              {() =>
                hasFlowContext ? (
                  <TabInfoContent appointmentId={appointmentId!} clientDetails={clientDetails!} />
                ) : (
                  <DummyTabContent title="Info" />
                )
              }
            </TopTabs.Screen>
            <TopTabs.Screen name="Consult">
              {() =>
                hasFlowContext ? (
                  <TabConsultContent appointmentId={appointmentId!} detailId={detailId!} clientDetails={clientDetails!} />
                ) : (
                  <DummyTabContent title="Consult" />
                )
              }
            </TopTabs.Screen>
            <TopTabs.Screen name="Create">
              {() =>
                hasFlowContext ? (
                  <TabCreateContent detailId={detailId!} clientDetails={clientDetails!} />
                ) : (
                  <DummyTabContent title="Create" />
                )
              }
            </TopTabs.Screen>
            <TopTabs.Screen name="Care">
              {() =>
                hasFlowContext ? (
                  <TabCareContent appointmentId={appointmentId!} detailId={detailId!} clientDetails={clientDetails!} />
                ) : (
                  <DummyTabContent title="Care" />
                )
              }
            </TopTabs.Screen>
            <TopTabs.Screen name="Rebook">
              {() =>
                hasFlowContext ? (
                  <TabRebookContent appointmentId={appointmentId!} detailId={detailId!} />
                ) : (
                  <DummyTabContent title="Rebook" />
                )
              }
            </TopTabs.Screen>
          </TopTabs.Navigator>
        </ClientDetailsFlowContext.Provider>

        {/* Overlay (component → component, no separate route) */}
        {hasFlowContext && overlay === "ramp" ? (
          <View style={s.overlayFill}>
            <RampPostBuilderScreen
              appointmentId={appointmentId!}
              detailId={detailId!}
              clientDetails={clientDetails!}
              onDone={() => setOverlay(null)}
            />
            <Pressable onPress={() => setOverlay(null)} style={s.overlayClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={s.overlayCloseText}>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ClientDetailsStepsTopTabBar({ state, descriptors, navigation, position, primaryColor, unlockedByTab, setTabNav }: any) {
  useEffect(() => {
    setTabNav?.(navigation);
  }, [navigation, setTabNav]);

  const stepIndexByName = useMemo(() => {
    const map: Record<string, number> = {};
    state.routes.forEach((r: any, idx: number) => {
      map[String(r.name)] = idx;
    });
    return map;
  }, [state.routes]);

  const isUnlocked = useCallback(
    (routeName: string) => {
      if (!unlockedByTab) return true;
      return unlockedByTab[routeName] !== false;
    },
    [unlockedByTab],
  );

  const targetRatio = useMemo(() => {
    // Progress line is 4 steps (between 5 tabs): 0%, 25%, 50%, 75%, 100%
    const totalSteps = 4;
    // completed segments = number of completed steps before current, capped to 4
    const focusedIdx = Math.max(0, Math.min(state.routes.length - 1, state?.index ?? 0));
    const completedCount = Math.max(0, Math.min(totalSteps, focusedIdx));
    return completedCount / totalSteps;
  }, [state.index, state.routes.length]);

  const animRatio = useRef(new Animated.Value(targetRatio)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    Animated.timing(animRatio, {
      toValue: targetRatio,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [animRatio, targetRatio]);

  return (
    <View style={[s.pillsWrap, s.tabBarFixedHeight]}>
      <View style={s.pillsRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const isFocused = state.index === index;
          const focusedIdx = state.index ?? 0;
          const locked = !isUnlocked(String(route.name));
          const isCompleted = !locked && index < focusedIdx;
          const isUpcoming = index > focusedIdx;

          const inputRange = state.routes.map((_: any, i: number) => i);
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((i: number) => (i === index ? 1 : 0.9)),
          });

          const onPress = () => {
            if (locked) return;
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!event.defaultPrevented) navigation.navigate(route.name);
          };

          const pillStyle = isCompleted
            ? [s.pill, { borderColor: primaryColor, backgroundColor: "transparent", opacity: 1 }]
            : isFocused
              ? [s.pill, { borderColor: primaryColor, backgroundColor: "transparent", opacity: 1 }]
              : isUpcoming
                ? [s.pill, s.pillUpcomingWhite, locked ? { opacity: 0.28 } : null]
                : [s.pill, s.pillUpcomingWhite, locked ? { opacity: 0.28 } : null];

          const textStyle = isCompleted
            ? s.pillTextCompleted
            : isFocused
              ? s.pillTextCurrent
              : locked
                ? s.pillTextFuture
                : s.pillTextUpcomingDark;

          return (
            <Pressable key={route.key} style={pillStyle} onPress={onPress} hitSlop={6}>
              {isCompleted ? (
                <>
                  <LinearGradient
                    colors={[
                      "rgba(145, 4, 133, 0.55)",
                      "rgba(147, 51, 234, 0.35)",
                      "rgba(255, 24, 236, 0.22)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.pillGradient}
                  />
                  <View style={s.pillGlass} />
                  <MaterialCommunityIcons name="check" size={ms(13)} color={colors.text.primary} />
                </>
              ) : null}
              {/* Only completed shows tickmark (no icon for current/upcoming) */}
              <Animated.Text style={[textStyle, { opacity }]} numberOfLines={1}>
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={s.progressTrack}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setTrackWidth(w);
        }}
      >
        <Animated.View
          style={[
            s.progressFillFull,
            {
              backgroundColor: primaryColor,
              width: trackWidth > 0 ? Animated.multiply(animRatio, trackWidth) : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}

function DummyTabContent({ title }: { title: string }) {
  const sections = useMemo(() => {
    switch (title) {
      case "Info":
        return [
          {
            head: "Client history",
            body: S2_TAB_MOCK.info.history
              .map((h) => `• ${h.date} · ${h.service}\n  ${h.note}`)
              .join("\n\n"),
          },
          {
            head: "Relationship intel (TAG)",
            body: S2_TAB_MOCK.info.intel.map((x) => `• ${x}`).join("\n"),
          },
        ];
      case "Consult":
        return [
          {
            head: "AI brief (GHOST NOTES)",
            body: [
              "Pre-loaded consultation intelligence (mock):",
              ...S2_TAB_MOCK.consult.aiBrief.map((x) => `• ${x}`),
            ].join("\n"),
          },
          {
            head: "Consultation field",
            body: [
              "Editable consultation notes (mock):",
              ...S2_TAB_MOCK.consult.intake.map((x) => `• ${x.label}: ${x.value}`),
              "",
              "Pre-fill with AI brief; stylist can adjust.",
            ].join("\n"),
          },
        ];
      case "Create":
        return [
          {
            head: "Requested vs Suggested (2 columns)",
            body: [
              "Requested (left):",
              ...S2_TAB_MOCK.create.requested.map((x) => `• ${x.name} · ${x.price}`),
              "",
              "Suggested (right):",
              ...S2_TAB_MOCK.create.suggested.map((x) => `• ${x.name} · ${x.price}`),
            ].join("\n"),
          },
          {
            head: "Services detail",
            body: ["Notes (mock):", ...S2_TAB_MOCK.create.notes.map((x) => `• ${x}`)].join("\n"),
          },
        ];
      case "Care":
        return [
          {
            head: "Photo section (OPTIONAL)",
            body: [
              S2_TAB_MOCK.care.optionalPhoto.label,
              `Status: ${S2_TAB_MOCK.care.optionalPhoto.status}`,
              "",
              "Before / After capture (mock).",
            ].join("\n"),
          },
          {
            head: "Care package",
            body: [
              "Products (mock):",
              ...S2_TAB_MOCK.care.products.map((p) => `• ${p.brand} ${p.name} · ${p.price}`),
              "",
              "Aftercare (mock):",
              ...S2_TAB_MOCK.care.aftercare.map((x) => `• ${x}`),
            ].join("\n"),
          },
        ];
      case "Rebook":
        return [
          {
            head: "Plan next visit",
            body: [
              `Suggested: ${S2_TAB_MOCK.rebook.suggestedDate}`,
              `Service: ${S2_TAB_MOCK.rebook.suggestedService}`,
              "",
              `Why: ${S2_TAB_MOCK.rebook.reason}`,
            ].join("\n"),
          },
          {
            head: "Checkout handoff (S4)",
            body: ["Next actions (mock):", ...S2_TAB_MOCK.rebook.checkout.map((x) => `• ${x}`)].join("\n"),
          },
        ];
      default:
        return [
          {
            head: "Summary",
            body:
              "Placeholder content for this step. Replace with real UI when the flow screens are ready.",
          },
        ];
    }
  }, [title]);

  return (
    <ScrollView style={s.dummyScroll} contentContainerStyle={s.dummyScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.dummyTitle}>{title}</Text>

      {sections.map((sec) => (
        <View key={sec.head} style={s.dummyCard}>
          <Text style={s.dummyCardTitle}>{sec.head}</Text>
          <Text style={s.dummyCardBody}>{sec.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
