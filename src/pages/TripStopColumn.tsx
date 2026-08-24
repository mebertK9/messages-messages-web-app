import { TripStopDraft, WishGroup } from "../types/tripStaging";
import WishGroupRow from "./WishGroupRow";

interface Props {
  stop: TripStopDraft;
  otherStops: TripStopDraft[];
  onRemoveStop: () => void;
  onMoveGroup: (group: WishGroup, targetShopId: string | "excluded") => void;
}

export default function TripStopColumn({ stop, otherStops, onRemoveStop, onMoveGroup }: Props) {
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
            moveTargets={otherStops.map((otherStop) => ({
              shop: otherStop.shop,
              onSelect: () => onMoveGroup(group, otherStop.shop.id)
            }))}
            onExclude={() => onMoveGroup(group, "excluded")}
          />
        ))}
      </ul>
    </div>
  );
}
