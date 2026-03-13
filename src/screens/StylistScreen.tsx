import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StylistLayout } from '../components/StylistLayout';
import { ms, vs } from '../utils/responsive';

export function StylistScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={[styles.content, { width: screenWidth, minHeight: screenHeight }]}>
          <View style={styles.svgContainer}>
            <StylistLayout />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    backgroundColor: 'black',
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
    top: vs(-20),
    left: ms(0),
    right: ms(-8),
    bottom: vs(-28),
    zIndex: 0,
  },
});
