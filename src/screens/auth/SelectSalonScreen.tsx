import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useTenant } from '../../context/TenantContext';
import type { LocalSalonMembership } from '../../data/types';
import { ms, vs, wp, hp } from '../../utils/responsive';

export function SelectSalonScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { currentSalonId, memberships, salons, setCurrentSalonId } = useTenant();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Workspace</Text>
        <Text style={styles.subtitle}>Choose the salon you’re working in.</Text>

        <Text style={styles.section}>Your salons</Text>
        <View style={styles.card}>
          {memberships.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.empty}>No salons yet.</Text>
              <Pressable
                style={({ pressed }) => [styles.createBtn, { borderColor: primaryColor }, pressed && styles.pressed]}
                onPress={() => router.replace('/workspace-setup')}
                accessibilityRole="button"
                accessibilityLabel="Create workspace"
              >
                <Text style={[styles.createBtnText, { color: primaryColor }]}>Create workspace</Text>
              </Pressable>
            </View>
          ) : (
            memberships.map((m: LocalSalonMembership, idx: number) => {
              const salon = salons.find((s) => s.id === m.salonId);
              const label = salon?.name ?? m.salonId;
              const active = m.salonId === currentSalonId;
              const isLast = idx === memberships.length - 1;
              return (
                <Pressable
                  key={m.salonId}
                  style={({ pressed }) => [
                    styles.row,
                    !isLast && styles.rowBorder,
                    pressed && styles.pressed,
                  ]}
                  onPress={async () => {
                    await setCurrentSalonId(m.salonId);
                    router.replace('/(tabs)');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${label}`}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{label}</Text>
                    <Text style={styles.rowMeta}>{m.role}</Text>
                  </View>
                  {active ? (
                    <Text style={[styles.check, { color: primaryColor }]}>✓</Text>
                  ) : (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {memberships.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={() => router.push('/workspace-setup')}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryText, { color: primaryColor }]}>Create another workspace</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(26),
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.text.muted,
    marginBottom: vs(24),
    lineHeight: ms(20),
  },
  section: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(12),
    color: colors.text.secondary,
    letterSpacing: ms(0.5),
    marginBottom: vs(10),
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: ms(12),
    overflow: 'hidden',
    marginBottom: vs(20),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(14),
    paddingHorizontal: wp(4),
  },
  rowBorder: {
    borderBottomWidth: ms(1),
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowText: { flex: 1, paddingRight: wp(2) },
  rowTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
    color: colors.text.primary,
  },
  rowMeta: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(13),
    color: colors.text.muted,
    marginTop: vs(2),
  },
  chevron: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(22),
    color: colors.text.muted,
  },
  check: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(18),
  },
  emptyBlock: {
    padding: wp(4),
  },
  empty: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.text.muted,
    marginBottom: vs(14),
  },
  createBtn: {
    alignSelf: 'flex-start',
    paddingVertical: vs(10),
    paddingHorizontal: wp(4),
    borderRadius: ms(10),
    borderWidth: ms(1),
  },
  createBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(15),
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  secondaryText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
  },
  pressed: { opacity: 0.88 },
});
