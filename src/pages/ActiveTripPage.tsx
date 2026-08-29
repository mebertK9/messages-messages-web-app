import { useEffect, useState } from "react";
import { Product, Shop } from "../types/domain";
import { ShoppingTripDetail } from "../types/trip";
import { completeTripStop, getTrip } from "../services/trips";
import ActiveTripStopCard from "./ActiveTripStopCard";

// 222 seconds - deliberately not a round number (60s or 300s), per explicit
// user request. No push available (see workflow.md), so this is how new
// wishes joining an active stop and retractions become visible.
const POLL_INTERVAL_MS = 222_222;

interface Props {
  trip: ShoppingTripDetail;
  shops: Shop[];
  products: Product[];
  onBack: () => void;
}

export default function ActiveTripPage({ trip: initialTrip, shops, products, onBack }: Props) {
  const [trip, setTrip] = useState<ShoppingTripDetail>(initialTrip);
  const [pollError, setPollError] = useState("");
  const [completingStopId, setCompletingStopId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState("");

  const shopById = new Map(shops.map((shop) => [shop.id, shop]));

  useEffect(() => {
    if (trip.status === "done") return; // nothing left to poll for

    const intervalId = window.setInterval(async () => {
      try {
        const refreshed = await getTrip(trip.id);
        setTrip(refreshed);
        setPollError("");
      } catch {
        // A single missed poll isn't worth interrupting the user for - the
        // next tick simply tries again.
        setPollError("Aktualisierung im Hintergrund fehlgeschlagen, versuche es weiter.");
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [trip.id, trip.status]);

  async function handleCompleteStop(stopId: string, notFoundWishIds: string[]) {
    setCompleteError("");
    setCompletingStopId(stopId);
    try {
      await completeTripStop(trip.id, stopId, notFoundWishIds);
      // Re-fetch the whole trip instead of patching local state by hand -
      // the server decides purchased/notFound wish statuses and whether the
      // trip as a whole is now done, so let it stay the single source of
      // truth rather than duplicating that logic here.
      const refreshed = await getTrip(trip.id);
      setTrip(refreshed);
    } catch {
      setCompleteError("Stop konnte nicht abgeschlossen werden. Bitte nochmal versuchen.");
    } finally {
      setCompletingStopId(null);
    }
  }

  if (trip.status === "done") {
    return (
      <div className="active-trip">
        <div className="active-trip-header">
          <h1>Einkauf läuft</h1>
        </div>
        <div className="active-trip-done-banner">
          <p>Alle Stops erledigt - der Einkauf ist abgeschlossen.</p>
          <button onClick={onBack}>Zurück zum Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="active-trip">
      <div className="active-trip-header">
        <button className="back-button" onClick={onBack}>← Zurück</button>
        <h1>Einkauf läuft</h1>
      </div>

      {completeError && <div className="error">{completeError}</div>}
      {pollError && <div className="poll-error">{pollError}</div>}

      {trip.stops.map((stop) => (
        <ActiveTripStopCard
          key={stop.id}
          stop={stop}
          shop={shopById.get(stop.shopId)}
          products={products}
          completing={completingStopId === stop.id}
          onComplete={(notFoundWishIds) => handleCompleteStop(stop.id, notFoundWishIds)}
        />
      ))}
    </div>
  );
}
