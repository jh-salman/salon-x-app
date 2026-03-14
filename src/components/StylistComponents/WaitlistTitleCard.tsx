import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ms, vs, RFValue } from '../../utils/responsive';

/** Waiting list section title card path (309×24 viewBox). */
const WAITLIST_TITLE_PATH =
  'M0 4C0 1.79086 1.79086 0 4 0H298.488C300.697 0 302.546 1.79602 302.947 3.96861C303.346 6.13782 304.094 9.0747 305.493 12.4706C306.366 14.5912 307.223 16.7554 307.951 18.6275C308.962 21.2248 307.036 24 304.25 24H4C1.79086 24 0 22.2091 0 20V4Z';

const CARD_WIDTH = ms(292);
const CARD_HEIGHT = vs(24);
const CARD_LEFT = ms(12);

type Props = {
  /** Screen Y position (fixed). */
  top: number;
  title?: string;
};

export function WaitlistTitleCard({ top, title = 'Waiting list' }: Props) {
  return (
    <View
      style={[styles.wrap, { left: CARD_LEFT, top, width: CARD_WIDTH, height: CARD_HEIGHT }]}
      pointerEvents="none"
    >
      <Svg width={CARD_WIDTH} height={CARD_HEIGHT} viewBox="0 0 309 24" style={StyleSheet.absoluteFill}>
        <Path d={WAITLIST_TITLE_PATH} fill="#1A1A1A" />
      </Svg>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: ms(12),
  },
  title: {
    color: '#FFFFFF',
    fontSize: RFValue(13),
    fontWeight: '600',
  },
});
