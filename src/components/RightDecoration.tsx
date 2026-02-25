import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { HalfCurvedLine } from './HalfCurvedLine';

const svgPaths = {
  backgroundShape: 'M75.1195 178.657C66.654 67.6131 0 112.848 0 0L47.8463 4.16055C59.9245 5.21082 69.3227 15.1041 69.7521 27.2202L75.1195 178.657C75.6935 186.187 76 194.435 76 203.5L75.1195 178.657Z',
};

const RightDateDisplay = () => {
  const currentDate = new Date();
  return (
    <Pressable
      style={styles.rightDateContainer}
      onPress={() => router.push('/calendar')}
      accessibilityLabel="Go to calendar"
    >
      <Text style={styles.rightDateDay}>{format(currentDate, 'EEE')}</Text>
      <Text style={styles.rightDateNumber}>{format(currentDate, 'd')}</Text>
    </Pressable>
  );
};

const BackgroundShape = () => (
  <View style={styles.backgroundShapeWrapper}>
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

export const RightDecoration = ({ lineColors }: RightDecorationProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.rightDecorationContainer} pointerEvents="box-none">
      <BackgroundShape />
      <View style={[styles.halfCurvedLineAboveSafeArea, { top: -insets.top }]}>
        <HalfCurvedLine id="rightDecorationLine" colors={lineColors} />
      </View>
      <RightDateDisplay />
    </View>
  );
};

const styles = StyleSheet.create({
  rightDecorationContainer: {
    position: 'absolute',
    top: 0,
    right: moderateScale(0),
    width: moderateScale(78),
    height: verticalScale(201),
    zIndex: 10,
  },
  backgroundShapeWrapper: {
    position: 'absolute',
    right: moderateScale(0),
    top: verticalScale(-30),
    width: moderateScale(76),
    height: verticalScale(203.5),
  },
  halfCurvedLineAboveSafeArea: {
    position: 'absolute',
    left: 0,
    width: moderateScale(145),
    height: verticalScale(265),
    zIndex: 1,
  },
  rightDateContainer: {
    position: 'absolute',
    top: verticalScale(-10),
    right: moderateScale(2),
    alignItems: 'flex-end',
    width: moderateScale(43),
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
    marginTop: verticalScale(5),
    fontWeight: 'bold',
  },
});
