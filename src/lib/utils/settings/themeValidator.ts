/**
 * Theme manifest validation utilities.
 * Pure functions — no store or service imports.
 * Applied before any theme token is written to the DOM.
 */

export interface ThemeManifest {
  name: string;
  author: string;
  version: string;
  tokens: Record<string, string>;
}

/**
 * Allowlist of CSS custom property keys that themes are permitted to set.
 * Restricted to visual/color/spacing tokens only — no layout or security-critical vars.
 */
export const THEME_TOKEN_ALLOWLIST: ReadonlySet<string> = new Set([
  '--color-bg',
  '--color-surface',
  '--color-border',
  '--color-danger',
  '--color-success',
  '--color-warning',
  '--color-info',
  '--background-primary',
  '--background-primary-alt',
  '--background-secondary',
  '--background-modifier-hover',
  '--text-normal',
  '--text-muted',
  '--text-faint',
  '--text-on-accent',
  '--interactive-accent',
  '--interactive-accent-hover',
  '--border-color',
  '--radius-s',
  '--radius-m',
  '--radius-l',
  '--spacing-xs',
  '--spacing-s',
  '--spacing-m',
  '--spacing-l',
  '--spacing-xl',
  '--shadow-s',
  '--shadow-m',
  '--shadow-l',
]);

const UNSAFE_VALUE_PATTERNS = [
  /url\s*\(/i,
  /expression\s*\(/i,
  /@/,
  /\\/,
  /;/,
  /<\s*script/i,
  /javascript\s*:/i,
];

/**
 * Returns true if a CSS token value is safe to apply as a custom property.
 * Rejects values containing injection vectors.
 */
export function isThemeValueSafe(value: string): boolean {
  if (!value || value.length > 256) return false;
  return !UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validates that a parsed JSON object conforms to the ThemeManifest shape
 * and that all token keys are in the allowlist with safe values.
 */
export function validateThemeManifest(json: unknown): json is ThemeManifest {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
  const obj = json as Record<string, unknown>;

  if (typeof obj['name'] !== 'string' || !(obj['name'] as string).trim()) return false;
  if (typeof obj['author'] !== 'string') return false;
  if (typeof obj['version'] !== 'string') return false;
  if (!obj['tokens'] || typeof obj['tokens'] !== 'object' || Array.isArray(obj['tokens']))
    return false;

  const tokens = obj['tokens'] as Record<string, unknown>;
  for (const [key, value] of Object.entries(tokens)) {
    if (!THEME_TOKEN_ALLOWLIST.has(key)) return false;
    if (typeof value !== 'string' || !isThemeValueSafe(value)) return false;
  }

  return true;
}
