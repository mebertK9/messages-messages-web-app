import { Product, Shop, Wish } from "./domain";

// Client-only staging state for the "plan a shopping trip" screen.
// Nothing here is persisted until POST /trips is called - see TripStagingPage.

export interface WishGroup {
  product: Product;
  wishes: Wish[];
}

export interface TripStopDraft {
  shop: Shop;
  wishGroups: WishGroup[];
}

export interface ShopWishGroups {
  shop: Shop;
  wishGroups: WishGroup[];
}
