/**
 * Font value sanitization utility.
 * Pure function — no side effects.
 * Applied to all font fields before writing to CSS custom properties.
 */

const SAFE_FONT_PATTERN = /[^a-zA-Z0-9 ,'"\-_]/g;
const MAX_FONT_LENGTH = 128;

/**
 * Strips unsafe characters from a font family string and enforces max length.
 * Returns the sanitized value, or the fallback if the result is empty.
 */
export function sanitizeFontValue(value: string, fallback = 'sans-serif'): string {
  const cleaned = value.replace(SAFE_FONT_PATTERN, '').trim().slice(0, MAX_FONT_LENGTH);
  return cleaned || fallback;
}
