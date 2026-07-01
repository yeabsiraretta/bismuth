/**
 * Token Document payload — design tokens (colors, spacing, typography).
 */

/** A single design token with multi-mode values. */
export interface DesignToken {
  name: string;
  type: 'color' | 'number' | 'string';
  values: Record<string, string | number>;
  css_var: string;
  unit?: string;
  description?: string;
}

/** A named collection of related tokens. */
export interface TokenCollection {
  name: string;
  tokens: DesignToken[];
}

/** Token document payload. */
export interface TokenPayload {
  collections: TokenCollection[];
}
