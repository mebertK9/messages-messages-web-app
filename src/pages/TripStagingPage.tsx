import { useState } from "react";
import { createTrip } from "../services/trips";
import { buildWishGroups, totalWishCount } from "../utils/tripStaging";
import { Product, Shop, Wish } from "../types/domain";
import { CreateTripRequest, ShoppingTripDetail } from "../types/trip";
import { TripStopDraft, WishGroup } from "../types/tripStaging";
import TripStopColumn from "./TripStopColumn";
import TripExcludedSection from "./TripExcludedSection";

interface Props {
  shops: Shop[];
  products: Product[];
  openWishes: Wish[];
  initialShop: Shop;
  onBack: () => void;
  onTripStarted: (trip: ShoppingTripDetail) => void;
}

export default function TripStagingPage({
  shops,
  products,
  openWishes,
  initialShop,
  onBack,
  onTripStarted
}: Props) {
  // Built once from data the dashboard already loaded - staging only reshuffles
  // it client-side, so no extra request is needed for this screen.
  const [allGroups] = useState<WishGroup[]>(() => buildWishGroups(openWishes, products));

  const [stops, setStops] = useState<TripStopDraft[]>(() => [
    {
      shop: initialShop,
      wishGroups: allGroups.filter((group) => group.product.preferredShopId === initialShop.id)
    }
  ]);

  const [excludedGroups, setExcludedGroups] = useState<WishGroup[]>(() =>
    allGroups.filter((group) => group.product.preferredShopId !== initialShop.id)
  );

  const [commitError, setCommitError] = useState("");
  const [committing, setCommitting] = useState(false);

  function removeStop(shopId: string) {
    setStops((current) => {
      const stop = current.find((s) => s.shop.id === shopId);
      if (stop) {
        setExcludedGroups((groups) => [...groups, ...stop.wishGroups]);
      }
      return current.filter((s) => s.shop.id !== shopId);
    });
  }

  /**
   * Moves one product's wishes to a stop (identified by shop id) or to
   * "excluded". A stop that ends up with no wishes left is dropped
   * automatically - once nothing is assigned to a shop anymore, it's no
   * longer part of the trip.
   */
  function moveGroup(group: WishGroup, target: string | "excluded") {
    setStops((current) => {
      let updated = current.map((stop) => ({
        ...stop,
        wishGroups: stop.wishGroups.filter((g) => g.product.id !== group.product.id)
      }));

      if (target !== "excluded") {
        updated = updated.map((stop) =>
          stop.shop.id === target ? { ...stop, wishGroups: [...stop.wishGroups, group] } : stop
        );
      }

      return updated.filter((stop) => stop.wishGroups.length > 0);
    });

    setExcludedGroups((current) => {
      const withoutGroup = current.filter((g) => g.product.id !== group.product.id);
      return target === "excluded" ? [...withoutGroup, group] : withoutGroup;
    });
  }

  async function handleCommit() {
    setCommitError("");
    setCommitting(true);
    try {
      const request: CreateTripRequest = {
        stops: stops.map((stop) => ({
          shopId: stop.shop.id,
          wishIds: stop.wishGroups.flatMap((group) => group.wishes.map((wish) => wish.id))
        }))
      };
      const trip = await createTrip(request);
      onTripStarted(trip);
    } catch {
      // Draft stays intact on failure - the user can just hit the button again.
      setCommitError("Einkauf konnte nicht gestartet werden. Bitte nochmal versuchen.");
    } finally {
      setCommitting(false);
    }
  }

  const totalStaged = stops.reduce((sum, stop) => sum + totalWishCount(stop.wishGroups), 0);

  return (
    <div className="trip-staging">
      <div className="trip-staging-header">
        <button className="back-button" onClick={onBack}>← Zurück</button>
        <h1>Wünschen kannmansich viel...</h1>
      </div>

      {commitError && <div className="error">{commitError}</div>}

      <section className="trip-staging-section">
        <h2 className="wishlist-section-title">Yo, bring ich mit</h2>
        <div className="trip-stop-columns">
          {stops.map((stop) => (
            <TripStopColumn
              key={stop.shop.id}
              stop={stop}
              otherStops={stops.filter((s) => s.shop.id !== stop.shop.id)}
              onRemoveStop={() => removeStop(stop.shop.id)}
              onMoveGroup={moveGroup}
            />
          ))}
        </div>
      </section>

      <button
        className="commit-trip-button"
        disabled={stops.length === 0 || committing}
        onClick={handleCommit}
      >
        {committing ? "Lädt..." : `Los geht's (${totalStaged} Wünsche)`}
      </button>

      <TripExcludedSection
        excludedGroups={excludedGroups}
        shops={shops}
        activeStopShops={stops.map((stop) => stop.shop)}
        onAssignToStop={(group, shopId) => moveGroup(group, shopId)}
      />
    </div>
  );
}
