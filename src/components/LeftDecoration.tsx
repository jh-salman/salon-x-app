import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, vs } from '../utils/responsive';
import Svg, { Path, G } from 'react-native-svg';

/** Same as RightDecoration background path; we mirror it for the left edge. */
const RIGHT_BACKGROUND_PATH =
  'M75.1195 178.657C66.654 67.6131 0 112.848 0 0L47.8463 4.16055C59.9245 5.21082 69.3227 15.1041 69.7521 27.2202L75.1195 178.657C75.6935 186.187 76 194.435 76 203.5L75.1195 178.657Z';

export interface LeftDecorationProps {
  /** Optional gradient colors for the curved line (no longer rendered; kept for API compatibility). */
  lineColors?: [string, string] | [string, string, string];
}

export function LeftDecoration(_props: LeftDecorationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.leftDecorationContainer} pointerEvents="box-none">
      <View style={[styles.backgroundShapeWrapper, { top: vs(-30) - insets.top }]} pointerEvents="none">
        <Svg width={ms(76)} height={vs(203.5)} viewBox="0 0 76 203.5">
          <G transform="translate(76,0) scale(-1,1)">
            <Path d={RIGHT_BACKGROUND_PATH} fill="#01010C" />
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
});
