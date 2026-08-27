import { Shop } from "../types/domain";
import { ShopWishGroups, WishGroup } from "../types/tripStaging";
import { formatWishGroupLine } from "../utils/tripStaging";

interface Props {
  noShopGroups: WishGroup[];
  shopGroups: ShopWishGroups[];
  activeStopShops: Shop[];
  onAssignToStop: (group: WishGroup, shopId: string) => void;
  onAddWholeShopGroup: (shop: Shop, groups: WishGroup[]) => void;
}

export default function TripExcludedSection({
  noShopGroups,
  shopGroups,
  activeStopShops,
  onAssignToStop,
  onAddWholeShopGroup
}: Props) {
  if (noShopGroups.length === 0 && shopGroups.length === 0) {
    return null;
  }

  return (
    <section className="trip-staging-section">
      <h2 className="wishlist-section-title">Heute nicht</h2>

      {noShopGroups.length > 0 && (
        <ul className="no-shop-list">
          {noShopGroups.map((group) => (
            <li key={group.product.id} className="no-shop-row">
              <span>{formatWishGroupLine(group)}</span>
              <span className="shop-mini-buttons">
                {activeStopShops.map((shop) => (
                  <button
                    key={shop.id}
                    className="shop-mini-button"
                    title={`Zu ${shop.name} hinzufügen`}
                    onClick={() => onAssignToStop(group, shop.id)}
                  >
                    {shop.name.charAt(0)}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {shopGroups.map(({ shop, wishGroups }) => (
        <section key={shop.id} className="wishlist-shop-block">
          <ul className="wishlist-shop-items">
            {wishGroups.map((group) => (
              <li key={group.product.id}>{formatWishGroupLine(group)}</li>
            ))}
          </ul>
          <button className="wishlist-shop-symbol" onClick={() => onAddWholeShopGroup(shop, wishGroups)}>
            {shop.name}
          </button>
        </section>
      ))}
    </section>
  );
}
