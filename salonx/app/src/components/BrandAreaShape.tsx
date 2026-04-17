import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { ms, vs } from '../utils/responsive';

const VIEWBOX_WIDTH = 380;
const VIEWBOX_HEIGHT = 135;

const PATH_D =
  'M0 6.97295V129.5C0 132.261 2.23857 134.5 4.99999 134.5H379C379 134.5 384.786 104.17 362.5 71C352.266 55.768 342.688 51.0002 326.5 32.5C310.312 13.9997 306 0 306 0L4.96723 1.97306C2.21865 1.99107 0 4.22432 0 6.97295Z';

export type BrandAreaShapeProps = {
  /** Width of the shape container (default: responsive 380) */
  width?: number;
  /** Height of the shape container (default: responsive 135) */
  height?: number;
  /** Path fill color (default: theme surface.header) */
  fill?: string;
  /** How SVG scales inside the box: "none" = stretch, "xMidYMid meet" = fit keeping ratio */
  preserveAspectRatio?: 'none' | 'xMidYMid meet' | 'xMidYMid slice';
  /** Container style; width/height from props override style dimensions */
  style?: ViewStyle;
};

export function BrandAreaShape({
  width = ms(380),
  height = vs(135),
  fill = colors.surface.header,
  preserveAspectRatio = 'none',
  style,
}: BrandAreaShapeProps) {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio={preserveAspectRatio}
      >
        <Path d={PATH_D} fill={fill} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
