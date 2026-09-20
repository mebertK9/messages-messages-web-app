import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { listShops } from "../services/shops";
import { listCategories } from "../services/categories";
import { listOpenWishes } from "../services/wishes";
import { listAllProducts } from "../services/products";
import { getTrip, listTrips } from "../services/trips";
import { countWishesByShop, countWishesByCategory } from "../utils/wishCounts";
import { getCurrentUserId } from "../utils/currentUser";
import { normalizeSearchTerm, matchesSearchTerm } from "../utils/textSearch";
import { sortProductsByName } from "../utils/sortProducts";
import { useWishToggle } from "../hooks/useWishToggle";
import { useProductEditing } from "../hooks/useProductEditing";
import { Shop, Category, Wish, Product } from "../types/domain";
import { ShoppingTripDetail } from "../types/trip";
import CategoryPage from "./CategoryPage";
import WishlistPage from "./WishlistPage";
import TripStagingPage from "./TripStagingPage";
import ActiveTripPage from "./ActiveTripPage";
import CreateUserForm from "./CreateUserForm";
import MyAccountForm from "./MyAccountForm";
import WishlistLoader from "./WishlistLoader";
import ProductWishRow from "./ProductWishRow";
import ProductEditChips from "./ProductEditChips";
import SearchField from "./SearchField";

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
  // Id of the currently running trip, if any - MVP only ever expects at
  // most one. Drives whether clicking a shop resumes it instead of staging
  // a new one. Null means "no trip running".
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ type: "home" });

  // Live product search for the "Wunsch aufschreiben" section - filters on
  // every keystroke, no submit step. See matchingProductsByCategory below.
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

  async function loadDashboardData() {
    const [shopsResult, categoriesResult, wishesResult, productsResult, activeTrips] =
      await Promise.all([
        listShops(),
        listCategories(),
        listOpenWishes(),
        listAllProducts(),
        listTrips("active")
      ]);
    setShops(shopsResult);
    setCategories(categoriesResult);
    setOpenWishes(wishesResult);
    setProducts(productsResult);
    setActiveTripId(activeTrips[0]?.id ?? null);
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

  async function startShopTrip(shop: Shop) {
    if (activeTripId) {
      // A trip is already running - resume it instead of staging a new one,
      // regardless of which shop tile was clicked.
      try {
        const trip = await getTrip(activeTripId);
        setView({ type: "activeTrip", trip });
      } catch {
        setError("Laufender Einkauf konnte nicht geladen werden");
      }
      return;
    }

    setView({ type: "staging", shop });
  }

  // Case-insensitive substring match, live on every keystroke - e.g. "bro"
  // matches both "Brot" and "Toastbrot". Grouped by category id so matching
  // categories can show their hits and non-matching categories can be
  // hidden entirely (see categoriesWithMatches below). No result-count
  // threshold: as soon as there is a search term, matches are shown. This
  // recomputes from the current `products` state, so if a product's
  // category is reassigned via the edit chips below, it regroups live.
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
  const isSearching = normalizedSearchTerm.length > 0;

  const matchingProductsByCategory = useMemo(() => {
    const result = new Map<string, Product[]>();
    if (!isSearching) return result;

    for (const product of products) {
      if (!matchesSearchTerm(product.name, normalizedSearchTerm)) continue;
      const matchesForCategory = result.get(product.categoryId) ?? [];
      matchesForCategory.push(product);
      result.set(product.categoryId, matchesForCategory);
    }

    // Always alphabetical within each category.
    for (const [categoryId, matches] of result) {
      result.set(categoryId, sortProductsByName(matches));
    }

    return result;
  }, [products, normalizedSearchTerm, isSearching]);

  const categoriesWithMatches = isSearching
    ? categories.filter((category) => matchingProductsByCategory.has(category.id))
    : [];

  if (view.type === "wishlist") {
    return <WishlistPage shops={shops} onBack={goHome} onStartShopTrip={startShopTrip} />;
  }

  if (view.type === "category") {
    return (
      <CategoryPage
        category={view.category}
        shops={shops}
        categories={categories}
        onBack={goHome}
      />
    );
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
        <WishlistLoader />
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
      <div className="dashboard-top-row">
        <button
          className="wish-count-line icon-button"
          aria-label={`Wunschliste, ${openWishes.length} ${openWishes.length === 1 ? "Wunsch" : "Wünsche"}`}
          title="Wunschliste"
          onClick={() => setView({ type: "wishlist" })}
        >
          <Heart className="dashboard-icon" aria-hidden="true" />
          <span className="dashboard-icon-badge">{openWishes.length}</span>
        </button>
        <div className="dashboard-top-row-actions">
          <MyAccountForm />
          <CreateUserForm />
        </div>
      </div>

      <section className="tile-grid">
        <h2 className="tile-grid-title">Wunsch aufschreiben</h2>

        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Produkt suchen..."
          ariaLabel="Produkt suchen"
        />

        {isSearching ? (
          <div className="product-search-results">
            {categoriesWithMatches.length === 0 && (
              <p className="product-search-empty">Keine Treffer</p>
            )}
            {categoriesWithMatches.map((category) => (
              <div key={category.id} className="product-search-category">
                <h3 className="product-search-category-title">{category.name}</h3>
                <div className="product-list">
                  {(matchingProductsByCategory.get(category.id) ?? []).map((product) => {
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
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </section>

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
    </div>
  );
}
