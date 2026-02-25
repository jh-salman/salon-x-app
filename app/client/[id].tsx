import { useLocalSearchParams } from 'expo-router';
import CompleteClientDetailsScreen from '../../src/screens/CompleteClientDetailsScreen';
import { MOCK_CLIENT_DETAILS, getClientDetailsForAppointment } from '../../src/data/clients';
import { useEvents } from '../../src/context/EventsContext';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events } = useEvents();

  if (!id) return null;

  // From appointment click: id is "appointment-{eventId}"
  if (id.startsWith('appointment-')) {
    const eventId = id.replace('appointment-', '');
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

  const clientDetails = MOCK_CLIENT_DETAILS[id];
  if (!clientDetails) return null;

  return <CompleteClientDetailsScreen clientDetails={clientDetails} />;
}
