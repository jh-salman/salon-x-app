import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import Svg, { Path } from 'react-native-svg';
import { wp, hp, ms, vs } from '../utils/responsive';

/** Overlay blur: 'none' = no blur (dark overlay only) | 'half' = reduced blur - change to compare */
const OVERLAY_BLUR_MODE: 'none' | 'half' = 'half';

interface EmptySlotActionModalProps {
  visible: boolean;
  date: Date;
  hour: number;
  onClose: () => void;
  onNewAppointment?: (date: Date, hour: number) => void;
  onPersonalTask?: () => void;
  onEditWorkingHours?: () => void;
}

// SVG Icon Components with colored backgrounds and borders
const ClipboardIcon = () => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconBackground, styles.iconBackgroundGreen]}>
      <View style={[styles.iconBorder, styles.iconBorderGreen]} />
    </View>
    <View style={styles.iconSvgWrapper}>
      <Svg width={ms(16)} height={ms(16)} viewBox="0 0 12 14.6667" style={styles.iconSvg}>
        <Path
          d="M10.6667 1.33333H7.88C7.6 0.56 6.86667 0 6 0C5.13333 0 4.4 0.56 4.12 1.33333H1.33333C0.6 1.33333 0 1.93333 0 2.66667V13.3333C0 14.0667 0.6 14.6667 1.33333 14.6667H10.6667C11.4 14.6667 12 14.0667 12 13.3333V2.66667C12 1.93333 11.4 1.33333 10.6667 1.33333ZM6 1.33333C6.36667 1.33333 6.66667 1.63333 6.66667 2C6.66667 2.36667 6.36667 2.66667 6 2.66667C5.63333 2.66667 5.33333 2.36667 5.33333 2C5.33333 1.63333 5.63333 1.33333 6 1.33333ZM10 13.3333H2C1.63333 13.3333 1.33333 13.0333 1.33333 12.6667V3.33333C1.33333 2.96667 1.63333 2.66667 2 2.66667H2.66667V3.33333C2.66667 4.06667 3.26667 4.66667 4 4.66667H8C8.73333 4.66667 9.33333 4.06667 9.33333 3.33333V2.66667H10C10.3667 2.66667 10.6667 2.96667 10.6667 3.33333V12.6667C10.6667 13.0333 10.3667 13.3333 10 13.3333Z"
          fill="#C5EC00"
        />
      </Svg>
    </View>
  </View>
);

const CalendarIcon = () => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconBackground, styles.iconBackgroundPink]}>
      <View style={[styles.iconBorder, styles.iconBorderPink]} />
    </View>
    <View style={styles.iconSvgWrapper}>
      <Svg width={ms(16)} height={ms(16)} viewBox="0 0 12 13.3333" style={styles.iconSvg}>
        <Path
          d="M10.6667 1.33333H10V0.666667C10 0.3 9.7 0 9.33333 0C8.96667 0 8.66667 0.3 8.66667 0.666667V1.33333H3.33333V0.666667C3.33333 0.3 3.03333 0 2.66667 0C2.3 0 2 0.3 2 0.666667V1.33333H1.33333C0.593333 1.33333 0 1.93333 0 2.66667V12C0 12.7333 0.6 13.3333 1.33333 13.3333H10.6667C11.4 13.3333 12 12.7333 12 12V2.66667C12 1.93333 11.4 1.33333 10.6667 1.33333ZM6 3.33333C7.10667 3.33333 8 4.22667 8 5.33333C8 6.44 7.10667 7.33333 6 7.33333C4.89333 7.33333 4 6.44 4 5.33333C4 4.22667 4.89333 3.33333 6 3.33333ZM10 11.3333H2V10.6667C2 9.33333 4.66667 8.6 6 8.6C7.33333 8.6 10 9.33333 10 10.6667V11.3333Z"
          fill="#FA1BFE"
        />
      </Svg>
    </View>
  </View>
);

const EditIcon = () => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconBackground, styles.iconBackgroundCyan]}>
      <View style={[styles.iconBorder, styles.iconBorderCyan]} />
    </View>
    <View style={styles.iconSvgWrapper}>
      <Svg width={ms(16)} height={ms(16)} viewBox="0 0 12.0017 12.0017" style={styles.iconSvg}>
        <Path
          d="M0 9.64167V11.6683C0 11.855 0.146667 12.0017 0.333333 12.0017H2.36C2.44667 12.0017 2.53333 11.9683 2.59333 11.9017L9.87333 4.62833L7.37333 2.12833L0.1 9.40167C0.0333334 9.46833 0 9.54833 0 9.64167ZM11.8067 2.695C12.0667 2.435 12.0667 2.015 11.8067 1.755L10.2467 0.195C9.98667 -0.065 9.56667 -0.065 9.30667 0.195L8.08667 1.415L10.5867 3.915L11.8067 2.695V2.695Z"
          fill="#00CDEC"
        />
      </Svg>
    </View>
  </View>
);

const CloseIcon = () => (
  <Svg width={ms(20)} height={ms(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface MenuItemProps {
  icon: React.ComponentType;
  title: string;
  description: string;
  onPress: () => void;
}

const MenuItem = ({ icon: Icon, title, description, onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Icon />
    <View style={styles.menuTextContainer}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDescription}>{description}</Text>
    </View>
  </TouchableOpacity>
);

export function EmptySlotActionModal({
  visible,
  date,
  hour,
  onClose,
  onNewAppointment,
  onPersonalTask,
  onEditWorkingHours,
}: EmptySlotActionModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.max(300, Math.min(screenWidth * 0.4, 380));

  const slotTime = new Date(date);
  slotTime.setHours(hour, 0, 0, 0);
  const dateStr = format(slotTime, 'EEE, MMM d, yyyy');
  const timeStr = format(slotTime, 'h:mm a');

  const handleOptionPress = (callback?: () => void) => {
    callback?.();
    onClose();
  };

  const renderOverlay = () => {
    if (OVERLAY_BLUR_MODE === 'none') {
      return <View style={[StyleSheet.absoluteFill, styles.overlayNoBlur]} />;
    }
    return (
      <BlurView
        intensity={30}
        tint="dark"
        style={StyleSheet.absoluteFill}
        {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        {renderOverlay()}
      </Pressable>
      <View style={styles.modalContainer}>
        <Pressable style={[styles.modalContent, { width: cardWidth }]} onPress={(e) => e.stopPropagation()}>
          <BlurView
            intensity={50}
            tint="dark"
            style={StyleSheet.absoluteFill}
            {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
          />
          <View style={styles.modal}>
            <View style={styles.modalBorder} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.dateText}>{dateStr}</Text>
                <Text style={styles.timeText}>{timeStr}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <CloseIcon />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <MenuItem
              icon={ClipboardIcon}
              title="New appointment"
              description="Create a new appointment"
              onPress={() => handleOptionPress(() => onNewAppointment?.(date, hour))}
            />

            <MenuItem
              icon={CalendarIcon}
              title="Personal task"
              description="Create a personal task"
              onPress={() => handleOptionPress(onPersonalTask)}
            />

            <MenuItem
              icon={EditIcon}
              title="Edit working hours"
              description="Edit your calendar working hours"
              onPress={() => handleOptionPress(onEditWorkingHours)}
            />
          </View>
        </Pressable>
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
  overlayNoBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: ms(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp(1.5) },
    shadowOpacity: 0.5,
    shadowRadius: ms(24),
    elevation: 12,
  },
  modal: {
    backgroundColor: 'rgba(8, 40, 56, 0.5)',
    borderRadius: ms(20),
    paddingTop: hp(3),
    paddingBottom: hp(3),
    paddingHorizontal: wp(4),
    gap: hp(2.5),
    overflow: 'hidden',
  },
  modalBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(20),
    pointerEvents: 'none',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  headerText: { flex: 1, gap: hp(0.5) },
  closeButton: { padding: ms(4) },
  dateText: { fontSize: ms(16), color: '#FFFFFF', fontWeight: '500', textAlign: 'left' },
  timeText: { fontSize: ms(16), color: '#FFFFFF', fontWeight: '500', textAlign: 'left' },
  divider: { width: '100%', height: 1, backgroundColor: '#878787' },
  menuItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: wp(4),
    gap: ms(8),
  },
  menuTextContainer: { flex: 1, gap: hp(0.5) },
  menuTitle: { fontSize: ms(16), color: '#FFFFFF', fontWeight: '500' },
  menuDescription: { fontSize: ms(12), color: '#818181', fontWeight: '500' },
  iconContainer: { width: ms(37), height: vs(38), position: 'relative' },
  iconBackground: {
    width: ms(37),
    height: vs(38),
    borderRadius: ms(8),
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconBackgroundGreen: {
    backgroundColor: 'rgba(197, 236, 0, 0.2)',
  },
  iconBackgroundPink: {
    backgroundColor: 'rgba(247, 0, 251, 0.2)',
  },
  iconBackgroundCyan: {
    backgroundColor: 'rgba(0, 205, 236, 0.2)',
  },
  iconBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ms(8),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  iconBorderGreen: {
    borderColor: '#C5EC00',
  },
  iconBorderPink: {
    borderColor: '#FA1BFE',
  },
  iconBorderCyan: {
    borderColor: '#00CDEC',
  },
  iconSvgWrapper: {
    position: 'absolute',
    top: vs(11),
    left: ms(10.5),
    width: ms(16),
    height: ms(16),
  },
  iconSvg: {
    width: '100%',
    height: '100%',
  },
});
