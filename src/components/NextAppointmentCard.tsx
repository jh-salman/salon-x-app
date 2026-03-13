import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ms, vs } from '../utils/responsive';

export type NextAppointmentCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 304;
const DEFAULT_VIEWBOX_HEIGHT = 69;

const GRADIENT_ID = 'paint0_linear_29_91';

const RAW_SVG = `<svg width="304" height="69" viewBox="0 0 304 69" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 0.75H293.174C294.914 0.75 296.355 2.11546 296.458 3.8584C296.755 8.90932 297.421 19.0241 298.753 34.5645C299.767 46.3995 301.693 57.9597 302.839 64.2305C303.211 66.2703 301.647 68.1618 299.588 68.1621H4C2.20521 68.1621 0.750219 66.7068 0.75 64.9121V4C0.750004 2.20508 2.20508 0.75 4 0.75Z" fill="#1A1A1A" stroke="url(#${GRADIENT_ID})" stroke-width="1.5"/>
<defs>
<linearGradient id="${GRADIENT_ID}" x1="152.472" y1="5.50858e-08" x2="152.028" y2="68.9117" gradientUnits="userSpaceOnUse">
<stop stop-color="#14DEF3"/>
<stop offset="1" stop-color="#666666" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>`;

function withIdPrefix(svg: string, prefix: string) {
  const nextId = `${prefix}-${GRADIENT_ID}`;
  return svg
    .replaceAll(`id="${GRADIENT_ID}"`, `id="${nextId}"`)
    .replaceAll(`url(#${GRADIENT_ID})`, `url(#${nextId})`);
}

export function NextAppointmentCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: NextAppointmentCardProps) {
  const { primaryColor } = useTheme();
  const rawId = React.useId?.() ?? 'next-appointment-card';
  const idPrefix = React.useMemo(
    () => rawId.replace(/[^a-zA-Z0-9_-]/g, ''),
    [rawId]
  );

  const xml = React.useMemo(() => {
    const themed = RAW_SVG.replaceAll('#14DEF3', primaryColor);
    return withIdPrefix(themed, idPrefix);
  }, [idPrefix, primaryColor]);

  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SvgXml
          xml={xml}
          width="100%"
          height="100%"
          viewBox={`0 0 ${DEFAULT_VIEWBOX_WIDTH} ${DEFAULT_VIEWBOX_HEIGHT}`}
        />
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
