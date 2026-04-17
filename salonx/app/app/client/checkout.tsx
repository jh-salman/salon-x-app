import { useLocalSearchParams } from "expo-router";
import CheckoutScreen from "../../src/screens/CheckoutScreen";
import { useEvents } from "../../src/context/EventsContext";
import { useResolvedClientDetails } from "../../src/hooks/useResolvedClientDetails";
import { LoadingScreen } from "../../src/components/LoadingScreen";

export default function CheckoutRoute() {
  const { detailId } = useLocalSearchParams<{ detailId: string | string[] }>();
  const { events } = useEvents();

  const normalizedId = Array.isArray(detailId) ? detailId[0] : detailId;
  const { details, loading } = useResolvedClientDetails(normalizedId, events);

  if (!normalizedId) {
    return null;
  }

  if (loading || !details) {
    return loading ? <LoadingScreen /> : null;
  }

  return <CheckoutScreen detailId={normalizedId} clientDetails={details} />;
}
