import { useEffect, useState } from "react";
import { listOpenWishes } from "../services/wishes";
import { listAllProducts, updateProductShop } from "../services/products";
import { Product, Shop, Wish } from "../types/domain";

interface Props {
  shops: Shop[];
  onBack: () => void;
  onStartShopTrip: (shop: Shop) => void;
}

interface WishItem {
  wish: Wish;
  product: Product;
}

interface ShopGroup {
  shop: Shop;
  items: WishItem[];
}

function groupByShop(
  wishes: Wish[],
  products: Product[],
  shops: Shop[]
): { noShopItems: WishItem[]; shopGroups: ShopGroup[] } {
  const productById = new Map(products.map((product) => [product.id, product]));
  const noShopItems: WishItem[] = [];
  const itemsByShopId = new Map<string, WishItem[]>();

  for (const wish of wishes) {
    const product = productById.get(wish.productId);
    if (!product) continue;

    if (!product.preferredShopId) {
      noShopItems.push({ wish, product });
      continue;
    }

    const items = itemsByShopId.get(product.preferredShopId) ?? [];
    items.push({ wish, product });
    itemsByShopId.set(product.preferredShopId, items);
  }

  const shopGroups = shops
    .map((shop) => ({ shop, items: itemsByShopId.get(shop.id) ?? [] }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length);

  return { noShopItems, shopGroups };
}

interface ProductGroup {
  product: Product;
  count: number;
}

function groupItemsByProduct(items: WishItem[]): ProductGroup[] {
  const countByProductId = new Map<string, ProductGroup>();

  for (const { product } of items) {
    const existing = countByProductId.get(product.id);
    if (existing) {
      existing.count += 1;
    } else {
      countByProductId.set(product.id, { product, count: 1 });
    }
  }

  return Array.from(countByProductId.values());
}

function formatWishLine(group: ProductGroup): string {
  return group.count > 1 ? `${group.count}x ${group.product.name}` : group.product.name;
}
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [wishesResult, productsResult] = await Promise.all([
          listOpenWishes(),
          listAllProducts()
        ]);
        setWishes(wishesResult);
        setProducts(productsResult);
      } catch {
        setError("Wunschliste konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleAssignShop(productId: string, shop: Shop) {
    try {
      const updated = await updateProductShop(productId, shop.id);
      setProducts((current) =>
        current.map((product) => (product.id === productId ? updated : product))
      );
    } catch {
      setError("Shop-Zuordnung konnte nicht gespeichert werden");
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Lädt...</p>
      </div>
    );
  }

  const { noShopItems, shopGroups } = groupByShop(wishes, products, shops);

  return (
    <div className="wishlist">
      <div className="wishlist-header">
        <button className="back-button" onClick={onBack}>
          ← Zurück
        </button>
        <h1>Wunschliste</h1>
      </div>

      {error && <div className="error">{error}</div>}

      {wishes.length === 0 && !error && <p>Keine offenen Wünsche.</p>}

      {noShopItems.length > 0 && (
        <section className="wishlist-section">
          <h2 className="wishlist-section-title">Ohne Shop</h2>
          <ul className="no-shop-list">
            {groupItemsByProduct(noShopItems).map((group) => (
              <li key={group.product.id} className="no-shop-row">
                <span>{formatWishLine(group)}</span>
                <span className="shop-mini-buttons">
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      className="shop-mini-button"
                      title={shop.name}
                      onClick={() => handleAssignShop(group.product.id, shop)}
                    >
                      {shop.name.charAt(0)}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shopGroups.map(({ shop, items }) => (
        <section key={shop.id} className="wishlist-shop-block">
          <ul className="wishlist-shop-items">
            {groupItemsByProduct(items).map((group) => (
              <li key={group.product.id}>{formatWishLine(group)}</li>
            ))}
          </ul>
          <button
            className="wishlist-shop-symbol"
            onClick={() => onStartShopTrip(shop)}
          >
            {shop.name}
          </button>
        </section>
      ))}
    </div>
  );
}
