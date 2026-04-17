import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { buildCardPath, getRightEdgeXs } from './cardPathUtils';

type Props = {
  /** Screen X (left), or local X when screenLeft is set. */
  x: number;
  /** Screen Y (top), or local Y when screenTop is set. */
  top: number;
  width: number;
  height: number;
  /** Unique id for gradient (avoid duplicate SVG ids). */
  gradientId: string;
  /** When inside a wrapper: screen X for rail path; card position uses x,y as local. */
  screenLeft?: number;
  /** When inside a wrapper: screen Y for rail path; card position uses x,y as local. */
  screenTop?: number;
  children?: React.ReactNode;
};

/**
 * Fixed-position card with same shape as MorphAppointmentCard (rail-aligned right edge).
 * No scroll; uses screen top for rail alignment.
 */
export function MorphCardStatic({
  x,
  top,
  width,
  height,
  gradientId,
  screenLeft,
  screenTop,
  children,
}: Props) {
  const { primaryColor } = useTheme();

  const cardLeft = screenLeft ?? x;
  const cardTop = screenTop ?? top;
  const posLeft = screenLeft != null ? 0 : x;
  const posTop = screenTop != null ? 0 : top;

  const topScreenY = cardTop + 6;
  const midScreenY = cardTop + height * 0.55;
  const bottomScreenY = cardTop + height - 6;

  const { topRightX, midRightX, bottomRightX } = getRightEdgeXs({
    cardLeft,
    width,
    topScreenY,
    midScreenY,
    bottomScreenY,
  });

  const d = buildCardPath({
    width,
    height,
    radius: 8,
    topRightX,
    midRightX,
    bottomRightX,
  });

  return (
    <View
      style={[
        styles.wrap,
        {
          left: posLeft,
          top: posTop,
          width,
          height,
        },
      ]}
      pointerEvents="box-none"
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient
            id={gradientId}
            x1={width * (159.793 / 394)}
            y1={height * (15.3859 / 78)}
            x2={width * (334.793 / 394)}
            y2={height * (25.3859 / 78)}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={primaryColor} />
            <Stop offset="1" stopColor="#1A1A1A" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path
          d={d}
          fill="#1A1A1A"
          stroke={`url(#${gradientId})`}
          strokeWidth={1.5}
        />
      </Svg>
      {children != null ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
});
