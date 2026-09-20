import { ReactNode } from "react";
import { Product } from "../types/domain";

interface Props {
  product: Product;
  count: number;
  hasOwnWish: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  // Optional extra control rendered after the +/- buttons, e.g.
  // CategoryPage's "edit shop/category" button. Omitted where it doesn't
  // make sense, e.g. the dashboard's inline search results.
  trailingAction?: ReactNode;
}

/**
 * One product line with its wish count and +/- controls. Shared between
 * the category page's full product list and the dashboard's inline
 * search results, so the wish-toggle UI only exists once.
 */
export default function ProductWishRow({
  product,
  count,
  hasOwnWish,
  onIncrement,
  onDecrement,
  trailingAction
}: Props) {
  return (
    <div className="product-item">
      <span>{product.name}</span>
      <span className="product-controls">
        {hasOwnWish && (
          <button className="qty-button" onClick={onDecrement}>
            −
          </button>
        )}
        {count > 0 && <span className="qty-count">({count}×)</span>}
        <button className="qty-button" onClick={onIncrement}>
          +
        </button>
        {trailingAction}
      </span>
    </div>
  );
}
