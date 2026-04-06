import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { ms, vs } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Path, G } from 'react-native-svg';
import { format, addDays, subDays, startOfWeek, addMonths, subMonths, isSameDay, getDay, isToday } from 'date-fns';
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
const FIVE_DAY_WINDOW = 5;
const TIME_AXIS_WIDTH = ms(40);
const WEEK_HORIZONTAL_PADDING = ms(16);

interface CalendarHeaderDynamicProps {
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  /** When provided, header tab follows this (e.g. Day active when switching from week view) */
  viewMode?: ViewMode;
}

// Back arrow icon (left-pointing) – same as calendar nav, export for reuse e.g. Client Details
export const CalendarBackArrow = () => (
  <View style={{ width: ms(14.6), height: vs(9.5) }}>
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
  <Pressable onPress={onPress} hitSlop={ms(10)}>
    <View style={{ width: ms(14.6), height: vs(9.5), transform: direction === 'right' ? [{ rotate: '180deg' }] : [] }}>
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
  <View style={[styles.divider, { left, top: vs(7.5) }]}>
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
    day: ms(3.75),
    week: ms(65),
    month: ms(130),
  };

  const translateX = useRef(new Animated.Value(tabPositions[viewMode])).current;

  useEffect(() => {
    translateX.setValue(tabPositions[viewMode]);
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
      <Divider left={ms(62)} />
      <Divider left={ms(125)} />

      {/* Animated Active Tab Background */}
      <Animated.View style={[styles.activeTab, { left: 0, transform: [{ translateX }] }]}>
        <View style={styles.activeTabBorder} />
      </Animated.View>

      {/* Tab Labels */}
      <Pressable onPress={() => handleTabPress('day')} style={[styles.tabLabel, { left: ms(-5), width: ms(77.22) }]}>
        <Text style={[styles.tabText, viewMode === 'day' && styles.activeTabText]}>Day</Text>
      </Pressable>

      <Pressable onPress={() => handleTabPress('week')} style={[styles.tabLabel, { left: ms(67), width: ms(55) }]}>
        <Text style={[styles.tabText, viewMode === 'week' && styles.activeTabText]}>5 Day</Text>
      </Pressable>

      <Pressable onPress={() => handleTabPress('month')} style={[styles.tabLabel, { left: ms(130), width: ms(55) }]}>
        <Text style={[styles.tabText, viewMode === 'month' && styles.activeTabText]}>Month</Text>
      </Pressable>
    </View>
  );
};

const WeekDaysHeader = ({
  dates,
  dayWidth,
  useFiveDayLayout = false,
}: {
  dates: Date[];
  dayWidth?: number;
  useFiveDayLayout?: boolean;
}) => {
  return (
    <View style={[styles.weekDaysContainer, useFiveDayLayout && styles.weekDaysContainerFiveDay]}>
      {dates.map((date, index) => (
        <View key={index} style={[styles.weekDay, dayWidth ? { width: dayWidth } : null]}>
          <Text style={[styles.weekDayText, { color: 'white' }]}>{format(date, 'EEEEE')}</Text>
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
  dayWidth,
}: {
  date: Date;
  selectedDate: Date;
  onPress: (date: Date) => void;
  dayWidth?: number;
}) => {
  const isCurrentDay = isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);
  const dayOfWeek = getDay(date);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <Pressable onPress={() => onPress(date)} style={[styles.calendarDayWrapper, dayWidth ? { width: dayWidth } : null]}>
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
  dates,
  selectedDate,
  onDateSelect,
  dayWidth,
  useFiveDayLayout = false,
}: {
  dates: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dayWidth?: number;
  useFiveDayLayout?: boolean;
}) => {
  return (
    <View style={[styles.calendarRow, useFiveDayLayout && styles.calendarRowFiveDay]}>
      {dates.map((date, index) => (
        <CalendarDay key={index} date={date} selectedDate={selectedDate} onPress={onDateSelect} dayWidth={dayWidth} />
      ))}
    </View>
  );
};

// Main Component
export default function CalendarHeaderDynamic({
  initialDate = new Date(),
  onDateChange,
  onViewModeChange,
  viewMode: viewModeProp,
}: CalendarHeaderDynamicProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('day');
  const viewMode = viewModeProp ?? internalViewMode;

  useEffect(() => {
    setSelectedDate(initialDate);
    setCurrentDate(initialDate);
  }, [initialDate.getTime()]);

  useEffect(() => {
    if (viewModeProp !== undefined) {
      setInternalViewMode(viewModeProp);
    }
  }, [viewModeProp]);

  const visibleDates = useMemo(() => {
    if (viewMode === 'week') {
      return Array.from({ length: FIVE_DAY_WINDOW }, (_, i) => addDays(currentDate, i));
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, viewMode]);

  const fiveDayColumnWidth = useMemo(() => {
    const available = screenWidth - TIME_AXIS_WIDTH - WEEK_HORIZONTAL_PADDING;
    return available / FIVE_DAY_WINDOW;
  }, [screenWidth]);

  const handleNext = () => {
    let newDate: Date;
    switch (viewMode) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addDays(currentDate, FIVE_DAY_WINDOW);
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
        newDate = subDays(currentDate, FIVE_DAY_WINDOW);
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
    if (viewModeProp === undefined) setInternalViewMode(mode);
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
        <TabSelector viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </View>

      {/* Week Days Header */}
      <View
        style={
          viewMode === 'week'
            ? [styles.fiveDayAlignedRow, { paddingLeft: TIME_AXIS_WIDTH, paddingRight: WEEK_HORIZONTAL_PADDING }]
            : undefined
        }
      >
        <WeekDaysHeader
          dates={visibleDates}
          dayWidth={viewMode === 'week' ? fiveDayColumnWidth : undefined}
          useFiveDayLayout={viewMode === 'week'}
        />
      </View>

      {/* Calendar Days Row with Swipe */}
      <View
        {...panResponder.panHandlers}
        style={
          viewMode === 'week'
            ? [styles.fiveDayAlignedRow, { paddingLeft: TIME_AXIS_WIDTH, paddingRight: WEEK_HORIZONTAL_PADDING }]
            : undefined
        }
      >
        <CalendarRow
          dates={visibleDates}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          dayWidth={viewMode === 'week' ? fiveDayColumnWidth : undefined}
          useFiveDayLayout={viewMode === 'week'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  
  container: {
    backgroundColor: 'black',
    width: '100%',
    height: vs(107) ,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(37),
    width: '100%',
    paddingHorizontal: ms(12),
  },
  tabSelectorContainer: {
    position: 'relative',
    width: ms(188.7),
    height: vs(30),
    alignSelf: 'center',
  },
  tabBackground: {
    position: 'absolute',
    width: ms(188.7),
    height: vs(30),
    borderRadius: ms(12.5),
    backgroundColor:  '#232627',
  },
  
  tabBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: ms(12.5),
    borderWidth: ms(0.9),
    borderColor: 'rgba(200, 200, 200, 0.96)',
  },
  divider: {
    position: 'absolute',
    width: ms(1.5),
    height: vs(15),
  },
  activeTab: {
    position: 'absolute',
    top: vs(2.5),
    width: ms(55),
    height: vs(25),
    borderRadius: ms(8.5),
    paddingHorizontal: ms(14.4),
    paddingVertical: vs(4),
    backgroundColor: '#151719',
  },
  activeTabBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: ms(8.5),
    borderWidth: ms(0.9),
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(7.2) },
    shadowOpacity: 0.24,
    shadowRadius: ms(28.8),
    elevation: 8,
  },
  tabLabel: {
    position: 'absolute',
    top: vs(10),
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
    width: ms(330),
    height: vs(24),
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: ms(40) - ms(5),
  },
  weekDaysContainerFiveDay: {
    width: '100%',
    justifyContent: 'flex-start',
    paddingLeft: ms(0),
  },
  weekDay: {
    width: ms(42),
    height: vs(24),
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
    width: ms(325) + ms(40) - ms(5),
    backgroundColor: 'black',
    paddingLeft: ms(40) - ms(5),
  },
  calendarRowFiveDay: {
    width: '100%',
    paddingLeft: ms(0),
  },
  fiveDayAlignedRow: {
    width: '100%',
  },
  calendarDayWrapper: {
    width: ms(42),
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalDayWrapper: {
    paddingVertical: vs(6),
    height: vs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayWrapper: {
    paddingVertical: vs(0),
    // backgroundColor:"blue",
    width: ms(32),
    height:ms(32),
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
    padding:  ms(2),
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
