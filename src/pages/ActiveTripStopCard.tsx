import { Product, Shop } from "../types/domain";
import { TripStopWithWishes } from "../types/trip";
import { buildWishGroups, formatWishGroupLine } from "../utils/tripStaging";

interface Props {
  stop: TripStopWithWishes;
  shop: Shop | undefined;
  products: Product[];
  completing: boolean;
  // Purely a local UI label - the server has no separate "skipped" status
  // (see active-trip-page-behavior.md). Once true, the card keeps showing
  // "Ausgelassen" instead of "Erledigt" for the rest of this session.
  wasSkipped: boolean;
  // "Fertig hier" now means "everything is in the cart" - there is no
  // per-item "not found" choice during the trip anymore. Sorting out
  // individual misses is deferred to the not-yet-defined phase 6
  // (Nachbehandlung), see active-trip-page-behavior.md.
  onComplete: () => void;
  onSkip: () => void;
}

export default function ActiveTripStopCard({
  stop,
  shop,
  products,
  completing,
  wasSkipped,
  onComplete,
  onSkip
}: Props) {
  const isDone = stop.status === "done";
  // Reuses the same grouping as the staging screen, so "3x Klopapier" reads
  // the same way here as it did while planning the trip.
  const wishGroups = buildWishGroups(stop.wishes, products);

  return (
    <div className={`active-trip-stop-card${isDone ? " done" : ""}`}>
      <div className="active-trip-stop-header">
        <span className="active-trip-stop-title">{shop?.name ?? "Unbekannter Markt"}</span>
        <span className="active-trip-stop-status">
          {isDone ? (wasSkipped ? "Ausgelassen" : "Erledigt") : "Aktiv"}
        </span>
      </div>

      {wishGroups.length === 0 && <p className="trip-stop-empty">Keine Artikel</p>}

      {!isDone && wishGroups.length > 0 && (
        <ul className="trip-stop-wish-list">
          {wishGroups.map((group) => (
            <li key={group.product.id} className="trip-stop-wish-row">
              <span>{formatWishGroupLine(group)}</span>
            </li>
          ))}
        </ul>
      )}

      {!isDone && (
        <div className="active-trip-stop-actions">
          <button className="complete-stop-button" disabled={completing} onClick={onComplete}>
            {completing ? "Lädt..." : "Fertig hier"}
          </button>
          <button className="skip-stop-button" disabled={completing} onClick={onSkip}>
            Markt auslassen
          </button>
        </div>
      )}
    </div>
  );
}
