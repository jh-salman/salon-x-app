import { Tabs } from 'expo-router';
import { CalendarIcon, PersonIcon, ScissorsIcon, SettingsIcon } from '../../src/components/icons';
import { colors } from '../../src/theme';
import { ms, vs } from '../../src/utils/responsive';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF18EC',
        tabBarInactiveTintColor: colors.nav.icon,
        tabBarStyle: { backgroundColor: '#111', height: vs(49), paddingBottom: vs(5), paddingTop: vs(2) },
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
  );
}
