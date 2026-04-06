import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { TenantProvider } from '../src/context/TenantContext';

const LOCAL_RESET_DONE_KEY = '@calendar_local_reset_done_v2';
const LOCAL_DATA_KEYS_TO_CLEAR = [
  '@calendar_events',
  '@calendar_services',
  '@calendar_clients',
  '@calendar_categories',
  '@assigned_services',
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const resetLocalDataOnce = async () => {
      try {
        const alreadyReset = await AsyncStorage.getItem(LOCAL_RESET_DONE_KEY);
        if (!alreadyReset) {
          await AsyncStorage.multiRemove(LOCAL_DATA_KEYS_TO_CLEAR);
          await AsyncStorage.setItem(LOCAL_RESET_DONE_KEY, '1');
        }
      } catch {
        // Ignore reset errors to avoid blocking app boot.
      } finally {
        if (mounted) setStorageReady(true);
      }
    };
    resetLocalDataOnce();
    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded || !storageReady) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
      <AuthProvider>
      <TenantProvider>
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
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="workspace-setup" />
          <Stack.Screen name="select-salon" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-appointment" />
          <Stack.Screen name="client/[id]" />
          <Stack.Screen name="new-customer" />
          <Stack.Screen name="new-service" />
          <Stack.Screen name="repeat" />
          <Stack.Screen name="duration" />
          <Stack.Screen name="personal-info" />
          <Stack.Screen name="contact-info" />
          <Stack.Screen name="about" />
          <Stack.Screen name="social" />
          <Stack.Screen name="work-schedule" />
          <Stack.Screen name="assigned-services" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="security" />
          <Stack.Screen name="theme" />
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
      </TenantProvider>
      </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
