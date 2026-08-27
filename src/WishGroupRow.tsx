import { Shop } from "../types/domain";
import { WishGroup } from "../types/tripStaging";
import { formatWishGroupLine } from "../utils/tripStaging";

interface MoveTarget {
  shop: Shop;
  onSelect: () => void;
}

interface Props {
  group: WishGroup;
  moveTargets: MoveTarget[];
  onExclude?: () => void;
}

export default function WishGroupRow({ group, moveTargets, onExclude }: Props) {
  return (
    <li className="wish-group-row">
      <span>{formatWishGroupLine(group)}</span>
      <span className="wish-group-controls">
        {moveTargets.map(({ shop, onSelect }) => (
          <button
            key={shop.id}
            className="shop-mini-button"
            title={`Zu ${shop.name} verschieben`}
            onClick={onSelect}
          >
            {shop.name.charAt(0)}
          </button>
        ))}
        {onExclude && (
          <button className="shop-mini-button exclude-button" title="Heute nicht kaufen" onClick={onExclude}>
            ✕
          </button>
        )}
      </span>
    </li>
  );
}
