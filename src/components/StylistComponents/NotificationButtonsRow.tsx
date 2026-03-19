import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ms, vs } from '../../utils/responsive';
import { RFValue } from '../../utils/responsive';
import { STYLIST_CARD_LEFT, STYLIST_CARD_WIDTH } from './stylistConstants';

export type NotificationButtonItem = {
  label: string;
  count: number;
  color: string;
};

const WAITING_COLOR = '#9a9a9a';

type NotificationButtonProps = {
  label: string;
  count: number;
  badgeColor: string;
  onPress?: () => void;
};

function NotificationButton({
  label,
  count,
  badgeColor,
  onPress,
}: NotificationButtonProps) {
  return (
    <Pressable style={styles.buttonWrap} onPress={onPress}>
      <LinearGradient
        colors={['#eeeeee', '#bcbcbc', '#7d7d7d']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.button}
      >
        <View style={styles.topGloss} />
        <Text style={styles.buttonText}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/** Height reserved for the notification buttons row in waiting list area (for layout). */
export const NOTIFICATION_ROW_HEIGHT = vs(32);

type Props = {
  /** Referrals, Reviews, Messages – only buttons with count > 0 are shown. */
  items: NotificationButtonItem[];
  /** When > 0, a "Waiting" button is shown first (only in waiting list area if active). */
  waitlistCount?: number;
  /** Screen Y position – row lives in waiting list area, so use top. */
  top: number;
};

/**
 * Just the row of buttons (no container). Use inside WaitlistTitleCard on the right.
 */
export function NotificationButtonsInline({
  items,
  waitlistCount = 0,
}: {
  items: NotificationButtonItem[];
  waitlistCount?: number;
}) {
  const activeItems = items.filter((i) => i.count > 0);
  const showWaiting = waitlistCount > 0;
  const hasAny = showWaiting || activeItems.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <View style={styles.row}>
      {showWaiting && (
        <NotificationButton
          label="Waiting"
          count={waitlistCount}
          badgeColor={WAITING_COLOR}
        />
      )}
      {activeItems.map((item) => (
        <NotificationButton
          key={item.label}
          label={item.label}
          count={item.count}
          badgeColor={item.color}
        />
      ))}
    </View>
  );
}

/**
 * Small horizontal row of buttons in the waiting list area (standalone row below title).
 * Only shows buttons that have active response (count > 0); Waiting shows when waitlistCount > 0.
 */
export function NotificationButtonsRow({
  items,
  waitlistCount = 0,
  top,
}: Props) {
  const activeItems = items.filter((i) => i.count > 0);
  const showWaiting = waitlistCount > 0;
  const hasAny = showWaiting || activeItems.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <View style={[styles.container, { top }]} pointerEvents="box-none">
      <View style={styles.inner}>
        <View style={styles.line} />
        <NotificationButtonsInline items={items} waitlistCount={waitlistCount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: NOTIFICATION_ROW_HEIGHT,
    paddingTop: vs(6),
    alignItems: 'center',
  },
  inner: {
    width: STYLIST_CARD_WIDTH,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#555',
  },
  row: {
    flexDirection: 'row',
    gap: ms(5),
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  button: {
    minWidth: ms(46),
    height: vs(20),
    paddingHorizontal: ms(8),
    borderRadius: ms(6),
    borderWidth: 1.5,
    borderColor: '#52215f',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  topGloss: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: '42%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  buttonText: {
    color: '#f0f0f0',
    fontSize: RFValue(9),
    fontWeight: '400',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -vs(3),
    right: -ms(3),
    width: ms(15),
    height: ms(15),
    borderRadius: ms(7.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    color: '#fff',
    fontSize: RFValue(8),
    fontWeight: '700',
    lineHeight: RFValue(9),
  },
});
