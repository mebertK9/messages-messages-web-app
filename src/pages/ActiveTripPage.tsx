import { useState } from "react";
import { Product, Shop } from "../types/domain";
import { ShoppingTripDetail } from "../types/trip";
import { completeTripStop, getTrip } from "../services/trips";
import ActiveTripStopCard from "./ActiveTripStopCard";

interface Props {
  trip: ShoppingTripDetail;
  shops: Shop[];
  products: Product[];
  onBack: () => void;
}

export default function ActiveTripPage({ trip: initialTrip, shops, products, onBack }: Props) {
  const [trip, setTrip] = useState<ShoppingTripDetail>(initialTrip);
  const [completingStopId, setCompletingStopId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState("");
  const [endingTrip, setEndingTrip] = useState(false);
  const [endError, setEndError] = useState("");
  // Local-only bookkeeping for the "Ausgelassen" vs. "Erledigt" label - see
  // active-trip-page-behavior.md, the server doesn't distinguish the two.
  const [skippedStopIds, setSkippedStopIds] = useState<Set<string>>(new Set());

  const shopById = new Map(shops.map((shop) => [shop.id, shop]));

  async function completeStop(stopId: string, notFoundWishIds: string[]) {
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

  // "Fertig hier" means everything assigned to this stop was found and is
  // in the cart - no partial per-item outcome during the trip anymore, see
  // active-trip-page-behavior.md. So nothing is reported as "not found"
  // here; that only happens via "Markt auslassen" (the whole stop) or later
  // in the not-yet-defined post-trip follow-up (phase 6).
  function handleCompleteStop(stopId: string) {
    completeStop(stopId, []);
  }

  function handleSkipStop(stop: ShoppingTripDetail["stops"][number]) {
    setSkippedStopIds((current) => new Set(current).add(stop.id));
    const allWishIds = stop.wishes.map((wish) => wish.id);
    completeStop(stop.id, allWishIds);
  }

  /**
   * Ends the trip even though some stops may still have open wishes. Reuses
   * completeTripStop for every still-active stop, passing every one of its
   * wishes as "not found" - the server already knows how to send those
   * wishes back to open and mark the stop (and, once all stops are done,
   * the trip) as done. No dedicated "abort trip" endpoint needed.
   */
  async function handleEndTrip() {
    setEndError("");
    setEndingTrip(true);
    try {
      const activeStops = trip.stops.filter((stop) => stop.status === "active");
      setSkippedStopIds((current) => {
        const next = new Set(current);
        activeStops.forEach((stop) => next.add(stop.id));
        return next;
      });
      for (const stop of activeStops) {
        const wishIds = stop.wishes.map((wish) => wish.id);
        await completeTripStop(trip.id, stop.id, wishIds);
      }
      const refreshed = await getTrip(trip.id);
      setTrip(refreshed);
    } catch {
      setEndError("Einkauf konnte nicht beendet werden. Bitte nochmal versuchen.");
    } finally {
      setEndingTrip(false);
    }
  }

  const hasOpenWishes = trip.stops.some(
    (stop) => stop.status === "active" && stop.wishes.length > 0
  );

  return (
    <div className="active-trip">
      <div className="active-trip-header">
        <button className="back-button" onClick={onBack}>
          ← Zurück
        </button>
        <h1>Einkauf läuft</h1>
      </div>

      {trip.status === "done" && (
        <div className="active-trip-done-banner">
          <p>Alle Stops erledigt - der Einkauf ist abgeschlossen.</p>
        </div>
      )}

      {completeError && <div className="error">{completeError}</div>}
      {endError && <div className="error">{endError}</div>}

      {trip.stops.map((stop) => (
        <ActiveTripStopCard
          key={stop.id}
          stop={stop}
          shop={shopById.get(stop.shopId)}
          products={products}
          completing={completingStopId === stop.id}
          wasSkipped={skippedStopIds.has(stop.id)}
          onComplete={() => handleCompleteStop(stop.id)}
          onSkip={() => handleSkipStop(stop)}
        />
      ))}

      {trip.status === "active" && (
        <button className="end-trip-button" disabled={endingTrip} onClick={handleEndTrip}>
          {endingTrip
            ? "Lädt..."
            : hasOpenWishes
              ? "Einkauf beenden (offene Wünsche bleiben unerfüllt)"
              : "Einkauf beenden"}
        </button>
      )}
    </div>
  );
}
