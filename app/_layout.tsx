import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { EventsProvider } from '../src/context/EventsContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <EventsProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { flex: 1, backgroundColor: '#000' },
            animation: 'slide_from_right',
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-appointment" />
          <Stack.Screen name="client/[id]" />
          <Stack.Screen name="new-customer" />
          <Stack.Screen name="new-service" />
        </Stack>
        <StatusBar style="light" />
      </GestureHandlerRootView>
      </EventsProvider>
    </SafeAreaProvider>
  );
}
