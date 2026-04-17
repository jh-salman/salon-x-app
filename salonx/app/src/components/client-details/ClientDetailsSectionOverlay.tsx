import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { ConsultationTimelineEntry, Service } from "../../data/types";
import { NEUTRAL_PILL_BORDER, SERVICES_OVERLAY_QUICK_PROMPTS } from "./constants";
import { clientDetailsStyles as styles } from "./completeClientDetailsStyles";
import { colors } from "../../theme";
import type { SectionId } from "./types";
import { ms, vs } from "../../utils/responsive";
import {
  FEATURE_VISIT_OS_BEFORE_PHOTO,
  FEATURE_VISIT_OS_PENDING_FROM_CLIENT,
  FEATURE_VISIT_OS_PRE_VISIT_INTELLIGENCE,
  FEATURE_VISIT_OS_VISIT_PLAN,
} from "../../featureFlags";
import { useAppointmentMedia } from "../../hooks/useAppointmentMedia";
import { computeVisitPlan } from "../../lib/visitPlan";

export interface ClientDetailsSectionOverlayProps {
  visible: boolean;
  sectionOverlay: SectionId | null;
  onRequestClose: () => void;
  closeOverlay: (markComplete: boolean) => void;
  insets: EdgeInsets;
  cardBandRect: { top: number; height: number } | null;
  modalTopSpacerHeight: number;
  modalBottomSpacerHeight: number;
  overlayPopupMaxHeight: number;
  overlayOpacity: Animated.Value;
  overlayTranslateY: Animated.Value;
  bandFocusMode: boolean;
  primaryColor: string;
  overlayTitle: string;
  detailId: string;
  clientName: string;
  phone?: string;
  techniqueNotes: string[];
  personalNotes: string;
  services: Service[];
  recommendations: Service[];
  onOpenVisitPlan?: () => void;
  consultationTimelineEntries: ConsultationTimelineEntry[];
  thisVisitOverlayText: string;
  pastVisitsOverlayText: string;
  historyForOverlay: string;
  appendServicesDraftSnippet: (snippet: string) => void;
  onPressAddServices: () => void;
  onPressAddRetail: () => void;
  draftValue: string;
  onDraftChange: (text: string) => void;
  visitCount?: number;
  showReferralBadge?: boolean;
  aiConsultationBrief?: string;
}

export function ClientDetailsSectionOverlay({
  visible,
  sectionOverlay,
  onRequestClose,
  closeOverlay,
  insets,
  cardBandRect,
  modalTopSpacerHeight,
  modalBottomSpacerHeight,
  overlayPopupMaxHeight,
  overlayOpacity,
  overlayTranslateY,
  bandFocusMode,
  primaryColor,
  overlayTitle,
  detailId,
  clientName,
  phone,
  techniqueNotes,
  personalNotes,
  services,
  recommendations,
  onOpenVisitPlan,
  consultationTimelineEntries,
  thisVisitOverlayText,
  pastVisitsOverlayText,
  historyForOverlay,
  appendServicesDraftSnippet,
  onPressAddServices,
  onPressAddRetail,
  draftValue,
  onDraftChange,
  visitCount,
  showReferralBadge,
  aiConsultationBrief,
}: ClientDetailsSectionOverlayProps) {
  const { media, upsert, hasBefore } = useAppointmentMedia(detailId);
  const pendingItems = React.useMemo(() => {
    const items: string[] = [];
    if (!phone) items.push("Phone number");
    if (!personalNotes.trim()) items.push("Notes / preferences");
    if (!Array.isArray(techniqueNotes) || techniqueNotes.length === 0) items.push("Consultation answers");
    return items;
  }, [phone, personalNotes, techniqueNotes]);

  const visitPlan = React.useMemo(() => computeVisitPlan({ services, recommendations }), [services, recommendations]);

  const onCaptureBefore = React.useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;
    await upsert({ beforeUri: uri, beforeCapturedAt: Date.now() });
  }, [upsert]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={{ height: modalTopSpacerHeight }} pointerEvents="none" />
        <View
          style={[
            styles.modalContentLayer,
            cardBandRect != null && { height: cardBandRect.height, flex: 0 },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeOverlay(false)}>
            <BlurView
              intensity={52}
              tint="dark"
              style={StyleSheet.absoluteFill}
              {...(Platform.OS === "android" ? { experimentalBlurMethod: "dimezisBlurView" as const } : {})}
            />
          </Pressable>
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.overlayPopupWrap,
              {
                height: overlayPopupMaxHeight,
                maxHeight: overlayPopupMaxHeight,
                opacity: overlayOpacity,
                transform: [{ translateY: overlayTranslateY }],
              },
            ]}
          >
            <BlurView
              intensity={36}
              tint="dark"
              style={styles.overlayGlassInner}
              {...(Platform.OS === "android" ? { experimentalBlurMethod: "dimezisBlurView" as const } : {})}
            >
              <ScrollView
                style={styles.overlayScroll}
                contentContainerStyle={[
                  styles.overlayScrollContent,
                  bandFocusMode && styles.overlayScrollContentBandFocus,
                  { paddingBottom: vs(16) + insets.bottom + vs(20) },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                nestedScrollEnabled
                bounces
              >
                <Text style={[styles.overlayTitle, bandFocusMode && styles.overlayTitleBandFocus]}>
                  {overlayTitle}
                </Text>

                {bandFocusMode && sectionOverlay === "info" ? (
                  <View style={{ marginTop: ms(10), gap: ms(6) }}>
                    <Text style={styles.overlayChronologyHint}>
                      Visits on record: {visitCount != null ? String(visitCount) : "—"}
                    </Text>
                    {showReferralBadge ? (
                      <Text style={styles.overlayChronologyHint}>Referral champion — referred new guests.</Text>
                    ) : null}
                    <Text style={[styles.overlayHistoryLabel, bandFocusMode && styles.overlayHistoryLabelBandFocus]}>
                      AI consultation brief
                    </Text>
                    <Text style={styles.overlayChronologyHint} selectable>
                      {aiConsultationBrief?.trim() || "—"}
                    </Text>
                    <Text style={styles.overlayChronologyHint}>
                      MUSE / TAG: growth path & acquisition intel sync when engines are connected.
                    </Text>
                  </View>
                ) : null}

                {bandFocusMode && sectionOverlay === "consultation" ? (
                  <>
                    {FEATURE_VISIT_OS_BEFORE_PHOTO ? (
                      <View style={{ marginTop: ms(10) }}>
                        <Text style={[styles.overlayHistoryLabel, bandFocusMode && styles.overlayHistoryLabelBandFocus]}>
                          Before photo (optional)
                        </Text>
                        {!hasBefore ? (
                          <>
                            <Text style={styles.overlayChronologyHint}>
                              Optional — capture {clientName}’s before photo if you want a visual record.
                            </Text>
                            <TouchableOpacity
                              style={[styles.overlayCatalogBtn, { borderColor: NEUTRAL_PILL_BORDER }]}
                              onPress={() => void onCaptureBefore()}
                              activeOpacity={0.85}
                              accessibilityRole="button"
                              accessibilityLabel="Open camera for before photo"
                            >
                              <MaterialCommunityIcons name="camera" size={ms(16)} color={colors.text.primary} />
                              <Text style={styles.overlayCatalogBtnText}>Open Camera</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                            <Image
                              source={{ uri: media?.beforeUri }}
                              style={{ width: ms(46), height: ms(46), borderRadius: ms(10) }}
                            />
                            <Text style={styles.overlayChronologyHint}>Before captured</Text>
                          </View>
                        )}
                      </View>
                    ) : null}

                    {FEATURE_VISIT_OS_PRE_VISIT_INTELLIGENCE ? (
                      <View style={{ marginTop: ms(12) }}>
                        <Text style={[styles.overlayHistoryLabel, bandFocusMode && styles.overlayHistoryLabelBandFocus]}>
                          Pre-visit intelligence
                        </Text>
                        <Text style={styles.overlayChronologyHint}>
                          Last visit:{" "}
                          {consultationTimelineEntries.find((e) => !e.isCurrentVisit)?.dateLabel ?? "—"}
                        </Text>
                        <Text style={styles.overlayChronologyHint}>
                          Focus: {techniqueNotes?.[0] ?? "—"}
                        </Text>
                        <Text style={styles.overlayChronologyHint}>
                          Preferences: {personalNotes.trim() ? "Available" : "—"}
                        </Text>
                      </View>
                    ) : null}

                    {FEATURE_VISIT_OS_PENDING_FROM_CLIENT && pendingItems.length > 0 ? (
                      <View style={{ marginTop: ms(12) }}>
                        <Text style={[styles.overlayHistoryLabel, bandFocusMode && styles.overlayHistoryLabelBandFocus]}>
                          Pending from client
                        </Text>
                        <Text style={styles.overlayChronologyHint}>
                          {pendingItems.length} item{pendingItems.length === 1 ? "" : "s"} missing
                        </Text>
                        <Text style={styles.overlayChronologyHint}>{pendingItems.slice(0, 3).join(" · ")}</Text>
                      </View>
                    ) : null}
                  </>
                ) : null}

                {bandFocusMode && sectionOverlay === "consultation" ? (
                  <>
                    <Text
                      style={[
                        styles.overlayHistoryLabel,
                        bandFocusMode && styles.overlayHistoryLabelBandFocus,
                      ]}
                    >
                      Consultation history
                    </Text>
                    <Text style={styles.overlayChronologyHint}>
                      Dated · newest first — last consultation at top, scroll for older
                    </Text>
                    {consultationTimelineEntries.map((entry) => (
                      <View
                        key={entry.id}
                        style={[
                          styles.consultationTimelineBlock,
                          entry.isCurrentVisit ? styles.consultationTimelineBlockCurrent : null,
                          entry.isCurrentVisit ? { borderLeftColor: primaryColor } : null,
                        ]}
                      >
                        <Text style={styles.consultationTimelineDate}>
                          {entry.dateLabel} · {entry.durationMin} min
                          {entry.isCurrentVisit ? " · Today" : ""}
                        </Text>
                        <Text style={styles.consultationTimelineBody} selectable>
                          {entry.techniqueLines.filter((l) => l.trim().length > 0).join("\n")}
                        </Text>
                        {entry.footnote ? (
                          <Text style={styles.consultationTimelineFoot}>{entry.footnote}</Text>
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : bandFocusMode ? (
                  <>
                    <Text
                      style={[
                        styles.overlayHistoryLabel,
                        bandFocusMode && styles.overlayHistoryLabelBandFocus,
                      ]}
                    >
                      This visit
                    </Text>
                    <Text
                      style={[styles.overlayHistoryBody, bandFocusMode && styles.overlayHistoryBodyBandFocus]}
                      selectable
                    >
                      {thisVisitOverlayText}
                    </Text>
                  </>
                ) : null}
                {sectionOverlay === "services" && (
                  <View style={styles.overlayQuickPromptsWrap}>
                    <Text style={styles.overlayQuickPromptsLabel}>Quick prompts</Text>
                    <View style={styles.overlayQuickPromptsWrapRow}>
                      {SERVICES_OVERLAY_QUICK_PROMPTS.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.overlayQuickPromptPill, { borderColor: NEUTRAL_PILL_BORDER }]}
                          activeOpacity={0.85}
                          onPress={() => appendServicesDraftSnippet(p.snippet)}
                          accessibilityRole="button"
                          accessibilityLabel={p.label}
                        >
                          <Text style={styles.overlayQuickPromptPillText} numberOfLines={1}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {sectionOverlay === "services" && (
                  <TouchableOpacity
                    style={[styles.overlayCatalogBtn, { borderColor: NEUTRAL_PILL_BORDER }]}
                    onPress={onPressAddServices}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Add services from catalog"
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={ms(16)} color={colors.text.primary} />
                    <Text style={styles.overlayCatalogBtnText}>Add services</Text>
                  </TouchableOpacity>
                )}

                {FEATURE_VISIT_OS_VISIT_PLAN && sectionOverlay === "services" ? (
                  <View style={{ marginTop: ms(12) }}>
                    <Text style={styles.overlayHistoryLabel}>Visit Plan</Text>
                    <Text style={styles.overlayChronologyHint}>
                      Core: {visitPlan.coreServices.length} · Upgrades: {visitPlan.upgrades.length} · Add-ons:{" "}
                      {visitPlan.addOns.length}
                    </Text>
                    <Text style={styles.overlayChronologyHint}>Estimated: ${visitPlan.estimatedTotal.toFixed(0)}</Text>
                    {onOpenVisitPlan ? (
                      <TouchableOpacity
                        style={[styles.overlayCatalogBtn, { borderColor: NEUTRAL_PILL_BORDER }]}
                        onPress={onOpenVisitPlan}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Open Visit Plan"
                      >
                        <MaterialCommunityIcons name="open-in-new" size={ms(16)} color={colors.text.primary} />
                        <Text style={styles.overlayCatalogBtnText}>Open Visit Plan</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
                {sectionOverlay === "maintain" && (
                  <TouchableOpacity
                    style={[styles.overlayCatalogBtn, { borderColor: NEUTRAL_PILL_BORDER }]}
                    onPress={onPressAddRetail}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Add retail products"
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={ms(16)} color={colors.text.primary} />
                    <Text style={styles.overlayCatalogBtnText}>Add products</Text>
                  </TouchableOpacity>
                )}
                {bandFocusMode && sectionOverlay === "consultation" ? null : bandFocusMode ? (
                  <>
                    <Text
                      style={[
                        styles.overlayHistoryLabel,
                        styles.overlayPastVisitsHead,
                        bandFocusMode && styles.overlayHistoryLabelBandFocus,
                      ]}
                    >
                      Past visits
                    </Text>
                    <Text style={styles.overlayPastVisitsBody} selectable>
                      {pastVisitsOverlayText}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.overlayHistoryLabel}>Details</Text>
                    <Text style={styles.overlayHistoryBody} selectable>
                      {historyForOverlay}
                    </Text>
                  </>
                )}
                <Text style={[styles.overlayInputLabel, bandFocusMode && styles.overlayInputLabelBandFocus]}>
                  Update
                </Text>
                <TextInput
                  style={[styles.overlayInput, bandFocusMode && styles.overlayInputBandFocus]}
                  multiline
                  placeholder="Optional note…"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  value={draftValue}
                  onChangeText={onDraftChange}
                />
                <View style={styles.overlayActions}>
                  <TouchableOpacity
                    style={styles.voiceBtn}
                    accessibilityLabel="Voice input"
                    activeOpacity={0.8}
                    onPress={() => {}}
                  >
                    <FontAwesome5 name="microphone" size={ms(18)} color="rgba(255,255,255,0.85)" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneBtn} activeOpacity={0.85} onPress={() => closeOverlay(true)}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </Animated.View>
        </View>
        <View style={{ height: modalBottomSpacerHeight }} pointerEvents="none" />
      </KeyboardAvoidingView>
    </Modal>
  );
}
