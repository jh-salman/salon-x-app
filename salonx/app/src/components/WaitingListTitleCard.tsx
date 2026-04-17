import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ms, vs } from '../utils/responsive';

export type WaitingListTitleCardProps = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

const DEFAULT_VIEWBOX_WIDTH = 309;
const DEFAULT_VIEWBOX_HEIGHT = 24;

const RAW_SVG = `<svg width="309" height="24" viewBox="0 0 309 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 4C0 1.79086 1.79086 0 4 0H298.488C300.697 0 302.546 1.79602 302.947 3.96861C303.346 6.13782 304.094 9.0747 305.493 12.4706C306.366 14.5912 307.223 16.7554 307.951 18.6275C308.962 21.2248 307.036 24 304.25 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="#1A1A1A"/>
</svg>`;

export function WaitingListTitleCard({
  width = ms(DEFAULT_VIEWBOX_WIDTH),
  height = vs(DEFAULT_VIEWBOX_HEIGHT),
  style,
  children,
}: WaitingListTitleCardProps) {
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
