import { Product } from "../types/domain";

/**
 * Sorts products alphabetically by name for display. Locale-aware so
 * German umlauts (ä, ö, ü) sort the way a person would expect.
 */
export function sortProductsByName(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, "de"));
}
