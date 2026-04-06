import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MorphCardStatic } from './MorphCardStatic';
import { vs } from '../../utils/responsive';
import { STYLIST_CARD_LEFT, STYLIST_CARD_WIDTH } from './stylistConstants';

type Props = {
  /** Screen Y position (fixed). */
  top: number;
};

const CARD_HEIGHT = vs(110);
const RIGHT_BORDER_RADIUS = vs(500);

export function MainBrandingCard({ top }: Props) {
  return (
    <View
      style={[
        styles.clipWrap,
        {
          left: STYLIST_CARD_LEFT,
          top,
          width: STYLIST_CARD_WIDTH,
          height: CARD_HEIGHT,
          borderTopRightRadius: RIGHT_BORDER_RADIUS,
          borderBottomRightRadius: RIGHT_BORDER_RADIUS,
        },
      ]}
      pointerEvents="none"
    >
      <MorphCardStatic
        x={0}
        top={0}
        width={STYLIST_CARD_WIDTH}
        height={CARD_HEIGHT}
        gradientId="mainBrandingCardStroke"
        screenLeft={STYLIST_CARD_LEFT}
        screenTop={top}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clipWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
