/**
 * Centralized ID generation utility.
 * Uses native crypto.randomUUID() for proper collision resistance.
 */

/**
 * Generate a unique ID using crypto.randomUUID().
 * Format: UUID v4 (e.g., `3b241101-e2bb-4d7b-8b44-21bf3c6fae60`).
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a prefixed unique ID.
 * @param prefix - Short prefix (e.g., 'grp', 'layer', 'page')
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
