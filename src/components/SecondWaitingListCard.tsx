import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ms, vs } from '../utils/responsive';

export type SecondWaitingListCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 325;
const DEFAULT_VIEWBOX_HEIGHT = 32;

const RAW_SVG = `<svg width="325" height="32" viewBox="0 0 325 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 4C0 1.79086 1.79086 0 4 0H314.797C316.297 0 317.661 0.842415 318.211 2.23804C319.149 4.61625 320.609 8.88985 321.875 15.0588C322.696 19.0597 323.803 23.5689 324.663 26.9288C325.318 29.4863 323.395 32 320.755 32H3.99999C1.79085 32 0 30.2091 0 28V4Z" fill="#1A1A1A"/>
</svg>`;

export function SecondWaitingListCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: SecondWaitingListCardProps) {
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
