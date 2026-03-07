import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { RFValue } from 'react-native-responsive-fontsize';
import { format } from 'date-fns';
import { colors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';
import type { Appointment } from './CalendarMiddleSection';

interface AppointmentOptionsModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onEdit?: (apt: Appointment) => void;
  onReschedule?: (apt: Appointment) => void;
  onCancel?: (apt: Appointment) => void;
}

export function AppointmentOptionsModal({
  visible,
  appointment,
  onClose,
  onEdit,
  onReschedule,
  onCancel,
}: AppointmentOptionsModalProps) {
  if (!appointment) return null;

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
              <Text style={styles.title}>Appointment Options</Text>
              <Text style={styles.subtitle}>
                {appointment.clientName} • {format(appointment.startTime, 'h:mm a')} – {format(appointment.endTime, 'h:mm a')}
              </Text>
              <View style={styles.options}>
                {onEdit && (
                  <Pressable
                    onPress={() => onEdit(appointment)}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <Text style={styles.optionText}>Modify appointment</Text>
                  </Pressable>
                )}
                {onReschedule && (
                  <Pressable
                    onPress={() => onReschedule(appointment)}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <Text style={styles.optionText}>Reschedule appointment</Text>
                  </Pressable>
                )}
                {onCancel && (
                  <Pressable
                    onPress={() => onCancel(appointment)}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <Text style={[styles.optionText, styles.optionTextRed]}>Cancel appointment</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.optionPressed]}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { width: '85%', maxWidth: wp(80) },
  glassCard: {
    borderRadius: ms(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(40,45,55,0.1)',
  },
  cardInner: { padding: wp(6), gap: hp(2) },
  title: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: RFValue(14),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  options: { gap: hp(1) },
  option: {
    paddingVertical: hp(1.8),
    borderRadius: ms(12),
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionPressed: { opacity: 0.8 },
  optionText: { fontSize: RFValue(15), fontWeight: '600', color: colors.text.primary },
  optionTextRed: { color: '#ff6b6b' },
  closeButton: {
    paddingVertical: hp(1.5),
    alignItems: 'center',
  },
  closeButtonText: { fontSize: RFValue(14), color: colors.text.secondary },
});
