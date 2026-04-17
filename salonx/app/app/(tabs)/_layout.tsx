import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarIcon, PersonIcon, ScissorsIcon, SettingsIcon } from '../../src/components/icons';
import { colors } from '../../src/theme';
import { ms, vs } from '../../src/utils/responsive';
import { useTheme } from '../../src/context/ThemeContext';

/** Trim a few px from the native bottom inset so the tab bar sits slightly lower (tighter to home indicator). */
const BOTTOM_INSET_TRIM = 20;

export default function TabLayout() {
  const { primaryColor } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom - BOTTOM_INSET_TRIM, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: bottomPad }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: primaryColor,
          tabBarInactiveTintColor: colors.nav.icon,
          tabBarLabelStyle: {
            fontSize: ms(10),
            fontWeight: '700',
            marginBottom: vs(0),
          },
          tabBarItemStyle: {
            paddingVertical: vs(1),
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            height: vs(38),
            paddingBottom: vs(1),
            paddingTop: 0,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Stylist',
          tabBarIcon: ({ color, size }) => <ScissorsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <PersonIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tabs>
    </View>
  );
}
