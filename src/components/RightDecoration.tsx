import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, vs } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns';
import { HalfCurvedLine } from './HalfCurvedLine';

const svgPaths = {
  backgroundShape: 'M75.1195 178.657C66.654 67.6131 0 112.848 0 0L47.8463 4.16055C59.9245 5.21082 69.3227 15.1041 69.7521 27.2202L75.1195 178.657C75.6935 186.187 76 194.435 76 203.5L75.1195 178.657Z',
};

const RightDateDisplay = ({ date }: { date: Date }) => (
  <View style={styles.rightDateContainer} pointerEvents="none">
    <Text style={styles.rightDateDay}>{format(date, 'EEE')}</Text>
    <Text style={styles.rightDateNumber}>{format(date, 'd')}</Text>
  </View>
);

const BackgroundShape = () => (
  <View style={styles.backgroundShapeWrapper} pointerEvents="none">
    <Svg width="76" height="203.5" viewBox="0 0 76 203.5" fill="none">
      <Path d={svgPaths.backgroundShape} fill="#01010C" />
    </Svg>
  </View>
);

export interface RightDecorationProps {
  /** Optional: no longer used for display; date is always current. Kept for backward compatibility. */
  date?: Date;
  /** Optional gradient colors for the half curved line [start, mid?, end]. Default: pink → purple → cyan */
  lineColors?: [string, string] | [string, string, string];
}

export const RightDecoration = ({ date = new Date(), lineColors }: RightDecorationProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.rightDecorationContainer} pointerEvents="box-none">
      <BackgroundShape />
      <View style={[styles.halfCurvedLineAboveSafeArea, { top: -insets.top }]} pointerEvents="none">
        <HalfCurvedLine id="rightDecorationLine" colors={lineColors} />
      </View>
      <RightDateDisplay date={date} />
    </View>
  );
};

const styles = StyleSheet.create({
  rightDecorationContainer: {
    position: 'absolute',
    top: 0,
    right: ms(0),
    width: ms(78),
    height: vs(201),
    zIndex: 10,
  },
  backgroundShapeWrapper: {
    position: 'absolute',
    right: ms(0),
    top: vs(-30),
    width: ms(76),
    height: vs(203.5),
  },
  halfCurvedLineAboveSafeArea: {
    position: 'absolute',
    left: 0,
    width: ms(145),
    height: vs(265),
    zIndex: 1,
  },
  rightDateContainer: {
    position: 'absolute',
    top: vs(0),
    right: ms(15),
    alignItems: 'flex-end',
    width: ms(43),
    // backgroundColor: 'red',

  },
  rightDateDay: {
    fontFamily: 'Lao Sans Pro',
    fontSize: RFValue(18),
    color: 'white',
    textAlign: 'right',
  },
  rightDateNumber: {
    fontFamily: 'Lalezar',
    fontSize: RFValue(20),
    color: 'white',
    textAlign: 'right',
    marginTop: vs(5),
    fontWeight: 'bold',
  },
});
