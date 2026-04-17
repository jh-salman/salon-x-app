import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Platform, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { format, addDays, addMonths, startOfMonth, startOfWeek, addWeeks, isSameDay, isSameMonth } from 'date-fns';
import type { ClientDetails } from '../../data/types';
import { colors } from '../../theme';
import { ms, vs, wp, hp } from '../../utils/responsive';
import { useAppointmentMedia } from '../../hooks/useAppointmentMedia';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { uploadImage } from '../../lib/uploadApi';
import { patchAppointmentMedia } from '../../lib/appointmentApi';
import { useGhostNotesSession } from '../../hooks/useGhostNotesSession';
import { useVisitPlanStorage } from '../../hooks/useVisitPlanStorage';
import { useNextAppointmentStorage } from '../../hooks/useNextAppointmentStorage';
import { ClientDetailsFlowContext } from './ClientDetailsHeader';
import { CREATE_TAB_PRODUCTS_MOCK, CREATE_TAB_VISIT_PLAN_MOCK } from './constants';

type CommonProps = {
  appointmentId: string;
  detailId: string;
  clientDetails: ClientDetails;
};

type IntelQuestion = {
  id: string;
  label: string;
  value: string;
  answered: boolean;
  tone: 'teal' | 'amber';
};

const DEFAULT_INTEL_QUESTIONNAIRE: IntelQuestion[] = [
  { id: 'q1', label: 'Hair goals today', value: 'Vibrant green, textured finish', answered: true, tone: 'teal' },
  { id: 'q2', label: 'Last color service', value: '8 months ago, natural', answered: true, tone: 'teal' },
  { id: 'q3', label: 'Scalp sensitivity', value: 'None reported', answered: true, tone: 'teal' },
  { id: 'q4', label: 'Current products', value: 'Pending from client', answered: false, tone: 'amber' },
  { id: 'q5', label: 'Style inspiration', value: 'Pending from client', answered: false, tone: 'amber' },
];

function consultIntelKey(detailId: string) {
  return `@consult_intel:${detailId}`;
}

function parseIntelProductsServices(value: string): { products: string; services: string } {
  let products = '';
  let services = '';
  for (const line of value.split('\n')) {
    const t = line.trim();
    if (t.startsWith('Products:')) products = t.slice('Products:'.length).trim();
    else if (t.startsWith('Services:')) services = t.slice('Services:'.length).trim();
  }
  return { products, services };
}

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={s.starsRow}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const n = idx + 1;
        const on = n <= value;
        return (
          <Pressable
            key={`star-${n}`}
            onPress={() => onChange(n)}
            style={[s.star, on && s.starOn]}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star`}
          >
            <Text style={[s.starText, on && s.starTextOn]}>{on ? '★' : '☆'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TabInfoContent({ appointmentId, clientDetails }: { appointmentId: string; clientDetails: ClientDetails }) {
  const flow = useContext(ClientDetailsFlowContext);
  const safeName = clientDetails.clientName?.trim() ? clientDetails.clientName.trim() : 'Client';
  const initial = safeName.charAt(0).toUpperCase();
  const date = clientDetails.date instanceof Date && !Number.isNaN(clientDetails.date.getTime()) ? clientDetails.date : new Date();
  const timeLine = `${format(date, 'h:mm a')} • ${format(date, 'MMM d')}`;
  const stylistName = 'Alex Rivera';
  const services = Array.isArray(clientDetails.services) ? clientDetails.services : [];
  const questionnaireSummary = '3 of 5 answered';
  const notes = typeof clientDetails.personalNotes === 'string' ? clientDetails.personalNotes : '';

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.headerCard}>
        <View style={s.headerRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={s.headerMeta}>
            <View style={s.nameRow}>
              <Text style={s.clientName} numberOfLines={1}>
                {safeName}
              </Text>
              <View style={s.statusBadge}>
                <Text style={s.statusText}>NEW</Text>
              </View>
            </View>
            <Text style={s.subline} numberOfLines={1}>
              Visit #1 · {timeLine} · {stylistName}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>BOOKED SERVICES</Text>
        {services.length === 0 ? (
          <Text style={s.muted}>—</Text>
        ) : (
          services.map((x) => (
            <View key={x.id} style={s.lineRow}>
              <Text style={s.lineName} numberOfLines={2}>
                {x.name}
              </Text>
              <Text style={s.linePrice}>${Number(x.price ?? 0).toFixed(0)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>PRE‑VISIT QUESTIONNAIRE</Text>
        <Text style={s.bodyText}>{questionnaireSummary}</Text>
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>NOTES (INTERNAL)</Text>
        <Text style={s.bodyText}>{notes.trim() ? notes : '—'}</Text>
      </View>

      <View style={s.actions}>
        <Pressable
          onPress={() => flow?.goTo('Consult')}
          style={s.primaryBtn}
          accessibilityRole="button"
          accessibilityLabel="Start visit"
        >
          <Text style={s.primaryBtnText}>Start Visit</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function TabConsultContent({ appointmentId, detailId, clientDetails }: CommonProps) {
  const flow = useContext(ClientDetailsFlowContext);
  const safeName = clientDetails.clientName?.trim() ? clientDetails.clientName.trim() : 'Client';
  const { media, upsert, hasBefore } = useAppointmentMedia(detailId);
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const ghostNotes = useGhostNotesSession(appointmentId);
  const [questionnaire, setQuestionnaire] = useState<IntelQuestion[]>(DEFAULT_INTEL_QUESTIONNAIRE);
  const skipIntelSave = useRef(true);

  const [intelModal, setIntelModal] = useState<null | IntelQuestion>(null);
  const [modalProducts, setModalProducts] = useState('');
  const [modalServices, setModalServices] = useState('');
  const [modalStyleInspo, setModalStyleInspo] = useState('');

  useEffect(() => {
    skipIntelSave.current = true;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(consultIntelKey(detailId));
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as IntelQuestion[];
        if (Array.isArray(parsed) && parsed.length === DEFAULT_INTEL_QUESTIONNAIRE.length) {
          setQuestionnaire(parsed);
        }
      } catch {
        /* keep default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  useEffect(() => {
    if (skipIntelSave.current) {
      skipIntelSave.current = false;
      return;
    }
    void AsyncStorage.setItem(consultIntelKey(detailId), JSON.stringify(questionnaire));
  }, [detailId, questionnaire]);

  const answeredCount = questionnaire.filter((q) => q.answered).length;

  const openIntelModal = useCallback((q: IntelQuestion) => {
    if (q.id !== 'q4' && q.id !== 'q5') return;
    setIntelModal(q);
    if (q.id === 'q4') {
      if (q.answered && q.value !== 'Pending from client') {
        const { products, services } = parseIntelProductsServices(q.value);
        setModalProducts(products);
        setModalServices(services);
      } else {
        setModalProducts('');
        setModalServices('');
      }
    } else {
      setModalStyleInspo(q.answered && q.value !== 'Pending from client' ? q.value : '');
    }
  }, []);

  const closeIntelModal = useCallback(() => setIntelModal(null), []);

  const saveIntelModal = useCallback(() => {
    if (!intelModal) return;
    if (intelModal.id === 'q4') {
      const p = modalProducts.trim();
      const sv = modalServices.trim();
      const has = !!(p || sv);
      const value = has
        ? [p ? `Products: ${p}` : '', sv ? `Services: ${sv}` : ''].filter(Boolean).join('\n')
        : 'Pending from client';
      setQuestionnaire((prev) =>
        prev.map((row) => (row.id === 'q4' ? { ...row, answered: has, value: has ? value : 'Pending from client' } : row)),
      );
    } else if (intelModal.id === 'q5') {
      const t = modalStyleInspo.trim();
      const has = !!t;
      setQuestionnaire((prev) =>
        prev.map((row) => (row.id === 'q5' ? { ...row, answered: has, value: has ? t : 'Pending from client' } : row)),
      );
    }
    setIntelModal(null);
  }, [intelModal, modalProducts, modalServices, modalStyleInspo]);

  const onCaptureBefore = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        const uri = `mock://before/${Date.now()}`;
        await upsert({ beforeUri: uri, beforeCapturedAt: Date.now() });
        if (token && currentSalonId) {
          try {
            await patchAppointmentMedia(token, currentSalonId, appointmentId, { beforeUrl: uri });
          } catch {
            // best-effort
          }
        }
        return;
      }

      const res = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false });
      if (res.canceled) return;
      const localUri = res.assets?.[0]?.uri;
      if (!localUri) return;
      await upsert({ beforeUri: localUri, beforeCapturedAt: Date.now() });
      if (token && currentSalonId) {
        try {
          const uploaded = await uploadImage(token, currentSalonId, { uri: localUri, name: 'before.jpg', mime: 'image/jpeg' });
          await patchAppointmentMedia(token, currentSalonId, appointmentId, { beforeUrl: uploaded.data.url });
          await upsert({ beforeUri: uploaded.data.url });
        } catch {
          // keep local
        }
      }
    } catch {
      const uri = `mock://before/${Date.now()}`;
      await upsert({ beforeUri: uri, beforeCapturedAt: Date.now() });
    }
  }, [appointmentId, currentSalonId, token, upsert]);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>📸 BEFORE DOCUMENTATION</Text>
        {!hasBefore ? (
          <>
            <Text style={s.bodyText}>Capture {safeName}’s before photo to complete the look story.</Text>
            <Pressable onPress={() => void onCaptureBefore()} style={[s.primaryBtn, s.primaryBtnOff]} accessibilityRole="button">
              <Text style={s.primaryBtnText}>Open Camera →</Text>
            </Pressable>
          </>
        ) : (
          <View style={s.capturedRow}>
            {media?.beforeUri && !media.beforeUri.startsWith('mock://') ? (
              <Image source={{ uri: media.beforeUri }} style={s.thumb} />
            ) : (
              <View style={s.thumbMock}>
                <Text style={s.thumbMockText}>BEFORE</Text>
              </View>
            )}
            <Text style={s.bodyText}>Before captured</Text>
            <Pressable onPress={() => void onCaptureBefore()} style={s.secondaryBtn} accessibilityRole="button">
              <Text style={s.secondaryBtnText}>Retake →</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={s.sectionGroup}>
        <Text style={s.groupTitle}>Pre‑Visit Intelligence</Text>
        <Text style={s.groupSubtitle}>
          {safeName.split(' ')[0] ?? 'Client'} completed {answeredCount} of {questionnaire.length} questions
        </Text>

        {questionnaire.map((q) => {
          const isEditable = q.id === 'q4' || q.id === 'q5';
          const cardStyle = [
            s.intelCard,
            q.answered ? s.intelCardOn : s.intelCardOff,
            q.tone === 'teal' ? s.intelTealGlow : s.intelAmberGlow,
            isEditable ? s.intelCardTappable : null,
          ];
          const body = (
            <>
              <View style={s.intelTextWrap}>
                <Text style={s.intelLabel}>{q.label.toUpperCase()}</Text>
                <Text style={[s.intelValue, !q.answered && s.intelValuePending]} numberOfLines={4}>
                  {q.value}
                </Text>
              </View>
              <View style={[s.intelIcon, q.answered ? s.intelIconOn : s.intelIconPending]}>
                <Text style={[s.intelIconText, !q.answered && s.intelIconHourglass]}>{q.answered ? '✓' : '⌛'}</Text>
              </View>
            </>
          );
          return isEditable ? (
            <Pressable
              key={q.id}
              onPress={() => openIntelModal(q)}
              style={({ pressed }) => [cardStyle, pressed ? s.intelCardPressed : null]}
              accessibilityRole="button"
              accessibilityLabel={`${q.label}. ${q.answered ? 'Edit' : 'Add'} details`}
            >
              {body}
            </Pressable>
          ) : (
            <View key={q.id} style={cardStyle}>
              {body}
            </View>
          );
        })}

        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>GHOST NOTES</Text>
          {ghostNotes.loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={s.muted}>Loading session…</Text>
            </View>
          ) : null}
          {ghostNotes.error ? <Text style={s.errorText}>{ghostNotes.error}</Text> : null}
          {!ghostNotes.loading && !ghostNotes.error ? (
            <Text style={s.bodyText}>
              {ghostNotes.data?.priorVisitSummary?.notesSnippet?.trim()
                ? ghostNotes.data.priorVisitSummary.notesSnippet
                : ghostNotes.data?.followUpQuestions?.length
                  ? ghostNotes.data.followUpQuestions.slice(0, 3).map((x) => `• ${x}`).join('\n')
                  : '—'}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        disabled={!hasBefore}
        onPress={() => flow?.goTo('Create')}
        style={[s.primaryBtn, !hasBefore && s.primaryBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Open Visit Plan"
      >
        <Text style={s.primaryBtnText}>Open Visit Plan →</Text>
      </Pressable>
      {!hasBefore ? <Text style={s.hintText}>Capture before photo to continue</Text> : null}

      <Modal visible={intelModal != null} animationType="slide" transparent onRequestClose={closeIntelModal}>
        <View style={s.intelModalRoot}>
          <Pressable style={s.intelModalBackdrop} onPress={closeIntelModal} accessibilityRole="button" accessibilityLabel="Close" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.intelModalKb}
            keyboardVerticalOffset={Platform.OS === 'ios' ? ms(8) : 0}
          >
            <View style={s.intelModalSheet}>
            <Text style={s.intelModalTitle}>
              {intelModal?.id === 'q4' ? 'Products & services' : 'Style inspiration'}
            </Text>
            <Text style={s.intelModalHint}>
              {intelModal?.id === 'q4'
                ? 'Add home-care products the client uses and any services to note.'
                : 'Reference links, mood, or visual direction.'}
            </Text>
            {intelModal?.id === 'q4' ? (
              <ScrollView style={s.intelModalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={s.intelModalFieldLabel}>PRODUCTS</Text>
                <TextInput
                  value={modalProducts}
                  onChangeText={setModalProducts}
                  placeholder="e.g. DJ Color protect shampoo, leave-in…"
                  placeholderTextColor={colors.text.faint}
                  style={s.intelModalInput}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={s.intelModalFieldLabel}>SERVICES</Text>
                <TextInput
                  value={modalServices}
                  onChangeText={setModalServices}
                  placeholder="e.g. Gloss treatment, trim…"
                  placeholderTextColor={colors.text.faint}
                  style={s.intelModalInput}
                  multiline
                  textAlignVertical="top"
                />
              </ScrollView>
            ) : (
              <TextInput
                value={modalStyleInspo}
                onChangeText={setModalStyleInspo}
                placeholder="Pinterest board, celeb ref, vibe…"
                placeholderTextColor={colors.text.faint}
                style={[s.intelModalInput, s.intelModalInputTall]}
                multiline
                textAlignVertical="top"
              />
            )}
            <View style={s.intelModalActions}>
              <Pressable onPress={closeIntelModal} style={s.intelModalBtnGhost} accessibilityRole="button">
                <Text style={s.intelModalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveIntelModal} style={s.intelModalBtnPrimary} accessibilityRole="button">
                <Text style={s.intelModalBtnPrimaryText}>Save</Text>
              </Pressable>
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

export function TabCreateContent({ detailId, clientDetails }: { detailId: string; clientDetails: ClientDetails }) {
  const flow = useContext(ClientDetailsFlowContext);
  const visitPlanInput = useMemo(
    () => ({
      services: CREATE_TAB_VISIT_PLAN_MOCK.services,
      recommendations: CREATE_TAB_VISIT_PLAN_MOCK.recommendations,
    }),
    [],
  );
  const { computed, resolvedSelected, saveSelection } = useVisitPlanStorage(detailId, visitPlanInput);

  const selectedServiceIds = useMemo(() => new Set(resolvedSelected.services.map((x) => x.id)), [resolvedSelected.services]);
  const selectedRecIds = useMemo(() => new Set(resolvedSelected.recommendations.map((x) => x.id)), [resolvedSelected.recommendations]);

  const toggleService = useCallback(
    async (id: string) => {
      const next = new Set(selectedServiceIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      await saveSelection({ selectedServiceIds: [...next], selectedRecommendationIds: [...selectedRecIds] });
    },
    [saveSelection, selectedRecIds, selectedServiceIds],
  );

  const toggleRec = useCallback(
    async (id: string) => {
      const next = new Set(selectedRecIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      await saveSelection({ selectedServiceIds: [...selectedServiceIds], selectedRecommendationIds: [...next] });
    },
    [saveSelection, selectedRecIds, selectedServiceIds],
  );

  const total = useMemo(() => {
    const price = (x: { price?: unknown }) => (typeof x.price === 'number' && Number.isFinite(x.price) ? x.price : 0);
    const sTotal = resolvedSelected.services.reduce((sum, x) => sum + price(x), 0);
    const rTotal = resolvedSelected.recommendations.reduce((sum, x) => sum + price(x), 0);
    return sTotal + rTotal;
  }, [resolvedSelected]);

  const safeName = clientDetails.clientName?.trim() ? clientDetails.clientName.trim() : 'Client';
  const titleFirst = safeName.split(' ')[0] ?? 'Client';

  const usedToday = CREATE_TAB_PRODUCTS_MOCK.usedToday;
  const takeHomeSuggested = CREATE_TAB_PRODUCTS_MOCK.takeHome;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.createScrollContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
    >
      <View style={s.createTopBlock}>
        <View style={s.createTitleStack}>
          <Text style={s.createTitle}>{`${titleFirst}'s Visit Plan`}</Text>
          <Text style={s.createSubtitle}>Review · Upgrade · Recommend</Text>
        </View>
        <Pressable style={s.createMenuHit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Visit plan menu">
          <Text style={s.createMenuDots}>{'\u22EF'}</Text>
        </Pressable>
      </View>

      <View style={[s.createPlanCard, s.createPlanCardSurface]}>
        <View style={s.createKickerRow}>
          <View style={[s.createAccentBar, { backgroundColor: colors.primary }]} />
          <Text style={[s.createCardKicker, { color: colors.primary }]}>{'\u25C6 SERVICES TODAY'}</Text>
        </View>
        {computed.coreServices.map((x) => {
          const selected = selectedServiceIds.has(x.id);
          return (
            <Pressable key={x.id} onPress={() => void toggleService(x.id)} style={s.createCardRow} accessibilityRole="button">
              <Text style={[s.createCardRowName, !selected && s.createCardRowMuted]} numberOfLines={2}>
                {selected ? `${'\u2713'} ` : ''}
                {x.name}
              </Text>
              <Text style={[s.createCardRowPrice, { color: colors.primary }]}>${Number((x as any).price ?? 0).toFixed(0)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[s.createPlanCard, s.createPlanCardSurface]}>
        <View style={s.createKickerRow}>
          <View style={[s.createAccentBar, { backgroundColor: colors.primary }]} />
          <Text style={[s.createCardKicker, { color: colors.primary }]}>{'\u2726 UPGRADE NUDGES'}</Text>
        </View>
        {[...computed.upgrades, ...computed.addOns].slice(0, 2).map((r, idx) => {
          const selected = selectedRecIds.has(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => void toggleRec(r.id)}
              style={[s.createToggleRow, idx === 0 && s.createToggleRowFirst]}
              accessibilityRole="button"
            >
              <View style={[s.createCheckbox, selected && { borderColor: colors.primary }]}>
                <Text style={[s.createCheckboxText, selected && s.createCheckboxTextOn]}>{selected ? '\u2713' : ''}</Text>
              </View>
              <View style={s.createToggleMeta}>
                <Text style={s.createToggleName} numberOfLines={2}>
                  + {r.name}
                </Text>
                <Text style={s.createToggleNote} numberOfLines={2}>
                  {r.caption?.trim()
                    ? r.caption
                    : selected
                      ? 'Locks in vibrancy — essential for vivid.'
                      : 'First chemical service · high recommendation.'}
                </Text>
              </View>
              <Text style={[s.createCardRowPrice, { color: colors.primary }]}>${Number((r as any).price ?? 0).toFixed(0)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[s.createPlanCard, s.createPlanCardSurface]}>
        <View style={s.createKickerRow}>
          <View style={[s.createAccentBar, { backgroundColor: colors.primary }]} />
          <Text style={[s.createCardKicker, { color: colors.primary }]}>{'\u25C9 BACK BAR + TAKE\u2011HOME'}</Text>
        </View>
        <Text style={s.createGroupLabel}>USED TODAY</Text>
        {usedToday.length === 0 ? (
          <Text style={s.createCardMuted}>—</Text>
        ) : (
          usedToday.map((p: any) => (
            <Text key={String(p.id)} style={s.createBulletLine} numberOfLines={1}>
              • {(p.brand ? `${p.brand} · ` : '') + (p.name ?? 'Product')}
            </Text>
          ))
        )}
        <View style={s.createCardDivider} />
        <Text style={s.createGroupLabel}>SUGGEST TAKE‑HOME</Text>
        {takeHomeSuggested.map((p: any) => {
          const id = String(p.id);
          const selected = selectedRecIds.has(id);
          return (
            <Pressable key={id} onPress={() => void toggleRec(id)} style={s.createTakeHomeRow} accessibilityRole="button">
              <View style={[s.createCheckboxSmall, selected && { borderColor: colors.primary }]}>
                <Text style={[s.createCheckboxTextSmall, selected && s.createCheckboxTextOn]}>{selected ? '\u2713' : ''}</Text>
              </View>
              <Text style={s.createTakeHomeText} numberOfLines={1}>
                {(p.brand ? `${p.brand} ` : '') + (p.name ?? 'Product')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => flow?.goTo('Rebook')}
        style={[s.createPrimaryCta, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Book Next Experience"
      >
        <Text style={s.createPrimaryCtaText}>Book Next Experience →</Text>
      </Pressable>

      <Text style={s.createTotalHint}>Running total: ${total.toFixed(0)}</Text>
    </ScrollView>
  );
}


export function TabCareContent({ appointmentId, detailId, clientDetails }: CommonProps) {
  const flow = useContext(ClientDetailsFlowContext);
  const services = Array.isArray(clientDetails.services) ? clientDetails.services : [];
  const upgrades = Array.isArray(clientDetails.recommendations) ? clientDetails.recommendations : [];
  const backBarUsed = (clientDetails.products ?? []).slice(0, 2);

  const [rating, setRating] = useState(0);
  const [trustBridge, setTrustBridge] = useState(
    'You’re in great hands — we tailor every detail to your hair’s health and your lifestyle.',
  );

  const rampUnlocked = rating >= 4;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>STAR RATING (GATE)</Text>
        <Text style={s.ratingTitle}>How was your experience today?</Text>
        <StarRow value={rating} onChange={setRating} />
        <Text style={s.ratingHint}>Rating 4–5 unlocks RAMP.</Text>
        {!rampUnlocked ? <Text style={s.muted}>RAMP hidden until rating is 4 or 5.</Text> : <Text style={s.hint}>Unlocked ✓</Text>}
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>TICKET</Text>
        {services.map((x) => (
          <View key={x.id} style={s.lineRow}>
            <Text style={s.lineName} numberOfLines={2}>
              {x.name}
            </Text>
            <Text style={s.linePrice}>${Number(x.price ?? 0).toFixed(0)}</Text>
          </View>
        ))}
        {upgrades.map((x) => (
          <View key={x.id} style={s.lineRow}>
            <Text style={s.lineName} numberOfLines={2}>
              + {x.name}
            </Text>
            <Text style={s.linePrice}>${Number(x.price ?? 0).toFixed(0)}</Text>
          </View>
        ))}
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>CARE PACKAGE</Text>
        <Text style={s.muted}>Products used in service</Text>
        {(backBarUsed.length === 0 ? [{ id: 'p-1', brand: 'SalonX', name: 'Texture Spray' }] : backBarUsed).map((p: any) => (
          <View key={String(p.id)} style={s.lineRow}>
            <Text style={s.lineName} numberOfLines={2}>
              {(p.brand ? `${p.brand} · ` : '') + (p.name ?? 'Product')}
            </Text>
            <Text style={s.linePrice}>✓</Text>
          </View>
        ))}
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>CO‑BRAND ZONE</Text>
        <View style={s.coBrandBox}>
          <Text style={s.muted}>Partner placement (mock)</Text>
        </View>
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>REFERRAL LINKS</Text>
        {['Invite a friend →', 'Share your stylist link →', 'Copy referral code →'].map((t) => (
          <Pressable key={t} onPress={() => {}} style={s.linkRow} accessibilityRole="button" accessibilityLabel={t}>
            <Text style={s.linkTextBright}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>TRUST BRIDGE LANGUAGE</Text>
        <TextInput
          value={trustBridge}
          onChangeText={setTrustBridge}
          style={s.trustInput}
          multiline
          placeholder="Write trust language…"
          placeholderTextColor={colors.text.faint}
        />
      </View>

      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>THE DROP</Text>
        <Text style={s.muted}>Send fires 3 min after checkout (mock)</Text>
        <Pressable onPress={() => {}} style={s.secondaryBtn} accessibilityRole="button" accessibilityLabel="Schedule The Drop">
          <Text style={s.secondaryBtnText}>Schedule The Drop</Text>
        </Pressable>
      </View>

      {rampUnlocked ? (
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>RAMP</Text>
          <Pressable
            onPress={() => flow?.openRamp()}
            style={s.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Open RAMP post builder"
          >
            <Text style={s.primaryBtnText}>One‑tap RAMP Post →</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={s.platformHint}>{Platform.OS === 'ios' ? 'After camera is visually distinct (green-tinted).' : 'After capture required.'}</Text>
    </ScrollView>
  );
}

function toSlot(date: Date) {
  const d = new Date(date);
  d.setHours(11, 30, 0, 0);
  return d;
}

export function TabRebookContent({ appointmentId, detailId }: { appointmentId: string; detailId: string }) {
  const flow = useContext(ClientDetailsFlowContext);
  const { resolved, setNextAppointment } = useNextAppointmentStorage(detailId);
  const [cursorMonth, setCursorMonth] = useState(() => startOfMonth(addMonths(new Date(), 1)));
  const [selectedDate, setSelectedDate] = useState<Date | null>(resolved.startAt);

  const monthStart = useMemo(() => startOfMonth(cursorMonth), [cursorMonth]);
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, w) => addWeeks(gridStart, w)), [gridStart]);
  const days = useMemo(() => weeks.flatMap((w0) => Array.from({ length: 7 }, (_, d) => addDays(w0, d))), [weeks]);

  const onSelect = useCallback(
    async (d: Date) => {
      const startAt = toSlot(d);
      setSelectedDate(startAt);
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
      await setNextAppointment({ startAt, endAt });
    },
    [setNextAppointment],
  );

  const hasSelection = selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime());

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.sectionCard}>
        <Text style={s.sectionTitle}>YOUR NEXT EXPERIENCE</Text>
        <Text style={s.muted}>6 weeks recommended · {format(cursorMonth, 'MMMM yyyy')}</Text>
      </View>

      <View style={s.sectionCard}>
        <View style={s.monthHeaderRow}>
          <Pressable onPress={() => setCursorMonth((m) => addMonths(m, -1))} style={s.monthArrow} accessibilityRole="button">
            <Text style={s.monthArrowText}>‹</Text>
          </Pressable>
          <Text style={s.monthTitle}>{format(cursorMonth, 'MMMM yyyy')}</Text>
          <Pressable onPress={() => setCursorMonth((m) => addMonths(m, 1))} style={s.monthArrow} accessibilityRole="button">
            <Text style={s.monthArrowText}>›</Text>
          </Pressable>
        </View>

        <View style={s.dowRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <Text key={d} style={s.dowText}>
              {d}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {days.map((d) => {
            const inMonth = isSameMonth(d, cursorMonth);
            const active = selectedDate ? isSameDay(d, selectedDate) : false;
            const dim = !inMonth;
            return (
              <Pressable key={d.toISOString()} onPress={() => void onSelect(d)} style={[s.dayCell, active && s.dayCellActive]} accessibilityRole="button">
                <Text style={[s.dayText, dim && s.dayTextDim, active && s.dayTextActive]}>{format(d, 'd')}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        disabled={!hasSelection}
        onPress={() => flow?.goTo('Care')}
        style={[s.primaryBtn, !hasSelection && s.primaryBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Go to Checkout"
      >
        <Text style={s.primaryBtnText}>{hasSelection ? 'Go to Checkout →' : 'Select a Date First'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: wp(4), paddingBottom: hp(4), gap: vs(12), backgroundColor: colors.background },

  headerCard: { borderRadius: ms(18), padding: ms(14), backgroundColor: colors.surface.glass70, borderWidth: 1, borderColor: colors.border.subtle12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },
  avatar: { width: ms(46), height: ms(46), borderRadius: ms(16), backgroundColor: colors.surface.white10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text.primary, fontSize: ms(16), fontWeight: '900' },
  headerMeta: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(10) },
  clientName: { color: colors.text.primary, fontSize: ms(20), fontWeight: '900', flexShrink: 1 },
  subline: { color: colors.text.muted, fontSize: ms(12), fontWeight: '800', marginTop: vs(2) },
  statusBadge: { paddingHorizontal: ms(10), paddingVertical: vs(6), borderRadius: ms(999), borderWidth: 1, borderColor: colors.border.subtle20, backgroundColor: colors.surface.white06 },
  statusText: { color: colors.text.primary, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(0.6) },

  sectionCard: { borderRadius: ms(18), padding: ms(14), backgroundColor: colors.surface.glass55, borderWidth: 1, borderColor: colors.border.subtle12, gap: vs(10) },
  sectionTitle: { color: colors.text.secondary, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(1.2) },
  bodyText: { color: colors.text.secondary, fontSize: ms(12), fontWeight: '800' },
  muted: { color: colors.text.quiet, fontSize: ms(12), fontWeight: '700' },
  errorText: { color: colors.primary, fontSize: ms(12), fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  hintText: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800', textAlign: 'center', marginTop: vs(6) },

  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: ms(12) },
  lineName: { flex: 1, color: colors.text.primary, fontSize: ms(13), fontWeight: '800' },
  linePrice: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(8) },
  dim: { opacity: 0.5 },

  actions: { gap: vs(10) },
  primaryBtn: { borderRadius: ms(999), paddingVertical: vs(14), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  primaryBtnOff: { backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12 },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  secondaryBtn: { borderRadius: ms(999), paddingVertical: vs(14), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12 },
  secondaryBtnText: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },

  capturedRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  thumb: { width: ms(52), height: ms(52), borderRadius: ms(14) },
  thumbMock: { width: ms(52), height: ms(52), borderRadius: ms(14), backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12, alignItems: 'center', justifyContent: 'center' },
  thumbMockText: { color: colors.text.quiet, fontSize: ms(10), fontWeight: '900' },

  sectionGroup: { gap: vs(10) },
  groupTitle: { color: colors.text.primary, fontSize: ms(18), fontWeight: '900', marginTop: vs(6) },
  groupSubtitle: { color: colors.text.quiet, fontSize: ms(12), fontWeight: '800' },
  intelCard: { borderRadius: ms(16), padding: ms(14), borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(12) },
  intelCardOn: { backgroundColor: colors.surface.white06, borderColor: colors.border.subtle12 },
  intelCardOff: { backgroundColor: colors.surface.white04, borderColor: colors.border.subtle10 },
  intelTealGlow: { shadowColor: colors.border.accent, shadowOpacity: 0.12, shadowRadius: ms(14), shadowOffset: { width: 0, height: vs(8) } },
  intelAmberGlow: { shadowColor: "rgba(255, 180, 0, 1)", shadowOpacity: 0.10, shadowRadius: ms(14), shadowOffset: { width: 0, height: vs(8) } },
  intelTextWrap: { flex: 1, minWidth: 0 },
  intelLabel: { color: colors.text.faint, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(1.3) },
  intelValue: { color: colors.text.secondary, fontSize: ms(13), fontWeight: '900', marginTop: vs(6) },
  intelValuePending: { color: "rgba(255, 200, 80, 0.9)" },
  intelIcon: { width: ms(28), height: ms(28), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  intelIconOn: { backgroundColor: colors.surface.white06, borderColor: colors.event.green },
  intelIconPending: { backgroundColor: colors.surface.white06, borderColor: colors.border.subtle12 },
  intelIconText: { color: colors.event.green, fontSize: ms(14), fontWeight: '900' },
  intelIconHourglass: { color: 'rgba(255, 200, 80, 0.95)' },
  intelCardTappable: { borderColor: colors.border.subtle14 },
  intelCardPressed: { opacity: 0.92 },

  intelModalRoot: { flex: 1, backgroundColor: 'transparent' },
  intelModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  intelModalKb: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' as const },
  intelModalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    borderWidth: 1,
    borderColor: colors.border.subtle12,
    paddingHorizontal: wp(4),
    paddingTop: vs(16),
    paddingBottom: vs(20),
    maxHeight: hp(88),
    gap: vs(10),
  },
  intelModalTitle: { color: colors.text.primary, fontSize: ms(18), fontWeight: '900' },
  intelModalHint: { color: colors.text.quiet, fontSize: ms(12), fontWeight: '700', lineHeight: ms(18) },
  intelModalScroll: { maxHeight: hp(32), marginBottom: vs(4) },
  intelModalFieldLabel: { color: colors.text.faint, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(1.1), marginTop: vs(4) },
  intelModalInput: {
    minHeight: vs(72),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: colors.border.subtle12,
    backgroundColor: colors.surface.white06,
    color: colors.text.primary,
    paddingHorizontal: ms(12),
    paddingVertical: vs(10),
    fontSize: ms(13),
    fontWeight: '700',
  },
  intelModalInputTall: { minHeight: vs(120) },
  intelModalActions: { flexDirection: 'row', gap: ms(10), marginTop: vs(8) },
  intelModalBtnGhost: {
    flex: 1,
    borderRadius: ms(14),
    paddingVertical: vs(14),
    alignItems: 'center',
    backgroundColor: colors.surface.white06,
    borderWidth: 1,
    borderColor: colors.border.subtle12,
  },
  intelModalBtnGhostText: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  intelModalBtnPrimary: {
    flex: 1,
    borderRadius: ms(14),
    paddingVertical: vs(14),
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  intelModalBtnPrimaryText: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },

  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: ms(10), marginTop: vs(10), marginBottom: vs(4) },
  ratingTitle: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900', textAlign: 'center', marginTop: vs(6) },
  ratingHint: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800', textAlign: 'center' },
  star: { width: ms(44), height: ms(44), borderRadius: ms(12), backgroundColor: colors.surface.white06, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border.subtle12 },
  starOn: { borderColor: colors.primary },
  starText: { color: colors.text.muted, fontSize: ms(22), fontWeight: '900' },
  starTextOn: { color: colors.primary },
  hint: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800' },

  coBrandBox: { height: hp(10), borderRadius: ms(14), borderWidth: 1, borderColor: colors.border.subtle12, backgroundColor: colors.surface.white06, alignItems: 'center', justifyContent: 'center' },
  linkRow: { paddingVertical: vs(10), borderTopWidth: 1, borderTopColor: colors.border.subtle08 },
  linkTextBright: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  trustInput: { minHeight: vs(90), borderRadius: ms(14), borderWidth: 1, borderColor: colors.border.subtle12, backgroundColor: colors.bg, color: colors.text.primary, paddingHorizontal: ms(12), paddingVertical: vs(12), fontSize: ms(14), fontWeight: '700', lineHeight: ms(20) },
  platformHint: { color: colors.text.faint, fontSize: ms(10), fontWeight: '800', paddingHorizontal: wp(1) },

  monthHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: ms(40), height: ms(40), borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.white04, borderWidth: 1, borderColor: colors.border.subtle10 },
  monthArrowText: { color: colors.text.primary, fontSize: ms(18), fontWeight: '900' },
  monthTitle: { color: colors.text.primary, fontSize: ms(14), fontWeight: '900' },
  dowRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: ms(4) },
  dowText: { width: `${100 / 7}%`, textAlign: 'center', color: colors.text.faint, fontSize: ms(10), fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: vs(8) },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellActive: {},
  dayText: { color: colors.text.secondary, fontSize: ms(12), fontWeight: '900' },
  dayTextDim: { opacity: 0.25 },
  dayTextActive: { color: colors.text.primary },

  createScrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: 0,
    paddingBottom: hp(4),
    gap: vs(10),
    backgroundColor: colors.background,
  },
  createTopBlock: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: ms(10) },
  createTitleStack: { flex: 1, minWidth: 0 },
  createMenuHit: { width: ms(40), height: ms(40), alignItems: 'center', justifyContent: 'center', marginTop: vs(2) },
  createMenuDots: { color: colors.text.primary, fontSize: ms(22), fontWeight: '900' },

  createTitle: { color: colors.text.primary, fontSize: ms(22), fontWeight: '900' },
  createSubtitle: { color: colors.text.muted, fontSize: ms(12), fontWeight: '800', marginTop: vs(4), marginBottom: vs(2) },

  createPlanCard: { borderRadius: ms(18), padding: ms(14), borderWidth: 1, borderColor: colors.border.subtle10, gap: vs(6) },
  createPlanCardSurface: { backgroundColor: colors.surface.glass55 },

  createKickerRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), marginBottom: vs(6) },
  createAccentBar: { width: ms(3), height: ms(16), borderRadius: ms(999) },
  createCardKicker: { fontSize: ms(10), fontWeight: '900', letterSpacing: ms(1.2) },

  createCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(8) },
  createCardRowName: { flex: 1, paddingRight: ms(10), color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  createCardRowMuted: { opacity: 0.5 },
  createCardRowPrice: { fontSize: ms(13), fontWeight: '900' },

  createToggleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), paddingVertical: vs(10), borderTopWidth: 1, borderTopColor: colors.border.subtle08 },
  createToggleRowFirst: { borderTopWidth: 0 },

  createCheckbox: { width: ms(22), height: ms(22), borderRadius: ms(8), borderWidth: 1, borderColor: colors.border.subtle18, backgroundColor: colors.surface.white06, alignItems: 'center', justifyContent: 'center' },
  createCheckboxText: { color: colors.text.muted, fontSize: ms(12), fontWeight: '900' },
  createCheckboxTextOn: { color: colors.text.primary },

  createToggleMeta: { flex: 1, minWidth: 0 },
  createToggleName: { color: colors.text.primary, fontSize: ms(13), fontWeight: '900' },
  createToggleNote: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800', marginTop: vs(2) },

  createGroupLabel: { color: colors.text.quiet, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(1.1), marginTop: vs(6) },
  createBulletLine: { color: colors.text.secondary, fontSize: ms(12), fontWeight: '800', marginTop: vs(8) },
  createCardMuted: { color: colors.text.quiet, fontSize: ms(12), fontWeight: '800', marginTop: vs(8) },
  createCardDivider: { height: 1, backgroundColor: colors.border.subtle10, marginTop: vs(12), marginBottom: vs(10) },

  createTakeHomeRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), paddingVertical: vs(10) },
  createCheckboxSmall: { width: ms(18), height: ms(18), borderRadius: ms(6), borderWidth: 1, borderColor: colors.border.subtle18, backgroundColor: colors.surface.white06, alignItems: 'center', justifyContent: 'center' },
  createCheckboxTextSmall: { color: colors.text.muted, fontSize: ms(11), fontWeight: '900' },
  createTakeHomeText: { flex: 1, minWidth: 0, color: colors.text.primary, fontSize: ms(12), fontWeight: '900' },

  createPrimaryCta: { marginTop: vs(8), borderRadius: ms(16), paddingVertical: vs(16), alignItems: 'center', justifyContent: 'center' },
  createPrimaryCtaText: { color: colors.text.primary, fontWeight: '900', fontSize: ms(13) },
  createTotalHint: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800', textAlign: 'center' },

});

