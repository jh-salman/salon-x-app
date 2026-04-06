import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ms, vs } from '../utils/responsive';
import Svg, { Path, G, Defs, LinearGradient, Stop, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

const CURVED_LINE_PATH = 'M33.5 24C33.5 144.5 111.5 82.2516 111.5 225';

const defaultColors: [string, string, string] = ['#FF18EC', '#5333F1', '#00E7F9'];

export interface HalfCurvedLineProps {
  /** Gradient stop colors (2 or 3). Default: pink → purple → cyan */
  colors?: [string, string] | [string, string, string];
  /** Stroke width. Default 3 */
  strokeWidth?: number;
  /** Unique id for SVG gradient/filter (use when multiple on screen). Default 'halfCurvedLine' */
  id?: string;
}

export function HalfCurvedLine({
  colors = defaultColors,
  strokeWidth = 3,
  id = 'halfCurvedLine',
}: HalfCurvedLineProps) {
  const [c0, c1, c2] = colors.length === 2 ? [colors[0], colors[1], colors[1]] : colors;
  const gradientId = `gradient_${id}`;
  const filterId = `filter_${id}`;

  return (
    <View style={styles.wrapper}>
      <Svg width={ms(145)} height={vs(265)} viewBox="0 0 145 265" fill="none">
        <Defs>
          <Filter id={filterId} x="0" y="0" width="145" height="265" filterUnits="userSpaceOnUse">
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <FeOffset dy="8" />
            <FeGaussianBlur stdDeviation="16" />
            <FeComposite in2="hardAlpha" operator="out" />
            <FeColorMatrix type="matrix" values="0 0 0 0 0.0905796 0 0 0 0 0.158242 0 0 0 0 0.298077 0 0 0 1 0" />
            <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_759" />
            <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_759" result="shape" />
          </Filter>
          <LinearGradient id={gradientId} x1="-58.1297" y1="27.4974" x2="-58.1297" y2="876.002" gradientUnits="userSpaceOnUse">
            <Stop offset="0.0721154" stopColor={c0} />
            <Stop offset="0.504808" stopColor={c1} />
            <Stop offset="0.966346" stopColor={c2} />
          </LinearGradient>
        </Defs>
        <G filter={`url(#${filterId})`}>
          <Path d={CURVED_LINE_PATH} stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: ms(-32),
    top: vs(-40),
    width: ms(145),
    height: vs(265),
  },
});
