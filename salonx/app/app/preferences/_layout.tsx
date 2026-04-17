import { Stack } from 'expo-router';

export default function PreferencesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="waitlists" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="calendar-sync" />
    </Stack>
  );
}
