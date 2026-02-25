import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Path, G } from 'react-native-svg';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  getDay,
  isToday,
} from 'date-fns';
import { AllDaySection } from './AllDaySection';
import { colors as themeColors } from '../theme';

const svgPaths = {
  p104c6e00: 'M4.74241 4.97939L8.48012 0.307264L4.11946 0.307263L0.381754 4.97939L4.11946 9.80726L8.48011 9.80726L4.74241 4.97939Z',
  p339b00: 'M14.8228 0.299999L12.0195 0.299999L8.12607 4.97213L12.0195 9.8L14.9785 9.8L11.0851 4.97213L14.8228 0.299999Z',
  p3dd3e830: 'M4.04317e-05 0.749701C4.04317e-05 0.335652 0.335693 0 0.749741 0V17.5449C0.335693 17.5449 4.04317e-05 17.2092 4.04317e-05 16.7952V0.749701Z',
  p2fdc4880: 'M0.750962 0C1.16501 0 1.50066 0.335652 1.50066 0.749701V16.7952C1.50066 17.2092 1.16501 17.5449 0.750962 17.5449V0Z',
  p9e8d480: 'M0 0.749701C0 0.335652 0.335652 0 0.7497 0V17.5449C0.335652 17.5449 0 17.2092 0 16.7952V0.749701Z',
  p407f700: 'M0.749964 0C1.16401 0 1.49966 0.335652 1.49966 0.749701V16.7952C1.49966 17.2092 1.16401 17.5449 0.749964 17.5449V0Z',
};

export type ViewMode = 'day' | 'week' | 'month';

interface CalendarHeaderDynamicProps {
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

// Back arrow icon (left-pointing) – same as calendar nav, export for reuse e.g. Client Details
export const CalendarBackArrow = () => (
  <View style={{ width: moderateScale(14.6), height: verticalScale(9.5) }}>
    <Svg width="15.6059" height="10.1073" viewBox="0 0 15.6059 10.1073" fill="none">
      <G>
        <Path d={svgPaths.p104c6e00} stroke={themeColors.highlight.neonPink} strokeWidth="0.6" fill="none" />
        <Path d={svgPaths.p339b00} stroke={themeColors.highlight.neonPink} strokeWidth="0.6" fill="none" />
      </G>
    </Svg>
  </View>
);

// Navigation Arrow Component
const NavigationArrow = ({ direction, onPress }: { direction: 'left' | 'right'; onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={moderateScale(10)}>
    <View style={{ width: moderateScale(14.6), height: verticalScale(9.5), transform: direction === 'right' ? [{ rotate: '180deg' }] : [] }}>
      <Svg width="15.6059" height="10.1073" viewBox="0 0 15.6059 10.1073" fill="none">
        <G>
          <Path d={svgPaths.p104c6e00} stroke={themeColors.highlight.neonPink} strokeWidth="0.6" fill="none" />
          <Path d={svgPaths.p339b00} stroke={themeColors.highlight.neonPink} strokeWidth="0.6" fill="none" />
        </G>
      </Svg>
    </View>
  </Pressable>
);

// Divider Component
const Divider = ({ left }: { left: number }) => (
  <View style={[styles.divider, { left, top: verticalScale(7.5) }]}>
    <Svg width="1.50066" height="17.5449" viewBox="0 0 1.50066 17.5449" fill="none">
      <G>
        <Path d={svgPaths.p3dd3e830} fill="white" fillOpacity="0.08" />
        <Path d={svgPaths.p2fdc4880} fill="black" fillOpacity="0.16" />
      </G>
    </Svg>
  </View>
);

// Tab Selector Component - Updated to match original
const TabSelector = ({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) => {
  const tabPositions = {
    day: moderateScale(3.75),
    week: moderateScale(65),
    month: moderateScale(130),
  };

  const translateX = useRef(new Animated.Value(tabPositions[viewMode])).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: tabPositions[viewMode],
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [viewMode]);

  const handleTabPress = (mode: ViewMode) => {
    onViewModeChange(mode);
  };

  return (
    <View style={styles.tabSelectorContainer}>
      {/* Background Container */}
      <View style={styles.tabBackground}>
    
        <View style={styles.tabBorder} />
        
      </View>

      {/* Dividers */}
      <Divider left={moderateScale(62)} />
      <Divider left={moderateScale(125)} />

      {/* Animated Active Tab Background */}
      <Animated.View style={[styles.activeTab, { left: 0, transform: [{ translateX }] }]}>
        <View style={styles.activeTabBorder} />
      </Animated.View>

      {/* Tab Labels */}
      <Pressable onPress={() => handleTabPress('day')} style={[styles.tabLabel, { left: moderateScale(-5), width: moderateScale(77.22) }]}>
        <Text style={[styles.tabText, viewMode === 'day' && styles.activeTabText]}>Day</Text>
      </Pressable>

      <Pressable onPress={() => handleTabPress('week')} style={[styles.tabLabel, { left: moderateScale(67), width: moderateScale(55) }]}>
        <Text style={[styles.tabText, viewMode === 'week' && styles.activeTabText]}>Week</Text>
      </Pressable>

      <Pressable onPress={() => handleTabPress('month')} style={[styles.tabLabel, { left: moderateScale(130), width: moderateScale(55) }]}>
        <Text style={[styles.tabText, viewMode === 'month' && styles.activeTabText]}>Month</Text>
      </Pressable>
    </View>
  );
};

// Week Days Header
const WeekDaysHeader = () => {
  const days = [
    { label: 'M', color: '#FFFFFF' },
    { label: 'T', color: 'white' },
    { label: 'W', color: 'white' },
    { label: 'T', color: 'white' },
    { label: 'F', color: 'white' },
    { label: 'S', color: 'white' },
    { label: 'S', color: '#FFFFFF' },
  ];

  return (
    <View style={styles.weekDaysContainer}>
      {days.map((day, index) => (
        <View key={index} style={styles.weekDay}>
          <Text style={[styles.weekDayText, { color: day.color }]}>{day.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Calendar Day Component
const CalendarDay = ({
  date,
  selectedDate,
  onPress,
}: {
  date: Date;
  selectedDate: Date;
  onPress: (date: Date) => void;
}) => {
  const isCurrentDay = isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);
  const dayOfWeek = getDay(date);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <Pressable onPress={() => onPress(date)} style={styles.calendarDayWrapper}>
      {isCurrentDay ? (
        <View style={styles.todayWrapper}>
          <View style={styles.todayCircle}>
            <Text style={styles.todayText}>{format(date, 'd')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.normalDayWrapper}>
          <Text style={[styles.dayText, isWeekend && styles.weekendText, isTodayDate && styles.highlightText]}>
            {format(date, 'd')}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

// Calendar Row Component
const CalendarRow = ({
  currentDate,
  selectedDate,
  onDateSelect,
}: {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) => {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  return (
    <View style={styles.calendarRow}>
      {weekDays.map((date, index) => (
        <CalendarDay key={index} date={date} selectedDate={selectedDate} onPress={onDateSelect} />
      ))}
    </View>
  );
};

// Main Component
export default function CalendarHeaderDynamic({
  initialDate = new Date(),
  onDateChange,
  onViewModeChange,
}: CalendarHeaderDynamicProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  useEffect(() => {
    setSelectedDate(initialDate);
    setCurrentDate(initialDate);
  }, [initialDate.getTime()]);

  const handleNext = () => {
    let newDate: Date;
    switch (viewMode) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      default:
        newDate = addDays(currentDate, 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handlePrevious = () => {
    let newDate: Date;
    switch (viewMode) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      default:
        newDate = subDays(currentDate, 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    onDateChange?.(date);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 50) {
            if (g.dx > 0) handlePrevious();
            else handleNext();
          }
        },
      }),
    [currentDate, viewMode]
  );

  return (
    <View style={styles.container}>
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <NavigationArrow direction="left" onPress={handlePrevious} />
        <TabSelector viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        <NavigationArrow direction="right" onPress={handleNext} />
      </View>

      {/* Week Days Header */}
      <WeekDaysHeader />

      {/* Calendar Days Row with Swipe */}
      <View {...panResponder.panHandlers}>
        <CalendarRow currentDate={currentDate} selectedDate={selectedDate} onDateSelect={handleDateSelect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  
  container: {
    backgroundColor: 'black',
    width: '100%',
    height: verticalScale(118),
    borderBottomWidth: 1,
    borderBottomColor:"#232627"
  
    // maxWidth: moderateScale(30),
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    height: verticalScale(49),
    width: moderateScale(223),
    paddingHorizontal: moderateScale(15),
  },
  tabSelectorContainer: {
    position: 'relative',
    width: '100%',
    height: verticalScale(30),
  },
  tabBackground: {
    position: 'absolute',
    width: moderateScale(188.7),
    height: verticalScale(30),
    borderRadius: moderateScale(12.5),
    backgroundColor:  '#232627',
  },
  
  tabBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(12.5),
    borderWidth: moderateScale(0.9),
    borderColor: 'rgba(200, 200, 200, 0.96)',
  },
  divider: {
    position: 'absolute',
    width: moderateScale(1.5),
    height: verticalScale(15),
  },
  activeTab: {
    position: 'absolute',
    top: verticalScale(2.5),
    width: moderateScale(55),
    height: verticalScale(25),
    borderRadius: moderateScale(8.5),
    paddingHorizontal: moderateScale(14.4),
    paddingVertical: verticalScale(4),
    backgroundColor: '#151719',
  },
  activeTabBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8.5),
    borderWidth: moderateScale(0.9),
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(7.2) },
    shadowOpacity: 0.24,
    shadowRadius: moderateScale(28.8),
    elevation: 8,
  },
  tabLabel: {
    position: 'absolute',
    top: verticalScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'Lato-Bold',
    fontSize: RFValue(10.8),
    lineHeight: RFValue(10.8),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activeTabText: {
    fontFamily: 'Lato-ExtraBold',
    color: themeColors.highlight.neonPink,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    backgroundColor: 'black',
    width: moderateScale(325),
    height: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDay: {
    width: moderateScale(46),
    height: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    fontFamily: 'Lato-SemiBold',
    fontSize: RFValue(10),
    lineHeight: RFValue(14),
    letterSpacing: -0.408,
    textAlign: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    width: moderateScale(325),
    backgroundColor: 'black',
  },
  calendarDayWrapper: {
    width: moderateScale(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalDayWrapper: {
    paddingVertical: verticalScale(6),
    height: verticalScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayWrapper: {
    paddingVertical: verticalScale(0),
    // backgroundColor:"blue",
    width: moderateScale(32),
    height:moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: themeColors.highlight.neonPink,
    alignItems: 'center',
    justifyContent: 'center',
    padding:  moderateScale(2),
  },
  todayText: {
    fontFamily: 'Lato-Bold',
    fontSize: RFValue(18),
    lineHeight: RFValue(20),
    letterSpacing: -0.408,
    color: 'white',
    textAlign: 'center',
  },
  dayText: {
    fontFamily: 'Lato-Regular',
    fontSize: RFValue(18),
    lineHeight: RFValue(20),
    letterSpacing: -0.408,
    color: 'white',
    textAlign: 'center',
  },
  weekendText: {
    color: '#FFFFFF',
  },
  highlightText: {
    fontFamily: 'Lato-Bold',
  },
});
