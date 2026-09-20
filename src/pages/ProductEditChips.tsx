import { Category, Product, Shop } from "../types/domain";

interface Props {
  product: Product;
  shops: Shop[];
  categories: Category[];
  onAssignShop: (shopId: string) => void;
  onAssignCategory: (categoryId: string) => void;
}

/**
 * The shop/category chip row shown while editing a product's master data.
 * Shared between the category page's product list and the dashboard's
 * inline search results.
 */
export default function ProductEditChips({
  product,
  shops,
  categories,
  onAssignShop,
  onAssignCategory
}: Props) {
  return (
    <div className="product-edit-row">
      <div className="product-edit-chips">
        {shops.map((shop) => (
          <button
            key={shop.id}
            className={`chip${product.preferredShopId === shop.id ? " chip-active" : ""}`}
            onClick={() => onAssignShop(shop.id)}
          >
            {shop.name.slice(0, 4).toUpperCase()}
          </button>
        ))}
      </div>
      <div className="product-edit-chips">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip${product.categoryId === cat.id ? " chip-active" : ""}`}
            onClick={() => onAssignCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
