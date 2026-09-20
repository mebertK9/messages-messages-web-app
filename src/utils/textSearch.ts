/**
 * Normalizes raw search input for case-insensitive substring matching.
 */
export function normalizeSearchTerm(rawTerm: string): string {
  return rawTerm.trim().toLowerCase();
}

/**
 * Case-insensitive substring match, e.g. "bro" matches both "Brot" and
 * "Toastbrot".
 */
export function matchesSearchTerm(name: string, normalizedTerm: string): boolean {
  return name.toLowerCase().includes(normalizedTerm);
}
