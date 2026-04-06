import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ms, vs } from '../utils/responsive';

const GRADIENT_ID = 'activeAppointmentCardBorderGrad';
const VIEWBOX_WIDTH = 335;
const VIEWBOX_HEIGHT = 68;

const PATH_D =
  'M4 0.999756H331.858C332.615 0.999768 332.963 1.2175 333.099 1.38354C333.216 1.52716 333.353 1.85112 333.147 2.53589C332.019 6.29497 329.523 14.7791 324.039 33.7224C321.006 44.1992 318.43 53.4604 316.728 59.6638L315.332 64.78C314.977 66.0923 313.788 66.9998 312.427 66.9998H4C2.34315 66.9998 1 65.6566 1 63.9998V3.99976C1.00019 2.34306 2.34326 0.999756 4 0.999756Z';

export type ActiveAppointmentCardProps = {
  width?: number;
  height?: number;
  fill?: string;
  preserveAspectRatio?: 'none' | 'xMidYMid meet' | 'xMidYMid slice';
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function ActiveAppointmentCard({
  width = ms(335),
  height = vs(68),
  fill = '#1A1A1A',
  preserveAspectRatio = 'none',
  style,
  children,
}: ActiveAppointmentCardProps) {
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
              x1="168"
              y1="-0.0842233"
              x2="168"
              y2="80.9158"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor={primaryColor} offset="0" />
              <Stop stopColor="#874284" stopOpacity={0} offset="1" />
            </LinearGradient>
          </Defs>
          <Path
            d={PATH_D}
            fill={fill}
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth={2}
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
