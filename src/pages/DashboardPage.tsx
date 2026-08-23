import { useEffect, useState } from "react";
import { listShops } from "../services/shops";
import { listCategories } from "../services/categories";
import { listOpenWishes } from "../services/wishes";
import { Shop, Category } from "../types/domain";
import CategoryPage from "./CategoryPage";
import WishlistPage from "./WishlistPage";

type View =
  | { type: "home" }
  | { type: "category"; category: Category }
  | { type: "wishlist" }
  | { type: "shopStub"; shop: Shop };

export default function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishCount, setWishCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ type: "home" });

  useEffect(() => {
    async function load() {
      try {
        const [shopsResult, categoriesResult, openWishes] = await Promise.all([
          listShops(),
          listCategories(),
          listOpenWishes()
        ]);
        setShops(shopsResult);
        setCategories(categoriesResult);
        setWishCount(openWishes.length);
      } catch {
        setError("Daten konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function goHome() {
    setView({ type: "home" });
    try {
      setWishCount((await listOpenWishes()).length);
    } catch {
      // Stale count is a minor issue; keep the old value rather than erroring out.
    }
  }
  if (view.type === "wishlist") {
    return (
      <WishlistPage
        shops={shops}
        onBack={goHome}
        onStartShopTrip={(shop) => setView({ type: "shopStub", shop })}
      />
    );
  }

  if (view.type === "category") {
    return (
      <CategoryPage
        category={view.category}
        onBack={goHome}
      />
    );
  }

  if (view.type === "shopStub") {
    return (
      <div className="container">
        <div className="card">
          <h1>{view.shop.name}</h1>
          <p>Der Einkaufs-Flow für diesen Laden folgt als Nächstes.</p>
          <button onClick={() => setView({ type: "home" })}>Zurück</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <p>Lädt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <button className="wish-count-line" onClick={() => setView({ type: "wishlist" })}>
        {wishCount} {wishCount === 1 ? "Wunsch" : "Wünsche"}
      </button>

      <section className="tile-grid">
        <h2 className="tile-grid-title">Einkauf starten</h2>
        <div className="tile-grid-squares">
          {shops.slice(0, 4).map((shop) => (
            <button
              key={shop.id}
              className="tile"
              onClick={() => setView({ type: "shopStub", shop })}
            >
              {shop.name}
            </button>
          ))}
        </div>
      </section>

      <section className="tile-grid">
        <h2 className="tile-grid-title">Wunsch registrieren</h2>
        <div className="tile-grid-squares">
          {categories.slice(0, 4).map((category) => (
            <button
              key={category.id}
              className="tile"
              onClick={() => setView({ type: "category", category })}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
