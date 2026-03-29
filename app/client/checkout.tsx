import { useLocalSearchParams } from "expo-router";
import CheckoutScreen from "../../src/screens/CheckoutScreen";
import { resolveClientDetailsForRouteId } from "../../src/data/clients";
import { useEvents } from "../../src/context/EventsContext";

export default function CheckoutRoute() {
  const { detailId } = useLocalSearchParams<{ detailId: string | string[] }>();
  const { events } = useEvents();

  const normalizedId = Array.isArray(detailId) ? detailId[0] : detailId;
  if (!normalizedId) {
    return null;
  }

  const clientDetails = resolveClientDetailsForRouteId(normalizedId, events);
  if (!clientDetails) {
    return null;
  }

  return <CheckoutScreen clientDetails={clientDetails} />;
}
