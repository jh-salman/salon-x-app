import React from 'react';
import { View } from 'react-native';
import { MorphCardStatic } from './MorphCardStatic';
import { vs } from '../../utils/responsive';
import { STYLIST_CARD_LEFT, STYLIST_CARD_WIDTH } from './stylistConstants';

type Props = {
  /** Screen Y position (fixed). */
  top: number;
};

const CARD_HEIGHT = vs(70);

export function SubBrandingCard({ top }: Props) {
  return (
    <MorphCardStatic
      x={STYLIST_CARD_LEFT}
      top={top}
      width={STYLIST_CARD_WIDTH}
      height={CARD_HEIGHT}
      gradientId="subBrandingCardStroke"
    />
  );
}
