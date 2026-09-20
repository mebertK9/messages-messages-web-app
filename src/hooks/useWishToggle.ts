import { Dispatch, SetStateAction } from "react";
import { createWish, retractWish } from "../services/wishes";
import { Wish } from "../types/domain";

interface UseWishToggleResult {
  countFor: (productId: string) => number;
  ownWishFor: (productId: string) => Wish | undefined;
  handleIncrement: (productId: string) => Promise<void>;
  handleDecrement: (productId: string) => Promise<void>;
}

/**
 * Shared logic for toggling a wish for a product: creating a wish on "+",
 * retracting the current user's own wish on "-", and reading the current
 * count / own-wish state for a product. Used by both the category page's
 * full product list and the dashboard's inline search results, so the
 * wish semantics only live in one place.
 */
export function useWishToggle(
  openWishes: Wish[],
  setOpenWishes: Dispatch<SetStateAction<Wish[]>>,
  currentUserId: string | undefined,
  onError: (message: string) => void
): UseWishToggleResult {
  function countFor(productId: string): number {
    return openWishes.filter((wish) => wish.productId === productId).length;
  }

  function ownWishFor(productId: string): Wish | undefined {
    return openWishes.find(
      (wish) => wish.productId === productId && wish.createdById === currentUserId
    );
  }

  async function handleIncrement(productId: string) {
    try {
      const wish = await createWish(productId);
      setOpenWishes((current) => [...current, wish]);
    } catch {
      onError("Wunsch konnte nicht angelegt werden");
    }
  }

  async function handleDecrement(productId: string) {
    const wishToRetract = ownWishFor(productId);
    if (!wishToRetract) return;

    try {
      await retractWish(wishToRetract.id);
      setOpenWishes((current) => current.filter((wish) => wish.id !== wishToRetract.id));
    } catch {
      onError("Wunsch konnte nicht zurückgezogen werden");
    }
  }

  return { countFor, ownWishFor, handleIncrement, handleDecrement };
}
