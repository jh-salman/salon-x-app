import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarBackArrow } from '../../src/components/CalendarHeaderDynamic';
import { ClientDetailsHeader, ClientDetailsHeaderSkeleton } from '../../src/components/client-details/ClientDetailsHeader';
import { useEvents } from '../../src/context/EventsContext';
import { useTheme } from '../../src/context/ThemeContext';
import { enrichClientDetailsFromEvents } from '../../src/data/clients';
import { useResolvedClientDetails } from '../../src/hooks/useResolvedClientDetails';
import { colors } from '../../src/theme';
import { wp } from '../../src/utils/responsive';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;
  const { events } = useEvents();
  const { primaryColor } = useTheme();
  const { details: rawDetails,loading  } = useResolvedClientDetails(normalizedId, events);

  const details = useMemo(
    () => (rawDetails ? enrichClientDetailsFromEvents(rawDetails, events) : null),
    [rawDetails, events],
  );

  if (!normalizedId) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: wp(4),
              paddingTop: 4,
              paddingBottom: 8,
            }}
          >
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <CalendarBackArrow />
            </Pressable>
          </View>
          <ClientDetailsHeaderSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!details) {
    return null;
  }

  const appointmentId = normalizedId?.startsWith('appointment-') ? normalizedId.replace('appointment-', '') : undefined;
  const detailId = appointmentId ? normalizedId : undefined;
  const photoSource = details.clientPhoto != null ? details.clientPhoto : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: wp(4),
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <CalendarBackArrow />
          </Pressable>
        </View>

        {/* <header> */}
        <ClientDetailsHeader
          displayName={details.clientName}
          visitCount={details.visitCount}
          photo={photoSource}
          focusSnippet={details.techniqueNotes?.[0]}
          primaryColor={primaryColor}
          appointmentId={appointmentId}
          detailId={detailId}
          clientDetails={details}
        />
      </View>
    </SafeAreaView>
  );
}
