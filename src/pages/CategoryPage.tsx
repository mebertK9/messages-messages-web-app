import { FormEvent, useEffect, useState } from "react";
import { listProductsByCategory, createProduct } from "../services/products";
import { listOpenWishes } from "../services/wishes";
import { Category, Product, Shop, Wish } from "../types/domain";
import { useWishToggle } from "../hooks/useWishToggle";
import { useProductEditing } from "../hooks/useProductEditing";
import { getCurrentUserId } from "../utils/currentUser";
import { normalizeSearchTerm, matchesSearchTerm } from "../utils/textSearch";
import { sortProductsByName } from "../utils/sortProducts";
import ProductWishRow from "./ProductWishRow";
import ProductEditChips from "./ProductEditChips";
import SearchField from "./SearchField";

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
  const { editingProductId, toggleEditing, handleAssignShop, handleAssignCategory } =
    useProductEditing(setProducts, setError);

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
  const filteredProducts = isSearching
    ? products.filter((product) => matchesSearchTerm(product.name, normalizedSearchTerm))
    : products;
  // Always alphabetical, regardless of load order or where a newly
  // created product was inserted in state.
  const visibleProducts = sortProductsByName(filteredProducts);

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
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Artikel suchen..."
            ariaLabel="Artikel suchen"
          />
        )}

        {loading ? (
          <p>Lädt...</p>
        ) : (
          <div className="product-list">
            {isSearching && visibleProducts.length === 0 && (
              <p className="product-search-empty">Keine Treffer</p>
            )}

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
                        onClick={() => toggleEditing(product.id)}
                      >
                        ✎
                      </button>
                    }
                  />

                  {isEditing && (
                    <ProductEditChips
                      product={product}
                      shops={shops}
                      categories={categories}
                      onAssignShop={(shopId) => handleAssignShop(product, shopId)}
                      onAssignCategory={(categoryId) =>
                        handleAssignCategory(product, categoryId)
                      }
                    />
                  )}
                </div>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
}
