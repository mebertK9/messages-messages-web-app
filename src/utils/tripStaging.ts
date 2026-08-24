import { Product, Wish } from "../types/domain";
import { WishGroup } from "../types/tripStaging";

/**
 * Groups a flat list of wishes by their product, so the staging UI can
 * show "3x Klopapier" instead of three separate rows.
 */
export function buildWishGroups(wishes: Wish[], products: Product[]): WishGroup[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const groupsByProductId = new Map<string, WishGroup>();

  for (const wish of wishes) {
    const product = productById.get(wish.productId);
    if (!product) continue;

    const existing = groupsByProductId.get(product.id);
    if (existing) {
      existing.wishes.push(wish);
    } else {
      groupsByProductId.set(product.id, { product, wishes: [wish] });
    }
  }

  return Array.from(groupsByProductId.values());
}
