import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ms, vs } from '../../utils/responsive';

/** Sub-branding card path (352×68 viewBox). Rounded rect with angled top-right. */
const SUB_BRANDING_PATH =
  'M4 0.75H347.863C349.981 0.750019 351.533 2.74285 351.015 4.7959L335.85 64.7959C335.485 66.2387 334.186 67.25 332.698 67.25H4C2.20508 67.25 0.75 65.7949 0.75 64V4C0.75 2.20507 2.20507 0.75 4 0.75Z';

type Props = {
  /** Screen Y position (fixed). */
  top: number;
};

const CARD_LEFT = ms(10);
const CARD_WIDTH = ms(335);
const CARD_HEIGHT = vs(70);

export function SubBrandingCard({ top }: Props) {
  return (
    <View
      style={[styles.wrap, { left: CARD_LEFT, top, width: CARD_WIDTH, height: CARD_HEIGHT }]}
      pointerEvents="box-none"
    >
      <Svg width={CARD_WIDTH} height={CARD_HEIGHT} viewBox="0 0 352 68" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient
            id="subBrandingStroke"
            x1="215.787"
            y1="65.7107"
            x2="340.407"
            y2="110.527"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#14DEF3" />
            <Stop offset="1" stopColor="#262626" stopOpacity={0.42} />
          </LinearGradient>
        </Defs>
        <Path
          d={SUB_BRANDING_PATH}
          fill="#1A1A1A"
          stroke="url(#subBrandingStroke)"
          strokeWidth={1.5}
        />
      </Svg>

      <View style={styles.content} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: ms(0),
    paddingVertical: vs(0),
  },
});
