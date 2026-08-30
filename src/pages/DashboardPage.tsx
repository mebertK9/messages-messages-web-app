import { useEffect, useState } from "react";
import { listShops } from "../services/shops";
import { listCategories } from "../services/categories";
import { listOpenWishes } from "../services/wishes";
import { listAllProducts } from "../services/products";
import { countWishesByShop, countWishesByCategory } from "../utils/wishCounts";
import { Shop, Category, Wish, Product } from "../types/domain";
import { ShoppingTripDetail } from "../types/trip";
import CategoryPage from "./CategoryPage";
import WishlistPage from "./WishlistPage";
import TripStagingPage from "./TripStagingPage";
import ActiveTripPage from "./ActiveTripPage";

type View =
  | { type: "home" }
  | { type: "category"; category: Category }
  | { type: "wishlist" }
  | { type: "staging"; shop: Shop }
  | { type: "activeTrip"; trip: ShoppingTripDetail };

export default function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openWishes, setOpenWishes] = useState<Wish[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ type: "home" });

  async function loadDashboardData() {
    const [shopsResult, categoriesResult, wishesResult, productsResult] =
      await Promise.all([
        listShops(),
        listCategories(),
        listOpenWishes(),
        listAllProducts()
      ]);
    setShops(shopsResult);
    setCategories(categoriesResult);
    setOpenWishes(wishesResult);
    setProducts(productsResult);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadDashboardData();
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
      await loadDashboardData();
    } catch {
      // Stale counts are a minor issue; keep the old values rather than erroring out.
    }
  }

  function startShopTrip(shop: Shop) {
    setView({ type: "staging", shop });
  }

  if (view.type === "wishlist") {
    return <WishlistPage shops={shops} onBack={goHome} onStartShopTrip={startShopTrip} />;
  }

  if (view.type === "category") {
    return <CategoryPage category={view.category} onBack={goHome} />;
  }

  if (view.type === "staging") {
    return (
      <TripStagingPage
        shops={shops}
        products={products}
        openWishes={openWishes}
        initialShop={view.shop}
        onBack={goHome}
        onTripStarted={(trip) => setView({ type: "activeTrip", trip })}
      />
    );
  }

  if (view.type === "activeTrip") {
    return (
      <ActiveTripPage
        trip={view.trip}
        shops={shops}
        products={products}
        onBack={goHome}
      />
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

  const shopWishCounts = countWishesByShop(openWishes, products);
  const categoryWishCounts = countWishesByCategory(openWishes, products);

  return (
    <div className="dashboard">
      <button className="wish-count-line" onClick={() => setView({ type: "wishlist" })}>
        {openWishes.length} {openWishes.length === 1 ? "Wunsch" : "Wünsche"}
      </button>

      <section className="tile-grid">
        <h2 className="tile-grid-title">Einkauf starten</h2>
        <div className="tile-grid-squares">
          {shops.slice(0, 4).map((shop) => {
            const count = shopWishCounts.get(shop.id) ?? 0;
            return (
              <button key={shop.id} className="tile" onClick={() => startShopTrip(shop)}>
                {shop.name}
                {count > 0 && <span className="tile-badge">{count}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="tile-grid">
        <h2 className="tile-grid-title">Wunsch aufschreiben</h2>
        <div className="tile-grid-squares">
          {categories.slice(0, 4).map((category) => {
            const count = categoryWishCounts.get(category.id) ?? 0;
            return (
              <button
                key={category.id}
                className="tile"
                onClick={() => setView({ type: "category", category })}
              >
                {category.name}
                {count > 0 && <span className="tile-badge">{count}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
