import { apiFetch } from "./api";
import { Wish } from "../types/domain";

export async function listOpenWishes(): Promise<Wish[]> {
  return apiFetch<Wish[]>("/wishes?status=open");
}

export async function listOpenWishesForShop(shopId: string): Promise<Wish[]> {
  return apiFetch<Wish[]>(`/wishes?status=open&shopId=${shopId}`);
}

export async function createWish(productId: string): Promise<Wish> {
  return apiFetch<Wish>("/wishes", {
    method: "POST",
    body: JSON.stringify({ productId })
  });
}

export async function retractWish(wishId: string): Promise<void> {
  return apiFetch<void>(`/wishes/${wishId}`, {
    method: "DELETE"
  });
}
