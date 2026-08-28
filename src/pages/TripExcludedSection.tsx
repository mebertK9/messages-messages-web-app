import { Shop } from "../types/domain";
import { WishGroup } from "../types/tripStaging";
import { groupByPreferredShop } from "../utils/tripStaging";
import WishGroupRow from "./WishGroupRow";

interface Props {
  excludedGroups: WishGroup[];
  shops: Shop[];
  activeStopShops: Shop[];
  onAssignToStop: (group: WishGroup, shopId: string) => void;
  onAddWholeShopGroup: (shop: Shop, groups: WishGroup[]) => void;
}

export default function TripExcludedSection({
  excludedGroups,
  shops,
  activeStopShops,
  onAssignToStop,
  onAddWholeShopGroup
}: Props) {
  if (excludedGroups.length === 0) {
    return null;
  }

  const { noShopGroups, shopGroups } = groupByPreferredShop(excludedGroups, shops);

  function moveTargetsFor(group: WishGroup) {
    return activeStopShops.map((shop) => ({
      shop,
      onSelect: () => onAssignToStop(group, shop.id)
    }));
  }

  return (
    <section className="trip-staging-section">
      <h2 className="wishlist-section-title">Sorry, heute nicht</h2>

      {noShopGroups.length > 0 && (
        <div className="excluded-shop-block">
          <h3 className="excluded-shop-title">Ohne Standard-Markt</h3>
          <ul className="trip-stop-wish-list">
            {noShopGroups.map((group) => (
              <WishGroupRow key={group.product.id} group={group} moveTargets={moveTargetsFor(group)} />
            ))}
          </ul>
        </div>
      )}

      {shopGroups.map(({ shop, wishGroups }) => (
        <div key={shop.id} className="excluded-shop-card">
          <div className="excluded-shop-card-header">
            <span className="excluded-shop-card-title">{shop.name}</span>
            <button
              className="wishlist-shop-symbol"
              title={`${shop.name} als neuen Stop hinzufügen`}
              onClick={() => onAddWholeShopGroup(shop, wishGroups)}
            >
              {shop.name}
            </button>
          </div>
          <ul className="trip-stop-wish-list">
            {wishGroups.map((group) => (
              <WishGroupRow key={group.product.id} group={group} moveTargets={moveTargetsFor(group)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
