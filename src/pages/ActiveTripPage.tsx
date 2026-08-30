import { useEffect, useState } from "react";
import { Product, Shop } from "../types/domain";
import { ShoppingTripDetail } from "../types/trip";
import { completeTripStop, getTrip } from "../services/trips";
import { listNotifications } from "../services/notifications";
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

/**
 * Reads all "wishAddedToActiveTrip" notifications for the current user and
 * returns just the wish ids they refer to. There's no notification inbox UI
 * yet (out of MVP scope) - this only reuses the existing notification
 * records as a data source to mark which currently-visible wishes were
 * added to the trip after it started, instead of tracking that separately.
 */
async function loadNewlyAddedWishIds(): Promise<Set<string>> {
  const notifications = await listNotifications();
  const wishIds = notifications
    .filter((notification) => notification.type === "wishAddedToActiveTrip")
    .map((notification) => notification.wishId);
  return new Set(wishIds);
}

export default function ActiveTripPage({ trip: initialTrip, shops, products, onBack }: Props) {
  const [trip, setTrip] = useState<ShoppingTripDetail>(initialTrip);
  const [newWishIds, setNewWishIds] = useState<Set<string>>(new Set());
  const [pollError, setPollError] = useState("");
  const [completingStopId, setCompletingStopId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState("");
  const [endingTrip, setEndingTrip] = useState(false);
  const [endError, setEndError] = useState("");

  const shopById = new Map(shops.map((shop) => [shop.id, shop]));

  useEffect(() => {
    // Load once on mount too, not just on the interval - a wish could have
    // been added in the moment between commit and this page opening.
    loadNewlyAddedWishIds()
      .then(setNewWishIds)
      .catch(() => {
        // Non-critical - the "neu" marker is a nice-to-have, not worth an
        // error message of its own.
      });
  }, []);

  useEffect(() => {
    if (trip.status === "done") return; // nothing left to poll for

    const intervalId = window.setInterval(async () => {
      try {
        const [refreshedTrip, refreshedNewWishIds] = await Promise.all([
          getTrip(trip.id),
          loadNewlyAddedWishIds()
        ]);
        setTrip(refreshedTrip);
        setNewWishIds(refreshedNewWishIds);
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

  const hasOpenWishes = trip.stops.some(
    (stop) => stop.status === "active" && stop.wishes.length > 0
  );

  return (
    <div className="active-trip">
      <div className="active-trip-header">
        <h1>Einkauf läuft</h1>
      </div>

      {completeError && <div className="error">{completeError}</div>}
      {endError && <div className="error">{endError}</div>}
      {pollError && <div className="poll-error">{pollError}</div>}

      {trip.stops.map((stop) => (
        <ActiveTripStopCard
          key={stop.id}
          stop={stop}
          shop={shopById.get(stop.shopId)}
          products={products}
          newWishIds={newWishIds}
          completing={completingStopId === stop.id}
          onComplete={(notFoundWishIds) => handleCompleteStop(stop.id, notFoundWishIds)}
        />
      ))}

      <button className="end-trip-button" disabled={endingTrip} onClick={handleEndTrip}>
        {endingTrip
          ? "Lädt..."
          : hasOpenWishes
            ? "Einkauf beenden (offene Wünsche bleiben unerfüllt)"
            : "Einkauf beenden"}
      </button>
    </div>
  );
}
