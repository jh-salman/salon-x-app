import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, vs } from '../utils/responsive';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

/** Same as RightDecoration background path; we mirror it for the left edge. */
const RIGHT_BACKGROUND_PATH =
  'M75.1195 178.657C66.654 67.6131 0 112.848 0 0L47.8463 4.16055C59.9245 5.21082 69.3227 15.1041 69.7521 27.2202L75.1195 178.657C75.6935 186.187 76 194.435 76 203.5L75.1195 178.657Z';

const defaultLineColors = ['#FF18EC', '#5333F1', '#00E7F9'] as const;

export interface LeftDecorationProps {
  /** Optional gradient colors for the curved line [start, mid?, end]. Default: pink → purple → cyan */
  lineColors?: [string, string] | [string, string, string];
}

export function LeftDecoration({ lineColors = defaultLineColors }: LeftDecorationProps) {
  const insets = useSafeAreaInsets();
  const [c0, c1, c2] = lineColors.length === 2 ? [lineColors[0], lineColors[1], lineColors[1]] : lineColors;
  const gradientId = 'leftDecorationGradient';

  return (
    <View style={styles.leftDecorationContainer} pointerEvents="box-none">
      <View style={[styles.backgroundShapeWrapper, { top: vs(-30) - insets.top }]} pointerEvents="none">
        <Svg width={ms(76)} height={vs(203.5)} viewBox="0 0 76 203.5">
          <G transform="translate(76,0) scale(-1,1)">
            <Path d={RIGHT_BACKGROUND_PATH} fill="#01010C" />
          </G>
        </Svg>
      </View>
      <View style={[styles.curvedLineWrapper, { top: vs(-40) - insets.top }]} pointerEvents="none">
        <Svg width={ms(145)} height={vs(265)} viewBox="0 0 145 265">
          <Defs>
            <LinearGradient id={gradientId} x1="-58.13" y1="27.5" x2="-58.13" y2="876" gradientUnits="userSpaceOnUse">
              <Stop offset="0.07" stopColor={c0} />
              <Stop offset="0.5" stopColor={c1} />
              <Stop offset="0.97" stopColor={c2} />
            </LinearGradient>
          </Defs>
          <G transform="translate(145,0) scale(-1,1)">
            <Path
              d="M33.5 24C33.5 144.5 111.5 82.2516 111.5 225"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              fill="none"
            />
          </G>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  leftDecorationContainer: {
    position: 'absolute',
    top: 0,
    left: ms(0),
    width: ms(78),
    height: vs(201),
    zIndex: 10,
  },
  backgroundShapeWrapper: {
    position: 'absolute',
    left: 0,
    width: ms(76),
    height: vs(203.5),
  },
  curvedLineWrapper: {
    position: 'absolute',
    right: 0,
    width: ms(145),
    height: vs(265),
    zIndex: 1,
  },
});
