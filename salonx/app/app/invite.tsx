import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTenant } from '../src/context/TenantContext';
import { acceptOrgInvitation } from '../src/lib/orgApi';
import { highlightColors } from '../src/theme';
import { wp, hp, ms } from '../src/utils/responsive';

export default function InviteDeepLinkScreen() {
  const router = useRouter();
  const { invitationId } = useLocalSearchParams<{ invitationId?: string | string[] }>();
  const { token } = useAuth();
  const { refreshSalons } = useTenant();
  const [busy, setBusy] = useState(false);

  const id = Array.isArray(invitationId) ? invitationId[0] : invitationId;
  const validId = typeof id === 'string' && id.trim().length > 0 ? id.trim() : '';

  const onAccept = useCallback(async () => {
    if (!token || !validId) return;
    setBusy(true);
    try {
      await acceptOrgInvitation(token, validId);
      await refreshSalons();
      Alert.alert('Welcome', 'You joined the team.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [token, validId, refreshSalons, router]);

  if (!validId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text style={styles.title}>Invalid invite</Text>
        <Text style={styles.sub}>This link is missing an invitation id.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text style={styles.title}>Sign in first</Text>
        <Text style={styles.sub}>Use the same email address this invite was sent to.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.btnText}>Sign in</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Team invitation</Text>
      <Text style={styles.sub}>Accept to join this workspace on SalonX.</Text>
      <TouchableOpacity
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={() => void onAccept()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Accept invitation</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: wp(6),
    justifyContent: 'center',
  },
  title: {
    fontSize: ms(22),
    fontWeight: '700',
    color: '#fff',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  sub: {
    fontSize: ms(15),
    color: '#888',
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: ms(22),
  },
  btn: {
    backgroundColor: highlightColors.neonPink,
    paddingVertical: hp(1.8),
    borderRadius: ms(12),
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
});
