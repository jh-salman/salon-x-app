import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ScissorsIcon, PersonIcon, SettingsIcon } from '../components/icons';
import { colors } from '../theme';

const TAB_CONFIG = [
  { route: 'index', name: 'Stylist', Icon: ScissorsIcon },
  { route: 'clients', name: 'Clients', Icon: PersonIcon },
  { route: 'settings', name: 'Settings', Icon: SettingsIcon },
] as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
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
          {TAB_CONFIG.map(({ route, name, Icon }, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              if (!isFocused) {
                navigation.navigate(route);
              }
            };
            return (
              <Pressable
                key={route}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.navItem,
                  pressed && styles.navItemPressed,
                ]}
              >
                <Icon
                  color={isFocused ? colors.highlight.neonPink : colors.nav.icon}
                  size={23}
                />
                <Text
                  style={[
                    styles.navLabel,
                    isFocused && styles.navLabelActive,
                  ]}
                >
                  {name}
                </Text>
                {route === 'index' && isFocused && <View style={styles.tabDot} />}
              </Pressable>
            );
          })}
        </View>
        <View style={[StyleSheet.absoluteFill, styles.border]} pointerEvents="none" />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  blurContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.highlight.neonPink,
    minWidth: 280,
  },
  border: {
    borderWidth: 0.5,
    borderColor: colors.highlight.neonPink,
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
  navLabelActive: {
    color: colors.highlight.neonPink,
    fontWeight: '600',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.highlight.neonPink,
    marginTop: 4,
  },
});
