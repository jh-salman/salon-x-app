import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ms, vs } from '../utils/responsive';

export type ThirdWaitingListCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 339;
const DEFAULT_VIEWBOX_HEIGHT = 50;

const RAW_SVG = `<svg width="339" height="50" viewBox="0 0 339 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 4C0 1.79086 1.79086 0 4 0H321.616C323.385 0 324.94 1.15843 325.416 2.86277C326.373 6.28711 328.143 12.8173 330.583 22.6351C333.839 35.7355 336.285 42.7954 338.059 46.5278C339.31 49.158 338.688 49.9869 335.776 49.9754L3.98419 48.6644C1.78123 48.6557 0 46.8674 0 44.6644V4Z" fill="#1A1A1A"/>
</svg>`;

export function ThirdWaitingListCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: ThirdWaitingListCardProps) {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SvgXml
          xml={RAW_SVG}
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
