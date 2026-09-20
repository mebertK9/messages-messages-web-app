import { Dispatch, SetStateAction, useState } from "react";
import { updateProductShop, updateProductCategory } from "../services/products";
import { Product } from "../types/domain";

interface UseProductEditingResult {
  editingProductId: string | null;
  toggleEditing: (productId: string) => void;
  handleAssignShop: (product: Product, shopId: string) => Promise<void>;
  handleAssignCategory: (product: Product, categoryId: string) => Promise<void>;
}

/**
 * Shared logic for the "edit shop / category" chip row on a product:
 * tracks which single product is currently being edited, and applies a
 * chip click by saving immediately (no separate confirm step). Used by
 * both the category page's product list and the dashboard's inline
 * search results.
 */
export function useProductEditing(
  setProducts: Dispatch<SetStateAction<Product[]>>,
  onError: (message: string) => void
): UseProductEditingResult {
  // Only one product's edit row is open at a time.
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  function toggleEditing(productId: string) {
    setEditingProductId((current) => (current === productId ? null : productId));
  }

  async function handleAssignShop(product: Product, shopId: string) {
    // Save and close immediately - no separate confirm step.
    setEditingProductId(null);
    try {
      const updated = await updateProductShop(product.id, shopId);
      setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      onError("Standard-Markt konnte nicht geändert werden");
    }
  }

  async function handleAssignCategory(product: Product, categoryId: string) {
    setEditingProductId(null);
    try {
      const updated = await updateProductCategory(product.id, categoryId);
      setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      onError("Bereich konnte nicht geändert werden");
    }
  }

  return { editingProductId, toggleEditing, handleAssignShop, handleAssignCategory };
}
