import React from 'react';
import { MorphCardStatic } from './MorphCardStatic';
import {
  STYLIST_CARD_LEFT,
  STYLIST_CARD_WIDTH,
  SUB_BRANDING_CARD_HEIGHT,
} from './stylistConstants';

type Props = {
  /** Screen Y position (fixed). */
  top: number;
};

/**
 * Sub-branding card for Stylist screen: same curved shape as other cards,
 * rail-aligned right edge, theme gradient stroke. Renders below Muse button.
 */
export function StylistSubBranding({ top }: Props) {
  return (
    <MorphCardStatic
      x={STYLIST_CARD_LEFT}
      top={top}
      width={STYLIST_CARD_WIDTH}
      height={SUB_BRANDING_CARD_HEIGHT}
      gradientId="stylistSubBrandingStroke"
    />
  );
}
