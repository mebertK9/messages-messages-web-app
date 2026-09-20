import { FormEvent, useEffect, useState } from "react";
import {
  listProductsByCategory,
  createProduct,
  updateProductShop,
  updateProductCategory
} from "../services/products";
import { listOpenWishes } from "../services/wishes";
import { Category, Product, Shop, Wish } from "../types/domain";
import { useWishToggle } from "../hooks/useWishToggle";
import { getCurrentUserId } from "../utils/currentUser";
import { normalizeSearchTerm, matchesSearchTerm } from "../utils/textSearch";
import ProductWishRow from "./ProductWishRow";

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

  // Live in-category search, filtering the already-loaded products list -
  // same semantics as the dashboard's search (case-insensitive substring,
  // live on every keystroke, no result-count threshold).
  const [searchTerm, setSearchTerm] = useState("");

  const currentUserId = getCurrentUserId();
  const { countFor, ownWishFor, handleIncrement, handleDecrement } = useWishToggle(
    openWishes,
    setOpenWishes,
    currentUserId,
    setError
  );

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

  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
  const isSearching = normalizedSearchTerm.length > 0;
  const visibleProducts = isSearching
    ? products.filter((product) => matchesSearchTerm(product.name, normalizedSearchTerm))
    : products;

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setCreating(true);
    try {
      const product = await createProduct(newProductName.trim(), category.id);
      setProducts((current) => [product, ...current]);
      // Errors from the wish itself are reported by useWishToggle's own
      // onError, distinctly from a failure to create the product.
      await handleIncrement(product.id);
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

        {!loading && (
          <input
            type="text"
            className="product-search-input"
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Artikel suchen"
          />
        )}

        {loading ? (
          <p>Lädt...</p>
        ) : (
          <div className="product-list">
            {isSearching && visibleProducts.length === 0 && (
              <p className="product-search-empty">Keine Treffer</p>
            )}

            {visibleProducts.map((product) => {
              const isEditing = editingProductId === product.id;
              return (
                <div key={product.id} className="product-entry">
                  <ProductWishRow
                    product={product}
                    count={countFor(product.id)}
                    hasOwnWish={!!ownWishFor(product.id)}
                    onIncrement={() => handleIncrement(product.id)}
                    onDecrement={() => handleDecrement(product.id)}
                    trailingAction={
                      <button
                        className="edit-product-button"
                        title="Standard-Markt / Bereich ändern"
                        onClick={() =>
                          setEditingProductId(isEditing ? null : product.id)
                        }
                      >
                        ✎
                      </button>
                    }
                  />

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
