import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ms, vs } from '../utils/responsive';

export type ThirdAppointmentCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 299;
const DEFAULT_VIEWBOX_HEIGHT = 69;

const GRADIENT_ID = 'paint0_linear_29_99';

const RAW_SVG = `<svg width="299" height="69" viewBox="0 0 299 69" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 0.75H294.47C296.397 0.75 297.907 2.40931 297.727 4.33008C297.037 11.6627 295.75 26.4651 295.75 34.9121V64.916C295.75 66.7099 294.296 68.1621 292.5 68.1621H4C2.20521 68.1621 0.750219 66.7068 0.75 64.9121V4C0.750004 2.20508 2.20508 0.75 4 0.75Z" fill="#1A1A1A" stroke="url(#${GRADIENT_ID})" stroke-width="1.5"/>
<defs>
<linearGradient id="${GRADIENT_ID}" x1="149.446" y1="8.39013e-07" x2="149" y2="69" gradientUnits="userSpaceOnUse">
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

export function ThirdAppointmentCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: ThirdAppointmentCardProps) {
  const { primaryColor } = useTheme();
  const rawId = React.useId?.() ?? 'third-appointment-card';
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
