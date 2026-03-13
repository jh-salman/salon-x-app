import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ms, vs } from '../utils/responsive';

const GRADIENT_ID = 'subbrandingBorderGrad';
const VIEWBOX_WIDTH = 352;
const VIEWBOX_HEIGHT = 68;

/** Polygon from HTML clip-path (1.14% 1.1%, 98.82% 1.1%, …) in 352×68 coords */
const PATH_D =
  'M4 0.75L347.86 0.75L351.05 4L335.84 64.82L332.71 67.25L4 67.25L0.74 64L0.74 4Z';

export type SubbrandingAreaProps = {
  /** Width of the shape container (default: responsive 352) */
  width?: number;
  /** Height of the shape container (default: responsive 68) */
  height?: number;
  /** Path fill color (default: #1A1A1A) */
  fill?: string;
  /** How SVG scales inside the box */
  preserveAspectRatio?: 'none' | 'xMidYMid meet' | 'xMidYMid slice';
  /** Container style; width/height from props override style dimensions */
  style?: ViewStyle;
  /** Optional content to render inside the shaped area */
  children?: React.ReactNode;
};

export function SubbrandingArea({
  width = ms(352),
  height = vs(68),
  fill = '#1A1A1A',
  preserveAspectRatio = 'none',
  style,
  children,
}: SubbrandingAreaProps) {
  const { primaryColor } = useTheme();
  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          fill="none"
          preserveAspectRatio={preserveAspectRatio}
        >
          <Defs>
            <LinearGradient
              id={GRADIENT_ID}
              x1="0"
              y1="0"
              x2="420"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor={primaryColor} offset="0" />
              <Stop stopColor="#262626" stopOpacity={0.42} offset="1" />
            </LinearGradient>
          </Defs>
          <Path
            d={PATH_D}
            fill={fill}
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth={1.5}
          />
        </Svg>
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
