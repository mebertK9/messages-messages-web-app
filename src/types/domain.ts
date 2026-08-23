export interface Shop {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  preferredShopId: string | null;
  categoryId: string;
}

export type WishStatus = "open" | "onTrip" | "purchased" | "cancelled";

export interface Wish {
  id: string;
  productId: string;
  createdById: string;
  assignedTripStopId: string | null;
  status: WishStatus;
  createdAt: string;
}
