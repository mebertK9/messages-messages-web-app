import { useState } from "react";
import { Product, Shop } from "../types/domain";
import { TripStopWithWishes } from "../types/trip";
import { buildWishGroups, formatWishGroupLine } from "../utils/tripStaging";

interface Props {
  stop: TripStopWithWishes;
  shop: Shop | undefined;
  products: Product[];
  newWishIds: Set<string>;
  completing: boolean;
  onComplete: (notFoundWishIds: string[]) => void;
}

export default function ActiveTripStopCard({
  stop,
  shop,
  products,
  newWishIds,
  completing,
  onComplete
}: Props) {
  // Tracks which products the buyer couldn't find, keyed by product id -
  // ticking a group marks all of its wishes as not found, since "not found
  // in the shop" is a statement about the product, not about who wished
  // for it.
  const [notFoundProductIds, setNotFoundProductIds] = useState<Set<string>>(new Set());

  const isDone = stop.status === "done";
  // Reuses the same grouping as the staging screen, so "3x Klopapier" reads
  // the same way here as it did while planning the trip.
  const wishGroups = buildWishGroups(stop.wishes, products);

  function toggleNotFound(productId: string) {
    setNotFoundProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function handleComplete() {
    const notFoundWishIds = wishGroups
      .filter((group) => notFoundProductIds.has(group.product.id))
      .flatMap((group) => group.wishes.map((wish) => wish.id));
    onComplete(notFoundWishIds);
  }

  return (
    <div className={`active-trip-stop-card${isDone ? " done" : ""}`}>
      <div className="active-trip-stop-header">
        <span className="active-trip-stop-title">{shop?.name ?? "Unbekannter Markt"}</span>
        <span className="active-trip-stop-status">{isDone ? "Erledigt" : "Aktiv"}</span>
      </div>

      {wishGroups.length === 0 && <p className="trip-stop-empty">Keine Artikel</p>}

      {!isDone && wishGroups.length > 0 && (
        <ul className="trip-stop-wish-list">
          {wishGroups.map((group) => {
            // A group counts as "new" if any of its wishes was auto-added
            // to the trip after it started - a group can mix an originally
            // planned wish with a later-added one for the same product.
            const isNew = group.wishes.some((wish) => newWishIds.has(wish.id));
            return (
              <li key={group.product.id} className="not-found-row">
                <input
                  type="checkbox"
                  className="not-found-checkbox"
                  checked={notFoundProductIds.has(group.product.id)}
                  onChange={() => toggleNotFound(group.product.id)}
                />
                <span>{formatWishGroupLine(group)}</span>
                {isNew && <span className="new-wish-badge">neu</span>}
              </li>
            );
          })}
        </ul>
      )}

      {!isDone && (
        <button className="complete-stop-button" disabled={completing} onClick={handleComplete}>
          {completing ? "Lädt..." : "Fertig hier"}
        </button>
      )}
    </div>
  );
}
