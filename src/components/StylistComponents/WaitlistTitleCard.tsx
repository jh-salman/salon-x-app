import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ms, RFValue, vs } from '../../utils/responsive';
import {
  STYLIST_CARD_LEFT,
  STYLIST_CARD_WIDTH,
  STYLIST_CONTENT_PADDING_LEFT,
} from './stylistConstants';

/** Height of the "Waiting list" title row (used for layout in StylistScreen). */
export const WAITLIST_TITLE_HEIGHT = vs(20);

const TITLE_BORDER_RADIUS = vs(4);
const DOT_SIZE = ms(12);

type Props = {
  /** Screen Y position (fixed). */
  top: number;
  /** Section title (default: "Waiting list"). */
  title?: string;
  /** Optional content on the right (e.g. Waiting / Referrals / Messages buttons). */
  rightContent?: ReactNode;
};

/**
 * Waiting list section title. Left: dot + title; right: optional buttons.
 * Same horizontal line as appointment cards; buttons sit on the right of the title row.
 */
export function WaitlistTitleCard({
  top,
  title = 'Waiting list',
  rightContent,
}: Props) {
  const { primaryColor } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          left: STYLIST_CARD_LEFT,
          top,
          width: STYLIST_CARD_WIDTH,
          height: WAITLIST_TITLE_HEIGHT,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <View
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: primaryColor,
          }}
        />
        <Text style={[styles.title, { color: primaryColor }]} numberOfLines={1}>
          {title}
        </Text>
        {rightContent != null ? (
          <View style={styles.right}>{rightContent}</View>
        ) : null}
      </View>
    </View>
  );
}

const TITLE_BG = '#1A1A1A';

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TITLE_BG,
    paddingLeft: STYLIST_CONTENT_PADDING_LEFT,
    paddingRight: ms(8),
    borderTopLeftRadius: TITLE_BORDER_RADIUS,
    borderBottomLeftRadius: TITLE_BORDER_RADIUS,
  },
  content: {
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(7),
  },
  title: {
    fontSize: RFValue(13),
    fontWeight: '600',
    flexShrink: 1,
  },
  right: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
});
