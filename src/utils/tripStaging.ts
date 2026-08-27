import { Product, Shop, Wish } from "../types/domain";
import { ShopWishGroups, WishGroup } from "../types/tripStaging";

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

/** Sums the actual wish count across groups (not the group count), matching
 * how the dashboard badges and the wishlist screen count things. */
export function totalWishCount(groups: WishGroup[]): number {
  return groups.reduce((sum, group) => sum + group.wishes.length, 0);
}

export function formatWishGroupLine(group: WishGroup): string {
  return group.wishes.length > 1
    ? `${group.wishes.length}x ${group.product.name}`
    : group.product.name;
}

/** Splits wish groups by the product's preferred shop, sorted descending by
 * wish count - the same shape the wishlist screen uses. */
export function groupByPreferredShop(
  groups: WishGroup[],
  shops: Shop[]
): { noShopGroups: WishGroup[]; shopGroups: ShopWishGroups[] } {
  const noShopGroups: WishGroup[] = [];
  const groupsByShopId = new Map<string, WishGroup[]>();

  for (const group of groups) {
    const shopId = group.product.preferredShopId;
    if (!shopId) {
      noShopGroups.push(group);
      continue;
    }
    const existing = groupsByShopId.get(shopId) ?? [];
    existing.push(group);
    groupsByShopId.set(shopId, existing);
  }

  const shopGroups = shops
    .map((shop) => ({ shop, wishGroups: groupsByShopId.get(shop.id) ?? [] }))
    .filter((group) => group.wishGroups.length > 0)
    .sort((a, b) => totalWishCount(b.wishGroups) - totalWishCount(a.wishGroups));

  return { noShopGroups, shopGroups };
}
