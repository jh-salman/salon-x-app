import { useLocalSearchParams } from "expo-router";
import { useEvents } from "../../src/context/EventsContext";
import { useResolvedClientDetails } from "../../src/hooks/useResolvedClientDetails";
import { LoadingScreen } from "../../src/components/LoadingScreen";
import VisitPlanScreen from "../../src/screens/VisitPlanScreen";

export default function VisitPlanRoute() {
  const { detailId } = useLocalSearchParams<{ detailId: string | string[] }>();
  const { events } = useEvents();

  const normalizedId = Array.isArray(detailId) ? detailId[0] : detailId;
  const { details, loading } = useResolvedClientDetails(normalizedId, events);

  if (!normalizedId) return null;
  if (loading || !details) return loading ? <LoadingScreen /> : null;

  return <VisitPlanScreen detailId={normalizedId} clientDetails={details} />;
}

