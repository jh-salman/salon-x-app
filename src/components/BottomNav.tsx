import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ScissorsIcon, PersonIcon, SettingsIcon } from './icons';
import { colors } from '../theme';

const NAV_ITEMS = [
  { id: 'stylist', label: 'Stylist', Icon: ScissorsIcon },
  { id: 'clients', label: 'Clients', Icon: PersonIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
] as const;

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <BlurView
      intensity={20}
      tint="dark"
      style={styles.blurContainer}
      {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
    >
      <LinearGradient
        colors={['rgba(8, 40, 56, 0.12)', 'rgba(2, 3, 4, 0.36)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.21)', 'rgba(0, 0, 0, 0.635)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      />
      <View style={styles.navContent}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <Pressable
            key={id}
            onPress={() => onTabChange(id)}
            style={({ pressed }) => [
              styles.navItem,
              pressed && styles.navItemPressed,
            ]}
          >
            <Icon color={colors.nav.icon} />
            <Text style={styles.navLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[StyleSheet.absoluteFill, styles.border]} pointerEvents="none" />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.border.accent,
  },
  border: {
    borderWidth: 0.5,
    borderColor: colors.border.accent,
    borderRadius: 8,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingVertical: 9,
    gap: 40,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  navItemPressed: {
    opacity: 0.8,
  },
  navLabel: {
    fontSize: 12,
    color: colors.nav.icon,
    fontWeight: '400',
  },
});
