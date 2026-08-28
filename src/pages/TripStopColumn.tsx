import { Shop } from "../types/domain";
import { TripStopDraft, WishGroup } from "../types/tripStaging";
import WishGroupRow from "./WishGroupRow";

interface Props {
  stop: TripStopDraft;
  shops: Shop[];
  onRemoveStop: () => void;
  onMoveGroup: (group: WishGroup, targetShopId: string | "excluded") => void;
}

export default function TripStopColumn({ stop, shops, onRemoveStop, onMoveGroup }: Props) {
  // Every market is offered as a move target, whether or not it already has
  // a stop - picking one that doesn't yet creates it (handled in moveGroup).
  const moveTargets = shops.filter((shop) => shop.id !== stop.shop.id);

  return (
    <div className="trip-stop-column">
      <div className="trip-stop-column-header">
        <span className="trip-stop-column-title">{stop.shop.name}</span>
        <button
          className="trip-stop-remove-button"
          title="Diesen Markt aus dem Einkauf entfernen"
          onClick={onRemoveStop}
        >
          ✕
        </button>
      </div>

      {stop.wishGroups.length === 0 && <p className="trip-stop-empty">Keine Artikel</p>}

      <ul className="trip-stop-wish-list">
        {stop.wishGroups.map((group) => (
          <WishGroupRow
            key={group.product.id}
            group={group}
            moveTargets={moveTargets.map((shop) => ({
              shop,
              onSelect: () => onMoveGroup(group, shop.id)
            }))}
            onExclude={() => onMoveGroup(group, "excluded")}
          />
        ))}
      </ul>
    </div>
  );
}
