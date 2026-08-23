import { apiFetch } from "./api";
import { Wish } from "../types/domain";

export async function createWish(productId: string): Promise<Wish> {
  return apiFetch<Wish>("/wishes", {
    method: "POST",
    body: JSON.stringify({ productId })
  });
}
