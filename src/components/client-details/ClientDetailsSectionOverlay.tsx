import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { ConsultationTimelineEntry } from "../../data/types";
import { NEUTRAL_PILL_BORDER, SERVICES_OVERLAY_QUICK_PROMPTS } from "./constants";
import { clientDetailsStyles as styles } from "./completeClientDetailsStyles";
import type { SectionId } from "./types";
import { ms } from "../../utils/responsive";

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
  overlayScrollMaxHeight: number;
  overlayOpacity: Animated.Value;
  overlayTranslateY: Animated.Value;
  bandFocusMode: boolean;
  primaryColor: string;
  overlayTitle: string;
  consultationTimelineEntries: ConsultationTimelineEntry[];
  thisVisitOverlayText: string;
  pastVisitsOverlayText: string;
  historyForOverlay: string;
  appendServicesDraftSnippet: (snippet: string) => void;
  onPressAddServices: () => void;
  onPressAddRetail: () => void;
  draftValue: string;
  onDraftChange: (text: string) => void;
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
  overlayScrollMaxHeight,
  overlayOpacity,
  overlayTranslateY,
  bandFocusMode,
  primaryColor,
  overlayTitle,
  consultationTimelineEntries,
  thisVisitOverlayText,
  pastVisitsOverlayText,
  historyForOverlay,
  appendServicesDraftSnippet,
  onPressAddServices,
  onPressAddRetail,
  draftValue,
  onDraftChange,
}: ClientDetailsSectionOverlayProps) {
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
                style={[styles.overlayScroll, { maxHeight: overlayScrollMaxHeight }]}
                contentContainerStyle={[
                  styles.overlayScrollContent,
                  bandFocusMode && styles.overlayScrollContentBandFocus,
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <Text style={[styles.overlayTitle, bandFocusMode && styles.overlayTitleBandFocus]}>
                  {overlayTitle}
                </Text>
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
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.overlayQuickPromptsRow}
                      keyboardShouldPersistTaps="handled"
                    >
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
                    </ScrollView>
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
                    <MaterialCommunityIcons name="plus-circle-outline" size={ms(16)} color="#FFFFFF" />
                    <Text style={styles.overlayCatalogBtnText}>Add services</Text>
                  </TouchableOpacity>
                )}
                {sectionOverlay === "maintain" && (
                  <TouchableOpacity
                    style={[styles.overlayCatalogBtn, { borderColor: NEUTRAL_PILL_BORDER }]}
                    onPress={onPressAddRetail}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Add retail products"
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={ms(16)} color="#FFFFFF" />
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
