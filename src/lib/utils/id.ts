/**
 * Centralized ID generation utility.
 * Provides deterministic-friendly unique IDs for canvas elements and other entities.
 */

/**
 * Generate a unique ID using timestamp + random suffix.
 * Format: `{timestamp}-{random9}` — collision-resistant for UI operations.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generate a prefixed unique ID.
 * @param prefix - Short prefix (e.g., 'grp', 'layer', 'page')
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
