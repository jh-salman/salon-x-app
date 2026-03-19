import { useLocalSearchParams } from 'expo-router';
import CompleteClientDetailsScreen from '../../src/screens/CompleteClientDetailsScreen';
import { MOCK_CLIENT_DETAILS, getClientDetailsForAppointment } from '../../src/data/clients';
import { useEvents } from '../../src/context/EventsContext';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { events } = useEvents();

  const normalizedId = Array.isArray(id) ? id[0] : id;
  if (!normalizedId) return null;

  // From appointment click: id is "appointment-{eventId}"
  if (normalizedId.startsWith('appointment-')) {
    const eventId = normalizedId.replace('appointment-', '');
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;
    const clientDetails = getClientDetailsForAppointment({
      id: event.id,
      clientName: event.title,
      service: event.clientName || event.service || '',
      startTime: event.start,
      endTime: event.end,
    });
    return <CompleteClientDetailsScreen clientDetails={clientDetails} />;
  }

  const clientDetails = MOCK_CLIENT_DETAILS[normalizedId];
  if (!clientDetails) return null;

  return <CompleteClientDetailsScreen clientDetails={clientDetails} />;
}
