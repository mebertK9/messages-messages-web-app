import { FormEvent, useEffect, useState } from "react";
import {
  listProductsByCategory,
  createProduct,
  updateProductShop,
  updateProductCategory
} from "../services/products";
import { createWish, retractWish, listOpenWishes } from "../services/wishes";
import { Category, Product, Shop, Wish } from "../types/domain";

interface Props {
  category: Category;
  shops: Shop[];
  categories: Category[];
  onBack: () => void;
}

export default function CategoryPage({ category, shops, categories, onBack }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [openWishes, setOpenWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingNew, setAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [creating, setCreating] = useState(false);

  // Id of the product whose master-data edit row (shop + category chips) is
  // currently open - only one at a time, and it closes itself immediately
  // after a chip is clicked (see handleAssignShop/handleAssignCategory).
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Set on login (see LoginPage); used to tell "my" wishes apart from the
  // household's, since only the creator of a wish may retract it.
  const currentUserId = JSON.parse(
    localStorage.getItem("currentUser") ?? "{}"
  ).id as string | undefined;

  useEffect(() => {
    async function load() {
      try {
        const [productsResult, wishesResult] = await Promise.all([
          listProductsByCategory(category.id),
          listOpenWishes()
        ]);
        setProducts(productsResult);
        setOpenWishes(wishesResult);
      } catch {
        setError("Artikel konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [category.id]);

  function countFor(productId: string): number {
    return openWishes.filter((wish) => wish.productId === productId).length;
  }

  function ownWishFor(productId: string): Wish | undefined {
    return openWishes.find(
      (wish) => wish.productId === productId && wish.createdById === currentUserId
    );
  }

  async function handleIncrement(product: Product) {
    try {
      const wish = await createWish(product.id);
      setOpenWishes((current) => [...current, wish]);
    } catch {
      setError("Wunsch konnte nicht angelegt werden");
    }
  }

  async function handleDecrement(product: Product) {
    const wishToRetract = ownWishFor(product.id);
    if (!wishToRetract) return;

    try {
      await retractWish(wishToRetract.id);
      setOpenWishes((current) =>
        current.filter((wish) => wish.id !== wishToRetract.id)
      );
    } catch {
      setError("Wunsch konnte nicht zurückgezogen werden");
    }
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setCreating(true);
    try {
      const product = await createProduct(newProductName.trim(), category.id);
      setProducts((current) => [product, ...current]);
      const wish = await createWish(product.id);
      setOpenWishes((current) => [...current, wish]);
      setNewProductName("");
      setAddingNew(false);
    } catch {
      setError("Artikel konnte nicht angelegt werden");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignShop(product: Product, shopId: string) {
    // Save and close immediately - no separate confirm step.
    setEditingProductId(null);
    try {
      const updated = await updateProductShop(product.id, shopId);
      setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setError("Standard-Markt konnte nicht geändert werden");
    }
  }

  async function handleAssignCategory(product: Product, categoryId: string) {
    setEditingProductId(null);
    try {
      const updated = await updateProductCategory(product.id, categoryId);
      // The product may now belong to a different category than this page
      // is showing, but it's left in the list as-is for this session - it
      // will simply not appear here anymore the next time this category is
      // opened fresh.
      setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setError("Bereich konnte nicht geändert werden");
    }
  }

  return (
    <div className="container">
      <div className="card category-card">
        <div className="category-header">
          <button className="back-button" onClick={onBack}>
            ← Zurück
          </button>
          <h1>{category.name}</h1>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p>Lädt...</p>
        ) : (
          <div className="product-list">
            {products.map((product) => {
              const count = countFor(product.id);
              const hasOwnWish = !!ownWishFor(product.id);
              const isEditing = editingProductId === product.id;
              return (
                <div key={product.id} className="product-entry">
                  <div className="product-item">
                    <span>{product.name}</span>
                    <span className="product-controls">
                      {hasOwnWish && (
                        <button
                          className="qty-button"
                          onClick={() => handleDecrement(product)}
                        >
                          −
                        </button>
                      )}
                      {count > 0 && (
                        <span className="qty-count">({count}×)</span>
                      )}
                      <button
                        className="qty-button"
                        onClick={() => handleIncrement(product)}
                      >
                        +
                      </button>
                      <button
                        className="edit-product-button"
                        title="Standard-Markt / Bereich ändern"
                        onClick={() =>
                          setEditingProductId(isEditing ? null : product.id)
                        }
                      >
                        ✎
                      </button>
                    </span>
                  </div>

                  {isEditing && (
                    <div className="product-edit-row">
                      <div className="product-edit-chips">
                        {shops.map((shop) => (
                          <button
                            key={shop.id}
                            className={`chip${
                              product.preferredShopId === shop.id ? " chip-active" : ""
                            }`}
                            onClick={() => handleAssignShop(product, shop.id)}
                          >
                            {shop.name.slice(0, 4).toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="product-edit-chips">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            className={`chip${
                              product.categoryId === cat.id ? " chip-active" : ""
                            }`}
                            onClick={() => handleAssignCategory(product, cat.id)}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {addingNew ? (
              <form className="new-product-form" onSubmit={handleCreateProduct}>
                <input
                  type="text"
                  placeholder="Neuer Artikel"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  autoFocus
                  required
                />
                <button type="submit" disabled={creating}>
                  {creating ? "..." : "Anlegen"}
                </button>
              </form>
            ) : (
              <button
                className="add-product-button"
                onClick={() => setAddingNew(true)}
              >
                + Neuer Artikel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
