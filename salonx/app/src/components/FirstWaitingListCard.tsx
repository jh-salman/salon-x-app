import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ms, vs } from '../utils/responsive';

export type FirstWaitingListCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 316;
const DEFAULT_VIEWBOX_HEIGHT = 32;

const RAW_SVG = `<svg width="316" height="32" viewBox="0 0 316 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 4C0 1.79086 1.79086 0 4 0H306.007C307.524 0 308.899 0.860216 309.441 2.27661C310.353 4.66232 311.765 8.92306 312.989 15.0588C313.79 19.0707 314.869 23.5936 315.707 26.9564C316.342 29.5068 314.421 32 311.793 32H4C1.79086 32 0 30.2091 0 28V4Z" fill="#1A1A1A"/>
</svg>`;

export function FirstWaitingListCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: FirstWaitingListCardProps) {
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
