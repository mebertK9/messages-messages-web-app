import { Shop } from "../types/domain";

interface Props {
  shop: Shop;
  loading: boolean;
  onAdd: () => void;
}

export default function AddShopChip({ shop, loading, onAdd }: Props) {
  return (
    <button className="add-shop-chip" onClick={onAdd} disabled={loading}>
      {loading ? "Lädt..." : `+ ${shop.name}`}
    </button>
  );
}
