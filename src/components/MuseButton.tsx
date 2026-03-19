import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ms, vs } from '../utils/responsive';
import { RFValue } from '../utils/responsive';

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export type MuseButtonProps = {
  onPress?: () => void;
  style?: ViewStyle;
};

export function MuseButton({ onPress, style }: MuseButtonProps) {
  const { primaryColor } = useTheme();
  const glowBg = hexToRgba(primaryColor, 0.28);
  const textShadow = hexToRgba(primaryColor, 0.12);

  return (
    <Pressable
      style={[styles.button, { borderColor: primaryColor }, style]}
      onPress={onPress}
      android_ripple={{ color: 'transparent' }}
      accessibilityRole="button"
      accessibilityLabel="Muse"
    >
      {/* glow under dot */}
      <View
        style={[
          styles.bottomGlow,
          { backgroundColor: glowBg, shadowColor: primaryColor },
        ]}
      />

      {/* dot */}
      <LinearGradient
        colors={[primaryColor, primaryColor]}
        locations={[0, 1]}
        start={{ x: 0.35, y: 0.35 }}
        end={{ x: 1, y: 1 }}
        style={[styles.dot, { shadowColor: primaryColor }]}
      />

      <Text
        style={[
          styles.text,
          { color: primaryColor, textShadowColor: textShadow },
        ]}
      >
        Muse
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    height: vs(22),
    marginTop: vs(3),
    paddingHorizontal: ms(20),
    borderRadius: ms(16),
    borderWidth: 1,
    backgroundColor: '#0f1012',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(2),

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },

  bottomGlow: {
    position: 'absolute',
    left: ms(28),
    top: vs(30),
    width: ms(56),
    height: vs(18),
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },

  dot: {
    width: ms(12),
    height: ms(12),
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },

  text: {
    fontSize: RFValue(11),
    fontWeight: '600',
    lineHeight: RFValue(18),
    letterSpacing: -0.2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
