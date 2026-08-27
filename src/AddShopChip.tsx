import { Shop } from "../types/domain";

interface Props {
  shop: Shop;
  onAdd: () => void;
}

export default function AddShopChip({ shop, onAdd }: Props) {
  return (
    <button className="add-shop-chip" onClick={onAdd}>
      + {shop.name}
    </button>
  );
}
