import { useEffect, useState } from "react";
import { listOpenWishesForShop } from "../services/wishes";
import { createTrip } from "../services/trips";
import { buildWishGroups } from "../utils/tripStaging";
import { Product, Shop } from "../types/domain";
import { CreateTripRequest, ShoppingTripDetail } from "../types/trip";
import { TripStopDraft, WishGroup } from "../types/tripStaging";
import TripStopColumn from "./TripStopColumn";
import AddShopChip from "./AddShopChip";
import WishGroupRow from "./WishGroupRow";

interface Props {
  shops: Shop[];
  products: Product[];
  initialShop: Shop;
  onBack: () => void;
  onTripStarted: (trip: ShoppingTripDetail) => void;
}

export default function TripStagingPage({ shops, products, initialShop, onBack, onTripStarted }: Props) {
  const [stops, setStops] = useState<TripStopDraft[]>([]);
  const [excludedGroups, setExcludedGroups] = useState<WishGroup[]>([]);
  const [loadingShopId, setLoadingShopId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");

  useEffect(() => {
    addShopAsStop(initialShop);
    // Runs once on mount only - initialShop never changes for this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addShopAsStop(shop: Shop) {
    if (stops.some((stop) => stop.shop.id === shop.id)) return;

    setLoadError("");
    setLoadingShopId(shop.id);
    try {
      const wishes = await listOpenWishesForShop(shop.id);
      const wishGroups = buildWishGroups(wishes, products);
      setStops((current) => [...current, { shop, wishGroups }]);
    } catch {
      setLoadError(`Wünsche für ${shop.name} konnten nicht geladen werden.`);
    } finally {
      setLoadingShopId(null);
    }
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
  const totalStaged = stops.reduce((sum, stop) => sum + stop.wishGroups.length, 0);

  return (
    <div className="trip-staging">
      <div className="trip-staging-header">
        <button className="back-button" onClick={onBack}>← Zurück</button>
        <h1>Einkauf planen</h1>
      </div>

      {loadError && <div className="error">{loadError}</div>}
      {commitError && <div className="error">{commitError}</div>}
      {loadingShopId && <p>Lädt...</p>}

      <section className="trip-staging-section">
        <h2 className="trip-staging-section-title">Kaufe ich ein</h2>
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
            <AddShopChip
              key={shop.id}
              shop={shop}
              loading={loadingShopId === shop.id}
              onAdd={() => addShopAsStop(shop)}
            />
          ))}
        </div>
      </section>

      {excludedGroups.length > 0 && (
        <section className="trip-staging-section">
          <h2 className="trip-staging-section-title">Heute nicht</h2>
          <ul className="excluded-wish-list">
            {excludedGroups.map((group) => (
              <WishGroupRow
                key={group.product.id}
                group={group}
                moveTargets={stops.map((stop) => ({
                  shop: stop.shop,
                  onSelect: () => moveGroup(group, stop.shop.id)
                }))}
              />
            ))}
          </ul>
        </section>
      )}

      <button
        className="commit-trip-button"
        disabled={stops.length === 0 || committing}
        onClick={handleCommit}
      >
        {committing ? "Lädt..." : `Los geht's (${totalStaged} Artikel)`}
      </button>
    </div>
  );
}
