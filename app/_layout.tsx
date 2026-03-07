import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { EventsProvider } from '../src/context/EventsContext';
import { ServicesProvider } from '../src/context/ServicesContext';
import { ClientsProvider } from '../src/context/ClientsContext';
import { CategoriesProvider } from '../src/context/CategoriesContext';
import { DurationResultProvider } from '../src/context/DurationResultContext';
import { WorkScheduleProvider } from '../src/context/WorkScheduleContext';
import { AssignedServicesProvider } from '../src/context/AssignedServicesContext';
import { SecurityProvider } from '../src/context/SecurityContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <WorkScheduleProvider>
      <AssignedServicesProvider>
      <SecurityProvider>
      <DurationResultProvider>
      <CategoriesProvider>
      <ServicesProvider>
      <ClientsProvider>
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
          <Stack.Screen name="duration" />
          <Stack.Screen name="personal-info" />
          <Stack.Screen name="contact-info" />
          <Stack.Screen name="about" />
          <Stack.Screen name="social" />
          <Stack.Screen name="work-schedule" />
          <Stack.Screen name="assigned-services" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="security" />
        </Stack>
        <StatusBar style="light" />
      </GestureHandlerRootView>
      </EventsProvider>
      </ClientsProvider>
      </ServicesProvider>
      </CategoriesProvider>
      </DurationResultProvider>
      </SecurityProvider>
      </AssignedServicesProvider>
      </WorkScheduleProvider>
    </SafeAreaProvider>
  );
}
