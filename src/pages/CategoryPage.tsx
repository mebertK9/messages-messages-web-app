import { FormEvent, useEffect, useState } from "react";
import { listProductsByCategory, createProduct } from "../services/products";
import { createWish } from "../services/wishes";
import { Category, Product } from "../types/domain";

interface Props {
  category: Category;
  onBack: () => void;
}

export default function CategoryPage({ category, onBack }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [justWishedId, setJustWishedId] = useState<string | null>(null);

  const [addingNew, setAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setProducts(await listProductsByCategory(category.id));
      } catch {
        setError("Artikel konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [category.id]);

  async function handleWish(product: Product) {
    try {
      await createWish(product.id);
      setJustWishedId(product.id);
      setTimeout(() => setJustWishedId(null), 1500);
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
      setJustWishedId(product.id);
      setTimeout(() => setJustWishedId(null), 1500);
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
            {products.map((product) => (
              <button
                key={product.id}
                className="product-item"
                onClick={() => handleWish(product)}
              >
                {product.name}
                {justWishedId === product.id && (
                  <span className="wish-confirmed">✓ auf der Liste</span>
                )}
              </button>
            ))}

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
