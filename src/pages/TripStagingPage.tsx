import { useState } from "react";
import { createTrip } from "../services/trips";
import { buildWishGroups, groupByPreferredShop, totalWishCount } from "../utils/tripStaging";
import { Product, Shop, Wish } from "../types/domain";
import { CreateTripRequest, ShoppingTripDetail } from "../types/trip";
import { TripStopDraft, WishGroup } from "../types/tripStaging";
import TripStopColumn from "./TripStopColumn";
import AddShopChip from "./AddShopChip";
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

  function addShopAsStop(shop: Shop) {
    if (stops.some((stop) => stop.shop.id === shop.id)) return;

    const groupsForShop = excludedGroups.filter(
      (group) => group.product.preferredShopId === shop.id
    );
    setExcludedGroups((current) =>
      current.filter((group) => group.product.preferredShopId !== shop.id)
    );
    setStops((current) => [...current, { shop, wishGroups: groupsForShop }]);
  }

  function removeStop(shopId: string) {
    setStops((current) => {
      const stop = current.find((s) => s.shop.id === shopId);
      if (stop) {
        setExcludedGroups((groups) => [...groups, ...stop.wishGroups]);
      }
      return current.filter((s) => s.shop.id !== shopId);
    });
  }

  function moveGroup(group: WishGroup, targetShopId: string | "excluded") {
    // Remove the group from wherever it currently lives...
    setStops((current) =>
      current.map((stop) => ({
        ...stop,
        wishGroups: stop.wishGroups.filter((g) => g.product.id !== group.product.id)
      }))
    );
    setExcludedGroups((current) => current.filter((g) => g.product.id !== group.product.id));

    // ...then add it to the chosen destination.
    if (targetShopId === "excluded") {
      setExcludedGroups((current) => [...current, group]);
    } else {
      setStops((current) =>
        current.map((stop) =>
          stop.shop.id === targetShopId
            ? { ...stop, wishGroups: [...stop.wishGroups, group] }
            : stop
        )
      );
    }
  }

  /** Bulk-adds every group of one shop from "Heute nicht" into that shop's
   * stop, creating the stop if it doesn't exist yet. */
  function addWholeShopGroup(shop: Shop, groups: WishGroup[]) {
    setExcludedGroups((current) =>
      current.filter((group) => !groups.some((g) => g.product.id === group.product.id))
    );
    setStops((current) => {
      const existingStop = current.find((stop) => stop.shop.id === shop.id);
      if (existingStop) {
        return current.map((stop) =>
          stop.shop.id === shop.id
            ? { ...stop, wishGroups: [...stop.wishGroups, ...groups] }
            : stop
        );
      }
      return [...current, { shop, wishGroups: groups }];
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

  const availableShops = shops.filter((shop) => !stops.some((stop) => stop.shop.id === shop.id));
  const totalStaged = stops.reduce((sum, stop) => sum + totalWishCount(stop.wishGroups), 0);
  const { noShopGroups, shopGroups: excludedShopGroups } = groupByPreferredShop(excludedGroups, shops);

  return (
    <div className="trip-staging">
      <div className="trip-staging-header">
        <button className="back-button" onClick={onBack}>← Zurück</button>
        <h1>Wünschen kann man viel...</h1>
      </div>

      {commitError && <div className="error">{commitError}</div>}

      <section className="trip-staging-section">
        <h2 className="wishlist-section-title">Kaufe ich ein</h2>
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

        <div className="add-shop-chips">
          {availableShops.map((shop) => (
            <AddShopChip key={shop.id} shop={shop} onAdd={() => addShopAsStop(shop)} />
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
        noShopGroups={noShopGroups}
        shopGroups={excludedShopGroups}
        activeStopShops={stops.map((stop) => stop.shop)}
        onAssignToStop={(group, shopId) => moveGroup(group, shopId)}
        onAddWholeShopGroup={addWholeShopGroup}
      />
    </div>
  );
}
