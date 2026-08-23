import { FormEvent, useEffect, useState } from "react";
import { listProductsByCategory, createProduct } from "../services/products";
import { createWish, listOpenWishes } from "../services/wishes";
import { countWishesByProduct } from "../utils/wishCounts";
import { Category, Product } from "../types/domain";

interface Props {
  category: Category;
  onBack: () => void;
}

export default function CategoryPage({ category, onBack }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishCounts, setWishCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingNew, setAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [productsResult, openWishes] = await Promise.all([
          listProductsByCategory(category.id),
          listOpenWishes()
        ]);
        setProducts(productsResult);
        setWishCounts(countWishesByProduct(openWishes));
      } catch {
        setError("Artikel konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [category.id]);

  function bumpWishCount(productId: string) {
    setWishCounts((current) => {
      const next = new Map(current);
      next.set(productId, (next.get(productId) ?? 0) + 1);
      return next;
    });
  }

  async function handleWish(product: Product) {
    try {
      await createWish(product.id);
      bumpWishCount(product.id);
    } catch {
      setError("Wunsch konnte nicht angelegt werden");
    }
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setCreating(true);
    try {
      const product = await createProduct(newProductName.trim(), category.id);
      setProducts((current) => [product, ...current]);
      await createWish(product.id);
      bumpWishCount(product.id);
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

        {loading ? (
          <p>Lädt...</p>
        ) : (
          <div className="product-list">
            {products.map((product) => {
              const count = wishCounts.get(product.id) ?? 0;
              return (
                <button
                  key={product.id}
                  className="product-item"
                  onClick={() => handleWish(product)}
                >
                  {product.name}
                  {count > 0 && (
                    <span className="wish-confirmed">
                      auf der Liste ({count}×)
                    </span>
                  )}
                </button>
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
