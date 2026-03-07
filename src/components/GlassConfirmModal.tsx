import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { RFValue } from 'react-native-responsive-fontsize';
import { colors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';

export type GlassModalMode = 'move' | 'resize' | 'notify_client' | 'cancel_appointment';

interface GlassConfirmModalProps {
  visible: boolean;
  mode: GlassModalMode;
  primaryText: string;
  secondaryText?: string;
  onYes: () => void;
  onNo: () => void;
}

export function GlassConfirmModal({
  visible,
  mode,
  primaryText,
  secondaryText,
  onYes,
  onNo,
}: GlassConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView
          intensity={60}
          tint="dark"
          style={StyleSheet.absoluteFill}
          {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
        />
        <View style={styles.cardWrapper}>
          <BlurView
            intensity={55}
            tint="dark"
            style={styles.glassCard}
            {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
          >
            <View style={styles.cardInner}>
              <Text style={styles.primaryText}>{primaryText}</Text>
              {secondaryText ? (
                <Text style={styles.secondaryText}>{secondaryText}</Text>
              ) : null}
              <View style={styles.buttons}>
                <Pressable
                  onPress={onNo}
                  style={({ pressed }) => [styles.button, styles.buttonNo, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.buttonTextNo}>No</Text>
                </Pressable>
                <Pressable
                  onPress={onYes}
                  style={({ pressed }) => [styles.button, styles.buttonYes, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.buttonTextYes}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: { width: '85%', maxWidth: wp(80) },
  glassCard: {
    borderRadius: ms(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(40,45,55,0.1)',
  },
  cardInner: { padding: wp(6), gap: hp(2) },
  primaryText: {
    fontSize: RFValue(22),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  secondaryText: {
    fontSize: RFValue(16),
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  buttons: {
    flexDirection: 'row',
    gap: ms(12),
    marginTop: hp(2),
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: ms(12),
    alignItems: 'center',
  },
  buttonNo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonYes: {
    backgroundColor: colors.brand,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonTextNo: {
    fontSize: RFValue(15),
    fontWeight: '600',
    color: colors.text.primary,
  },
  buttonTextYes: {
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#fff',
  },
});
