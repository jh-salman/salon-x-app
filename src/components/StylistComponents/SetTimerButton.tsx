import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ms } from '../../utils/responsive';
import { RFValue } from '../../utils/responsive';

const GRAY = '#9a9a9a';

type SetTimerButtonProps = {
  onPress?: () => void;
  /** Button size (width/height). Default fits card. */
  size?: number;
};

export function SetTimerButton({ onPress, size = ms(44) }: SetTimerButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: ms(12),
          borderColor: GRAY,
        },
      ]}
      onPress={onPress}
      accessibilityLabel="Set timer"
    >
      <Text style={[styles.text, { color: GRAY }]} numberOfLines={2}>
        Set{'\n'}Timer
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontSize: RFValue(10),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: RFValue(12),
  },
});
