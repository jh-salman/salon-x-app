import { useLocalSearchParams } from 'expo-router';
import CompleteClientDetailsScreen from '../../src/screens/CompleteClientDetailsScreen';
import { MOCK_CLIENT_DETAILS, getClientDetailsForAppointment } from '../../src/data/clients';
import { useEvents } from '../../src/context/EventsContext';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { events } = useEvents();
  const runId = `run-${Date.now()}`;
  const sendDebugLog = (
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>
  ) => {
    // #region agent log
    fetch('http://127.0.0.1:7699/ingest/8c2592ef-b362-4f49-875c-0da790bfbf73', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '53aca5' },
      body: JSON.stringify({
        sessionId: '53aca5',
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  const normalizedId = Array.isArray(id) ? id[0] : id;
  if (!normalizedId) {
    sendDebugLog('H2', 'app/client/[id].tsx:normalizedId', 'Missing route id', {
      id,
    });
    return null;
  }

  // From appointment click: id is "appointment-{eventId}"
  if (normalizedId.startsWith('appointment-')) {
    const eventId = normalizedId.replace('appointment-', '');
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      sendDebugLog('H2', 'app/client/[id].tsx:eventLookup', 'Event not found', {
        normalizedId,
        eventId,
        eventsCount: events.length,
      });
      return null;
    }
    const hasValidStart =
      event.start instanceof Date && !Number.isNaN(event.start.getTime());
    const hasValidEnd =
      event.end instanceof Date && !Number.isNaN(event.end.getTime());
    if (!hasValidStart || !hasValidEnd) {
      sendDebugLog('H2', 'app/client/[id].tsx:eventDates', 'Invalid event date payload', {
        eventId: event.id,
        start: String(event.start),
        end: String(event.end),
      });
      return null;
    }
    sendDebugLog('H2', 'app/client/[id].tsx:openDetail', 'Opening appointment details', {
      normalizedId,
      eventId: event.id,
      title: event.title,
      clientName: event.clientName,
      service: event.service,
    });
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
  if (!clientDetails) {
    console.error('[ClientDetailRoute] Mock client details not found', {
      normalizedId,
    });
    return null;
  }

  return <CompleteClientDetailsScreen clientDetails={clientDetails} />;
}
