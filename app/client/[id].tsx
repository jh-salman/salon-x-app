import { useLocalSearchParams } from 'expo-router';
import CompleteClientDetailsScreen from '../../src/screens/CompleteClientDetailsScreen';
import { resolveClientDetailsForRouteId } from '../../src/data/clients';
import { useEvents } from '../../src/context/EventsContext';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { events } = useEvents();

  const normalizedId = Array.isArray(id) ? id[0] : id;
  if (!normalizedId) {
    return null;
  }

  const clientDetails = resolveClientDetailsForRouteId(normalizedId, events);
  if (!clientDetails) {
    console.error('[ClientDetailRoute] Client details not found', {
      normalizedId,
    });
    return null;
  }

  return <CompleteClientDetailsScreen clientDetails={clientDetails} />;
}
