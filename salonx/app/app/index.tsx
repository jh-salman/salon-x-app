import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useTenant } from '../src/context/TenantContext';
import { colors } from '../src/theme';

/** Entry: API session (Bearer) → salon selection → tabs. */
export default function Index() {
  const { user, isReady: authReady } = useAuth();
  const { currentSalonId, memberships, isReady: tenantReady } = useTenant();

  if (!authReady || !tenantReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  if (memberships.length === 0) {
    return <Redirect href="/workspace-setup" />;
  }
  if (!currentSalonId) {
    return <Redirect href="/select-salon" />;
  }
  return <Redirect href="/(tabs)" />;
}
