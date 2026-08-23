import { Product, Wish } from "../types/domain";

export function countWishesByShop(
  wishes: Wish[],
  products: Product[]
): Map<string, number> {
  const productById = new Map(products.map((product) => [product.id, product]));
  const counts = new Map<string, number>();

  for (const wish of wishes) {
    const shopId = productById.get(wish.productId)?.preferredShopId;
    if (!shopId) continue;
    counts.set(shopId, (counts.get(shopId) ?? 0) + 1);
  }

  return counts;
}

export function countWishesByCategory(
  wishes: Wish[],
  products: Product[]
): Map<string, number> {
  const productById = new Map(products.map((product) => [product.id, product]));
  const counts = new Map<string, number>();

  for (const wish of wishes) {
    const categoryId = productById.get(wish.productId)?.categoryId;
    if (!categoryId) continue;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }

  return counts;
}

export function countWishesByProduct(wishes: Wish[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const wish of wishes) {
    counts.set(wish.productId, (counts.get(wish.productId) ?? 0) + 1);
  }

  return counts;
}
