import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { format, addWeeks } from "date-fns";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CalendarBackArrow } from "../components/CalendarHeaderDynamic";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { ClientDetails } from "../data/clients";
import type { ConsultationTimelineEntry, IsoDateString, Product, Service } from "../data/types";
import { AddRetailProductFlowModal } from "../components/retail/AddRetailProductFlowModal";
import { AddServiceFromCatalogModal } from "../components/services/AddServiceFromCatalogModal";
import { MOCK_CONSULTATION_TIMELINE_PREVIOUS_BODIES, MOCK_OVERLAY_PAST_VISITS } from "../data/mockData";
import { wp, hp, ms, vs } from "../utils/responsive";
import { useTheme } from "../context/ThemeContext";
import { NEUTRAL_BORDER, NEUTRAL_PILL_BORDER } from "../components/client-details/constants";
import type { SectionId } from "../components/client-details/types";
import { ClientDetailsSectionOverlay } from "../components/client-details/ClientDetailsSectionOverlay";
import {
  BottomActionButton,
  InteractiveSectionCard,
  ServiceItem,
} from "../components/client-details/SectionComponents";
import { clientDetailsStyles as styles } from "../components/client-details/completeClientDetailsStyles";

/** First tap on each of these opens overlay and adds 25% to the progress bar (4 × 25% = 100%). */
type ProgressStepId = "consultation" | "services" | "maintain" | "notes";

interface CompleteClientDetailsScreenProps {
  clientDetails: ClientDetails;
}

export default function CompleteClientDetailsScreen({ clientDetails }: CompleteClientDetailsScreenProps) {
  const { primaryColor } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [sectionOverlay, setSectionOverlay] = useState<SectionId | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<SectionId, boolean>>({
    consultation: false,
    services: false,
    maintain: false,
    notes: false,
    planNext: false,
    completeVisit: false,
  });
  const [draftBySection, setDraftBySection] = useState<Record<SectionId, string>>({
    consultation: "",
    services: "",
    maintain: "",
    notes: "",
    planNext: "",
    completeVisit: "",
  });

  const [progressStepsVisited, setProgressStepsVisited] = useState<Record<ProgressStepId, boolean>>({
    consultation: false,
    services: false,
    maintain: false,
    notes: false,
  });

  /** Salon retail added this session (Maintain this look → Add products). */
  const [sessionRetailProducts, setSessionRetailProducts] = useState<Product[]>([]);
  const [addRetailModalVisible, setAddRetailModalVisible] = useState(false);

  /** Services added this session (Services → Add services → catalog wheel). */
  const [sessionAddedServices, setSessionAddedServices] = useState<Service[]>([]);
  const [addServiceModalVisible, setAddServiceModalVisible] = useState(false);

  const mainCardsBandRef = useRef<View>(null);
  /** Screen-space band: Consultation card top → Client Notes card bottom (popup + blur match this column). */
  const [cardBandRect, setCardBandRect] = useState<{ top: number; height: number } | null>(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTranslateY = useRef(new Animated.Value(ms(28))).current;
  const glowPulseBySection = useRef({
    consultation: new Animated.Value(0),
    services: new Animated.Value(0),
    maintain: new Animated.Value(0),
    notes: new Animated.Value(0),
    planNext: new Animated.Value(0),
    completeVisit: new Animated.Value(0),
  }).current;

  const openOverlay = useCallback(
    (id: SectionId) => {
      if (id === "consultation" || id === "services" || id === "maintain" || id === "notes") {
        setProgressStepsVisited((prev) => ({ ...prev, [id]: true }));
      }
      setSectionOverlay(id);
      overlayOpacity.setValue(0);
      overlayTranslateY.setValue(ms(28));
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(overlayTranslateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [overlayOpacity, overlayTranslateY]
  );

  const measureMainCardsBand = useCallback(() => {
    requestAnimationFrame(() => {
      mainCardsBandRef.current?.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          setCardBandRect({ top: y, height: h });
        }
      });
    });
  }, []);

  const appendServicesDraftSnippet = useCallback((snippet: string) => {
    setDraftBySection((prev) => {
      const cur = prev.services.trimEnd();
      const next = cur.length > 0 ? `${cur}\n${snippet}` : snippet;
      return { ...prev, services: next };
    });
  }, []);

  const triggerGlowPulse = useCallback(
    (id: SectionId) => {
      const v = glowPulseBySection[id];
      v.setValue(0);
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ]).start();
    },
    [glowPulseBySection]
  );

  const closeOverlay = useCallback(
    (markComplete: boolean) => {
      const id = sectionOverlay;
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayTranslateY, {
          toValue: ms(28),
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setSectionOverlay(null);
        if (markComplete && id) {
          setCompletedSections((prev) => ({ ...prev, [id]: true }));
          setTimeout(() => triggerGlowPulse(id), 100);
        }
      });
    },
    [sectionOverlay, overlayOpacity, overlayTranslateY, triggerGlowPulse]
  );

  const {
    clientName,
    phone,
    clientPhoto,
    date,
    duration,
    techniqueNotes,
    personalNotes,
    services,
    products,
    recommendations,
  } = clientDetails;

  const safeClientName = typeof clientName === "string" && clientName.length > 0 ? clientName : "Client";
  const safeTechniqueNotes = Array.isArray(techniqueNotes) ? techniqueNotes : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  const mergedServices = useMemo(() => {
    const merged = [...safeServices, ...sessionAddedServices];
    const seen = new Set<string>();
    return merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [safeServices, sessionAddedServices]);

  const excludeCatalogServiceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of mergedServices) {
      if (s.catalogServiceId) ids.add(s.catalogServiceId);
    }
    return [...ids];
  }, [mergedServices]);

  const mergedUsedRetailProducts = useMemo(() => {
    const merged = [...safeProducts, ...sessionRetailProducts];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [safeProducts, sessionRetailProducts]);
  const safePersonalNotes = typeof personalNotes === "string" ? personalNotes : "";
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const dateStr = format(safeDate, "M.d.yyyy");
  const dayLabel = format(safeDate, "EEE");
  const dayNumber = format(safeDate, "d");
  const servicesForRender =
    mergedServices.length > 0
      ? mergedServices
      : [
          { id: "ph-1", name: "—", price: 0, completed: false },
          { id: "ph-2", name: "—", price: 0, completed: false },
        ];

  const enhanceSuggestion = safeRecommendations[0];

  /** First tap each of Consultation, Services, Maintain, Client Notes → +25% (overlay opens). */
  const progressFillPercent = useMemo(() => {
    const stepKeys = ["consultation", "services", "maintain", "notes"] as const satisfies readonly ProgressStepId[];
    const visitedCount = stepKeys.filter((k) => progressStepsVisited[k]).length;
    return visitedCount * 25;
  }, [progressStepsVisited]);

  /** Consultation overlay: dated entries, newest first (today / last visit at top). */
  const consultationTimelineEntries = useMemo((): ConsultationTimelineEntry[] => {
    const dayMs = 24 * 60 * 60 * 1000;
    const offsetsDays = [-118, -52, -19];
    const past = MOCK_CONSULTATION_TIMELINE_PREVIOUS_BODIES.map((body, i) => {
      const d = new Date(safeDate.getTime() + (offsetsDays[i] ?? -30 * (i + 1)) * dayMs);
      return {
        id: `consultation-past-${i}`,
        sortAt: d.toISOString() as IsoDateString,
        dateLabel: format(d, "M.d.yyyy"),
        durationMin: 68 + i * 11,
        techniqueLines: body.techniqueLines,
        footnote: body.footnote,
        isCurrentVisit: false,
      };
    });
    const current: ConsultationTimelineEntry = {
      id: "consultation-current",
      sortAt: safeDate.toISOString() as IsoDateString,
      dateLabel: dateStr,
      durationMin: safeDuration,
      techniqueLines: safeTechniqueNotes.length > 0 ? safeTechniqueNotes : ["—"],
      footnote: "Plan created for today’s result",
      isCurrentVisit: true,
    };
    return [...past, current].sort(
      (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
    );
  }, [safeDate, safeDuration, safeTechniqueNotes, dateStr]);

  /** Mirrors the on-card content for main section overlays (“This visit”) — not used for Consultation (timeline instead). */
  const thisVisitOverlayText = useMemo(() => {
    if (!sectionOverlay) return "";
    switch (sectionOverlay) {
      case "consultation":
        return "";
      case "services": {
        const lineItems = servicesForRender.map(
          (s) => `• ${s.name}${s.price ? ` · $${Number(s.price).toFixed(0)}` : ""}`
        );
        const enhTitle = enhanceSuggestion?.caption ?? "No add-on suggestions";
        const enhSub = enhanceSuggestion
          ? enhanceSuggestion.name
          : "Suggested add-ons appear here when available.";
        const enhPrice = enhanceSuggestion ? `$${Number(enhanceSuggestion.price).toFixed(0)}` : "—";
        return [
          "Line items",
          ...lineItems,
          "",
          "Enhance result",
          enhTitle,
          enhSub,
          enhPrice,
        ].join("\n");
      }
      case "maintain": {
        const usedLines =
          mergedUsedRetailProducts.length > 0
            ? mergedUsedRetailProducts.map(
                (p) => `• ${p.brand} ${p.name}${p.price ? ` · $${Number(p.price).toFixed(0)}` : ""}`
              )
            : ["—"];
        const rec1 = safeProducts[1];
        const rec2 = safeProducts[2];
        return [
          "Used Today",
          ...usedLines,
          "",
          "To maintain results",
          rec1
            ? `• ${rec1.brand} ${rec1.name}${rec1.price ? ` · $${Number(rec1.price).toFixed(0)}` : ""}`
            : "—",
          rec2
            ? `• ${rec2.brand} ${rec2.name}${rec2.price ? ` · $${Number(rec2.price).toFixed(0)}` : ""}`
            : "—",
        ].join("\n");
      }
      case "notes":
        return safePersonalNotes || "—";
      default:
        return "";
    }
  }, [
    sectionOverlay,
    dateStr,
    safeDuration,
    safeTechniqueNotes,
    servicesForRender,
    safeProducts,
    mergedUsedRetailProducts,
    safePersonalNotes,
    enhanceSuggestion,
  ]);

  const pastVisitsOverlayText = useMemo(() => {
    if (
      sectionOverlay === "consultation" ||
      sectionOverlay === "services" ||
      sectionOverlay === "maintain" ||
      sectionOverlay === "notes"
    ) {
      return MOCK_OVERLAY_PAST_VISITS[sectionOverlay];
    }
    return "";
  }, [sectionOverlay]);

  /** Bottom actions (Plan / Complete) — summary only; main cards use thisVisit + past above. */
  const historyForOverlay = useMemo(() => {
    if (!sectionOverlay) return "";
    switch (sectionOverlay) {
      case "planNext": {
        const suggestedDate = addWeeks(safeDate, 5);
        const serviceName = mergedServices[0]?.name ?? "—";
        return [`Suggested: ${format(suggestedDate, "M.d.yyyy")}`, `Service: ${serviceName}`].join("\n");
      }
      case "completeVisit":
        return ["Ready to complete today’s visit.", "Tap Done when you’re finished reviewing."].join("\n");
      default:
        return "";
    }
  }, [sectionOverlay, safeDate, mergedServices]);

  const overlayTitle = useMemo(() => {
    if (!sectionOverlay) return "";
    switch (sectionOverlay) {
      case "consultation":
        return "Consultation";
      case "services":
        return "Services";
      case "maintain":
        return "Maintain this look";
      case "notes":
        return "Client Notes";
      case "planNext":
        return "Plan next visit";
      case "completeVisit":
        return "Complete visit";
      default:
        return "";
    }
  }, [sectionOverlay]);

  const cardsGap = vs(10);

  // Fixed responsive heights (no manual layout math).
  const consultationH = hp(14);
  const servicesH = hp(15);
  const maintainH = hp(21);
  /** Taller than before so the notes card has a usable tap target below the overlapping title pill. */
  const notesH = hp(9);

  /** Blur + popup start below profile + progress bar + label (nothing covers that strip). */
  const overlayTopClearance = insets.top + hp(34);

  /** Reserve bottom: Plan next / Complete row (~hp(6.2)) + gap + home indicator — popup stays in middle “card column” only. */
  const overlayBottomClearance = insets.bottom + hp(6.2) + vs(18);

  /** Popup max height = green-box column (reference layout): between top strip and bottom buttons. */
  const overlayMiddleMaxHeightFallback = Math.max(
    vs(200),
    windowHeight - overlayTopClearance - overlayBottomClearance - vs(8)
  );

  /** Glass popup fits inside measured card column; scroll area slightly shorter for padding. */
  const overlayPopupMaxHeight = cardBandRect
    ? cardBandRect.height
    : overlayMiddleMaxHeightFallback;
  const overlayScrollMaxHeight = Math.max(vs(120), overlayPopupMaxHeight - vs(4));

  const modalTopSpacerHeight = cardBandRect?.top ?? overlayTopClearance;
  const modalBottomSpacerHeight = cardBandRect
    ? Math.max(0, windowHeight - cardBandRect.top - cardBandRect.height)
    : overlayBottomClearance;

  useEffect(() => {
    measureMainCardsBand();
  }, [measureMainCardsBand, windowHeight, consultationH, servicesH, maintainH, notesH, cardsGap]);

  useEffect(() => {
    if (sectionOverlay != null) {
      measureMainCardsBand();
    }
  }, [sectionOverlay, measureMainCardsBand]);

  /** Consultation / Services / Maintain / Notes — one opens, glass covers full band; content is primary & larger. */
  const bandFocusMode =
    sectionOverlay === "consultation" ||
    sectionOverlay === "services" ||
    sectionOverlay === "maintain" ||
    sectionOverlay === "notes";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.viewport}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <CalendarBackArrow />
          </TouchableOpacity>
          <View style={styles.dateBadge} pointerEvents="none">
            <Text style={styles.dateBadgeDay}>{dayLabel}</Text>
            <Text style={styles.dateBadgeNumber}>{dayNumber}</Text>
          </View>
        </View>

        <View style={styles.profile}>
          <View style={styles.avatarWrapOuter}>
            <View style={[styles.avatarWrap, { borderColor: NEUTRAL_BORDER }]}>
              {clientPhoto != null ? (
                <Image source={clientPhoto} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{safeClientName.charAt(0)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.miniTools}>
              <View style={[styles.toolBox, { borderColor: NEUTRAL_BORDER }]}>
                <MaterialCommunityIcons name="content-cut" size={ms(16)} color="#fff" />
                <Text style={styles.toolCount}>5</Text>
              </View>
              <View style={[styles.toolBox, { borderColor: NEUTRAL_BORDER }]}>
                <MaterialCommunityIcons name="brush" size={ms(16)} color="#fff" />
                <Text style={styles.toolCount}>3</Text>
              </View>
            </View>

            <View style={styles.namePhone}>
              <Text style={styles.nameText} numberOfLines={1}>
                {safeClientName}
              </Text>
              <Text style={styles.subText} numberOfLines={1}>
                {phone ?? "—"}
              </Text>
              <MaterialCommunityIcons name="dots-vertical" size={ms(18)} color="rgba(255,255,255,0.8)" />
            </View>
          </View>

          <Text style={styles.focusText} numberOfLines={2}>
            Today’s focus: {safeTechniqueNotes[0] ?? "—"}
          </Text>

          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressFillPercent}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Finishing touches remaining</Text>
          </View>
        </View>

        <View style={[styles.cardsContainer, { gap: cardsGap }]}>
          <View
            ref={mainCardsBandRef}
            collapsable={false}
            onLayout={measureMainCardsBand}
            style={[styles.mainCardsBand, { gap: cardsGap }]}
          >
          <View style={{ marginTop: -vs(2) }}>
            <InteractiveSectionCard
              title="Consultation"
              height={consultationH}
              completed={completedSections.consultation}
              primaryColor={primaryColor}
              glowPulse={glowPulseBySection.consultation}
              onOpen={() => openOverlay("consultation")}
            >
              <View style={styles.consultHeader}>
                <Text style={styles.consultHeaderText}>{dateStr}</Text>
                <Text style={styles.consultHeaderText}>{safeDuration} min</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.bodyText} numberOfLines={6}>
                {safeTechniqueNotes.length > 0 ? safeTechniqueNotes.join("\n") : "—"}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.footnote} numberOfLines={2}>
                Plan created for today’s result
              </Text>
            </InteractiveSectionCard>
          </View>

          <InteractiveSectionCard
            title="Services"
            height={servicesH}
            completed={completedSections.services}
            primaryColor={primaryColor}
            glowPulse={glowPulseBySection.services}
            onOpen={() => openOverlay("services")}
          >
            <View style={styles.servicesCardBody}>
              <ScrollView
                style={styles.servicesUsedScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {servicesForRender.map((s) => (
                  <ServiceItem
                    key={String(s.id)}
                    name={s.name}
                    price={s.price ? `$${Number(s.price).toFixed(0)}` : "—"}
                  />
                ))}
              </ScrollView>

              <View style={[styles.enhanceCard, styles.enhanceCardDocked, { borderColor: NEUTRAL_BORDER }]}>
                <View style={[styles.enhancePill, { borderColor: NEUTRAL_PILL_BORDER }]}>
                  <Text style={styles.enhancePillText}>Enhance result</Text>
                </View>
                <View style={styles.serviceItemRow}>
                  <View style={styles.serviceLeft}>
                    <View style={[styles.checkCircle, { borderColor: NEUTRAL_BORDER }]}>
                      {enhanceSuggestion?.completed ? (
                        <MaterialCommunityIcons name="check" size={ms(10)} color="#fff" />
                      ) : null}
                    </View>
                    <View style={styles.enhanceTextWrap}>
                      <Text style={styles.enhanceTitle} numberOfLines={2}>
                        {enhanceSuggestion
                          ? enhanceSuggestion.caption ?? "Suggested add-on"
                          : "No add-on suggestions"}
                      </Text>
                      <Text style={styles.enhanceSubtitle} numberOfLines={2}>
                        {enhanceSuggestion
                          ? enhanceSuggestion.name
                          : "Suggested add-ons appear here when available."}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.priceText}>
                    {enhanceSuggestion ? `$${Number(enhanceSuggestion.price).toFixed(0)}` : "—"}
                  </Text>
                </View>
              </View>
            </View>
          </InteractiveSectionCard>

          <InteractiveSectionCard
            title="Maintain this look"
            height={maintainH}
            completed={completedSections.maintain}
            primaryColor={primaryColor}
            glowPulse={glowPulseBySection.maintain}
            onOpen={() => openOverlay("maintain")}
          >
            <View style={styles.maintainStack}>
              <View style={styles.maintainUsedBlock}>
                <Text style={styles.groupLabel}>Used Today</Text>
                <ScrollView
                  style={styles.maintainUsedScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {mergedUsedRetailProducts.length === 0 ? (
                    <Text style={styles.maintainRowText}>—</Text>
                  ) : (
                    mergedUsedRetailProducts.map((p) => (
                      <View key={p.id} style={styles.maintainRetailLine}>
                        {p.imageUrl ? (
                          <Image
                            source={{ uri: p.imageUrl }}
                            style={styles.retailProductThumb}
                            resizeMode="cover"
                            accessibilityIgnoresInvertColors
                          />
                        ) : (
                          <View style={[styles.retailPinkDot, { backgroundColor: primaryColor }]} />
                        )}
                        <Text style={styles.maintainRowText} numberOfLines={2}>
                          {p.brand} {p.name}
                        </Text>
                        <Text style={styles.maintainRowPrice} numberOfLines={1}>
                          {p.price ? `$${Number(p.price).toFixed(0)}` : "—"}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.maintainDivider} />

              <View style={styles.maintainRow}>
                <View style={styles.productThumb} />
                <View style={styles.maintainRowContent}>
                  <Text style={styles.groupLabel}>To maintain results</Text>
                  {Array.from({ length: 2 }).map((_, idx) => {
                    const p = safeProducts[idx + 1];
                    return (
                      <View key={`maintain-rec-${idx}`} style={styles.maintainRowChecked}>
                        <View style={styles.maintainCheckCircle}>
                          <MaterialCommunityIcons name="check" size={ms(12)} color="#fff" />
                        </View>
                        <Text style={styles.maintainRowText} numberOfLines={1}>
                          {p ? `${p.brand} ${p.name}` : "—"}
                        </Text>
                        <Text style={styles.maintainRowPrice} numberOfLines={1}>
                          {p ? `$${p.price.toFixed(0)}` : "—"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </InteractiveSectionCard>

          <InteractiveSectionCard
            title="Client Notes"
            height={notesH}
            completed={completedSections.notes}
            primaryColor={primaryColor}
            glowPulse={glowPulseBySection.notes}
            onOpen={() => openOverlay("notes")}
          >
            <Text style={styles.clientNote} numberOfLines={5}>
              {safePersonalNotes || "—"}
            </Text>
          </InteractiveSectionCard>
          </View>

          <View style={styles.bottomActionRow}>
            <BottomActionButton
              label="Plan next visit"
              iconName="calendar-clock-outline"
              completed={completedSections.planNext}
              primaryColor={primaryColor}
              glowPulse={glowPulseBySection.planNext}
              onPress={() => openOverlay("planNext")}
            />

            <BottomActionButton
              label="Complete visit"
              iconName="flag-checkered"
              completed={completedSections.completeVisit}
              primaryColor={primaryColor}
              glowPulse={glowPulseBySection.completeVisit}
              onPress={() =>
                router.push({
                  pathname: "/client/checkout",
                  params: { detailId: clientDetails.id },
                })
              }
            />
          </View>
        </View>
      </View>

      <ClientDetailsSectionOverlay
        visible={sectionOverlay != null}
        sectionOverlay={sectionOverlay}
        onRequestClose={() => closeOverlay(false)}
        closeOverlay={closeOverlay}
        insets={insets}
        cardBandRect={cardBandRect}
        modalTopSpacerHeight={modalTopSpacerHeight}
        modalBottomSpacerHeight={modalBottomSpacerHeight}
        overlayPopupMaxHeight={overlayPopupMaxHeight}
        overlayScrollMaxHeight={overlayScrollMaxHeight}
        overlayOpacity={overlayOpacity}
        overlayTranslateY={overlayTranslateY}
        bandFocusMode={bandFocusMode}
        primaryColor={primaryColor}
        overlayTitle={overlayTitle}
        consultationTimelineEntries={consultationTimelineEntries}
        thisVisitOverlayText={thisVisitOverlayText}
        pastVisitsOverlayText={pastVisitsOverlayText}
        historyForOverlay={historyForOverlay}
        appendServicesDraftSnippet={appendServicesDraftSnippet}
        onPressAddServices={() => setAddServiceModalVisible(true)}
        onPressAddRetail={() => setAddRetailModalVisible(true)}
        draftValue={sectionOverlay ? draftBySection[sectionOverlay] : ""}
        onDraftChange={(t) => {
          if (sectionOverlay) setDraftBySection((prev) => ({ ...prev, [sectionOverlay]: t }));
        }}
      />

      <AddRetailProductFlowModal
        visible={addRetailModalVisible}
        onClose={() => setAddRetailModalVisible(false)}
        onAddProduct={(p) => setSessionRetailProducts((prev) => [...prev, p])}
      />

      <AddServiceFromCatalogModal
        visible={addServiceModalVisible}
        onClose={() => setAddServiceModalVisible(false)}
        onAddService={(s) => setSessionAddedServices((prev) => [...prev, s])}
        excludeCatalogServiceIds={excludeCatalogServiceIds}
      />
    </SafeAreaView>
  );
}
