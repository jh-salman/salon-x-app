import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  softConfirm: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  /** Quick "jiggle" when a service timer completes. */
  timerDoneJiggle: async () => {
    // Only vibration (no sound): two medium impacts with a tiny gap.
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 60));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
};
