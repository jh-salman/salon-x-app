import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import type { ClientDetails } from '../../data/types';
import { colors } from '../../theme';
import { ms, vs, wp, hp } from '../../utils/responsive';
import { useAppointmentMedia } from '../../hooks/useAppointmentMedia';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { buildRampPost, markRampPostCopied, type ApiRampPostPayload } from '../../lib/appointmentApi';

type Props = {
  appointmentId: string;
  detailId: string;
  clientDetails: ClientDetails;
  onDone?: () => void;
};

type Phase = 'reveal' | 'post' | 'afterCopy';

function isMockUri(uri: string | undefined | null): boolean {
  return typeof uri === 'string' && uri.startsWith('mock://');
}

export default function RampPostBuilderScreen({ appointmentId, detailId, clientDetails, onDone }: Props) {
  const safeName = clientDetails.clientName?.trim() ? clientDetails.clientName.trim() : 'Client';
  const { media, upsert } = useAppointmentMedia(detailId);
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const [phase, setPhase] = useState<Phase>('reveal');
  const [tagCount, setTagCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [apiPost, setApiPost] = useState<ApiRampPostPayload | null>(null);

  const caption = useMemo(() => {
    if (apiPost?.caption) return apiPost.caption;
    const service = clientDetails.services?.[0]?.name ?? 'a transformation';
    return `New look for ${safeName} — ${service}. Products + plan attached.`;
  }, [apiPost?.caption, clientDetails.services, safeName]);

  const referral = useMemo(() => {
    if (apiPost?.referralUrl) return apiPost.referralUrl.replace(/^https?:\/\//, '');
    return `salonx.com/ref/${safeName.toLowerCase().replace(/\\s+/g, '-')}`;
  }, [apiPost?.referralUrl, safeName]);

  useEffect(() => {
    if (phase !== 'post') return;
    setTagCount(0);
    const timers: any[] = [];
    for (let i = 1; i <= 6; i++) {
      timers.push(
        setTimeout(() => {
          setTagCount(i);
        }, 300 * i),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const onBuild = useCallback(async () => {
    setPhase('post');
    if (!token || !currentSalonId) return;
    try {
      const { data } = await buildRampPost(token, currentSalonId, appointmentId);
      setApiPost(data);
      if (data.beforeUrl) await upsert({ beforeUri: data.beforeUrl });
      if (data.afterUrl) await upsert({ afterUri: data.afterUrl });
    } catch {
      // best-effort
    }
  }, [token, currentSalonId, appointmentId, upsert]);

  const onCopy = useCallback(async () => {
    setCopied(true);
    setPhase('afterCopy');
    if (token && currentSalonId) {
      try {
        await markRampPostCopied(token, currentSalonId, appointmentId);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      onDone?.();
    }, 900);
  }, [appointmentId, token, currentSalonId, onDone]);

  const tags =
    apiPost?.tags?.length ? apiPost.tags : ['@salonx', '@stylist', '@brand', '#brand', '#service', '#industry'];

  return (
    <View style={styles.root}>
      {phase === 'reveal' ? (
        <View style={styles.content}>
          <Text style={styles.starBig}>⭐️</Text>
          <Text style={styles.revealHeadline}>5 stars. Let’s show it off.</Text>
          <Text style={styles.revealSub}>
            Your before + after is ready to fly. We built the post.{"\n"}All you do is paste it.
          </Text>
          <View style={styles.splitRow}>
            <View style={styles.splitBox}>
              {media?.beforeUri && !isMockUri(media.beforeUri) ? (
                <Image source={{ uri: media.beforeUri }} style={[styles.splitImg, styles.beforeGray]} />
              ) : (
                <Text style={styles.splitLabel}>BEFORE</Text>
              )}
              <Text style={styles.splitCorner}>BEFORE</Text>
            </View>
            <View style={styles.splitBox}>
              {media?.afterUri && !isMockUri(media.afterUri) ? (
                <Image source={{ uri: media.afterUri }} style={styles.splitImg} />
              ) : (
                <Text style={styles.splitLabel}>AFTER</Text>
              )}
              <Text style={[styles.splitCorner, styles.splitCornerAfter]}>AFTER</Text>
            </View>
          </View>
          <Pressable onPress={onBuild} style={styles.buildBtn} accessibilityRole="button" accessibilityLabel="Build my post">
            <Text style={styles.buildBtnText}>Build My Post →</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'post' ? (
        <View style={styles.content}>
          <View style={styles.postCard}>
            <View style={styles.postHeaderRow}>
              <View style={styles.postAvatar} />
              <View style={styles.postHeaderMeta}>
                <Text style={styles.postHeader}>Butterfly lofts ✓</Text>
                <Text style={styles.postSub}>@butterflylofts · just now</Text>
              </View>
            </View>
            <View style={styles.postMedia}>
              <View style={styles.baRow}>
                <View style={styles.baHalf}>
                  {media?.beforeUri && !isMockUri(media.beforeUri) ? (
                    <Image source={{ uri: media.beforeUri }} style={[styles.postImg, styles.beforeGray]} />
                  ) : (
                    <Text style={styles.splitLabel}>BEFORE</Text>
                  )}
                  <Text style={styles.baLabel}>BEFORE</Text>
                </View>
                <View style={styles.baHalf}>
                  {media?.afterUri && !isMockUri(media.afterUri) ? (
                    <Image source={{ uri: media.afterUri }} style={styles.postImg} />
                  ) : (
                    <Text style={styles.splitLabel}>AFTER</Text>
                  )}
                  <Text style={styles.baLabel}>AFTER</Text>
                </View>
              </View>
            </View>
            <Text style={styles.caption}>Shaggy to sharp.</Text>
            <Text style={styles.captionSub}>Products Used:</Text>
            <Text style={styles.caption}>{caption}</Text>
            <View style={styles.tagsWrap}>
              {tags.slice(0, tagCount).map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
            {tagCount >= 6 ? (
              <View style={styles.refRow}>
                <Text style={styles.refText}>🔗 {referral}</Text>
              </View>
            ) : (
              <Text style={styles.hint}>Generating tags…</Text>
            )}
          </View>
          {tagCount >= 6 ? (
            <Pressable onPress={onCopy} style={styles.copyBtnWide} accessibilityRole="button" accessibilityLabel="Copy link and caption">
              <Text style={styles.copyBtnWideText}>📋 Copy Link + Caption</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {phase === 'afterCopy' ? (
        <View style={styles.content}>
          <View style={styles.dualRow}>
            <View style={styles.pushCard}>
              <Text style={styles.pushTitle}>Client feed</Text>
              <Text style={styles.pushSub}>{copied ? 'Copied, ready to post' : 'Preparing…'}</Text>
            </View>
            <View style={styles.pushCard}>
              <Text style={styles.pushTitle}>Salon feed</Text>
              <Text style={styles.pushSub}>Pushed to salon feed</Text>
            </View>
          </View>
          <Text style={styles.hint}>Sending…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: wp(4), paddingTop: vs(10), gap: vs(12) },
  starBig: { textAlign: 'center', fontSize: ms(28), marginTop: vs(6) },
  revealHeadline: { textAlign: 'center', color: colors.text.primary, fontSize: ms(18), fontWeight: '900' },
  revealSub: { textAlign: 'center', color: colors.text.muted, fontSize: ms(12), fontWeight: '800' },
  splitRow: { flexDirection: 'row', gap: ms(10) },
  splitBox: { flex: 1, height: hp(24), borderRadius: ms(18), backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  splitImg: { width: '100%', height: '100%' },
  beforeGray: { opacity: 0.55 },
  splitLabel: { color: colors.text.quiet, fontSize: ms(12), fontWeight: '900' },
  splitCorner: { position: 'absolute', top: vs(10), left: ms(12), color: colors.text.muted, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(2) },
  splitCornerAfter: { color: colors.event.green },
  buildBtn: { borderRadius: ms(16), paddingVertical: vs(16), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.event.green },
  buildBtnText: { color: colors.text.onGreen, fontSize: ms(13), fontWeight: '900' },

  postCard: { borderRadius: ms(18), padding: ms(14), backgroundColor: colors.surface.glass55, borderWidth: 1, borderColor: colors.border.subtle12, gap: vs(10) },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  postAvatar: { width: ms(28), height: ms(28), borderRadius: ms(10), backgroundColor: colors.surface.white06 },
  postHeaderMeta: { flex: 1, minWidth: 0 },
  postHeader: { color: colors.text.primary, fontSize: ms(12), fontWeight: '900' },
  postSub: { color: colors.text.quiet, fontSize: ms(10), fontWeight: '800', marginTop: vs(2) },
  postMedia: { height: hp(26), borderRadius: ms(14), overflow: 'hidden', backgroundColor: colors.surface.white06 },
  baRow: { flex: 1, flexDirection: 'row' },
  baHalf: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  baLabel: { position: 'absolute', top: vs(10), left: ms(12), color: colors.text.muted, fontSize: ms(10), fontWeight: '900', letterSpacing: ms(2) },
  postImg: { width: '100%', height: '100%' },
  caption: { color: colors.text.primary, fontSize: ms(12), fontWeight: '800' },
  captionSub: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '900' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(8) },
  tagPill: { paddingHorizontal: ms(10), paddingVertical: vs(8), borderRadius: ms(999), backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12 },
  tagText: { color: colors.text.primary, fontSize: ms(11), fontWeight: '900' },
  refRow: { gap: vs(10) },
  refText: { color: colors.text.muted, fontSize: ms(11), fontWeight: '900' },
  copyBtnWide: { borderRadius: ms(16), paddingVertical: vs(16), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.event.green },
  copyBtnWideText: { color: colors.text.onGreen, fontSize: ms(13), fontWeight: '900' },
  hint: { color: colors.text.quiet, fontSize: ms(11), fontWeight: '800' },

  dualRow: { flexDirection: 'row', gap: ms(10), paddingHorizontal: wp(4), paddingTop: vs(10) },
  pushCard: { flex: 1, borderRadius: ms(18), padding: ms(14), backgroundColor: colors.surface.white06, borderWidth: 1, borderColor: colors.border.subtle12 },
  pushTitle: { color: colors.text.primary, fontSize: ms(12), fontWeight: '900' },
  pushSub: { color: colors.text.muted, fontSize: ms(11), fontWeight: '800', marginTop: vs(6) },
});

