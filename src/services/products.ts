import { apiFetch } from "./api";
import { Product } from "../types/domain";

export async function listProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  return apiFetch<Product[]>(`/products?categoryId=${categoryId}`);
}

export async function listAllProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/products");
}

export async function createProduct(
  name: string,
  categoryId: string
): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify({ name, categoryId })
  });
}

export async function updateProductShop(
  productId: string,
  preferredShopId: string
): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ preferredShopId })
  });
}
