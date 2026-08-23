import { FormEvent, useEffect, useState } from "react";
import { listProductsByCategory, createProduct } from "../services/products";
import { createWish, retractWish, listOpenWishes } from "../services/wishes";
import { Category, Product, Wish } from "../types/domain";

interface Props {
  category: Category;
  onBack: () => void;
}

export default function CategoryPage({ category, onBack }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [openWishes, setOpenWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addingNew, setAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [creating, setCreating] = useState(false);

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

  async function handleIncrement(product: Product) {
    try {
      const wish = await createWish(product.id);
      setOpenWishes((current) => [...current, wish]);
    } catch {
      setError("Wunsch konnte nicht angelegt werden");
    }
  }

  async function handleDecrement(product: Product) {
    const wishToRetract = openWishes.find(
      (wish) => wish.productId === product.id
    );
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
              return (
                <div key={product.id} className="product-item">
                  <span>{product.name}</span>
                  <span className="product-controls">
                    {count > 0 && (
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
                  </span>
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
