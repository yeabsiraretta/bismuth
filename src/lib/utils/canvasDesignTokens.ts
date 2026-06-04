/**
 * Design Tokens System for Canvas
 *
 * Provides a token-based color/spacing/typography system similar to Figma's
 * local variables. Tokens can be organized into collections with modes
 * (e.g., light/dark).
 */

// ─── Token Types ────────────────────────────────────────────────────────────

export type TokenType = 'color' | 'spacing' | 'typography' | 'number' | 'boolean';

export interface DesignToken {
  id: string;
  name: string;
  description?: string;
  type: TokenType;
  collection: string;
  /** Values per mode. Key is mode name (e.g., "Light", "Dark"). */
  values: Record<string, TokenValue>;
}

export type TokenValue = string | number | boolean | TypographyValue;

export interface TypographyValue {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface TokenCollection {
  id: string;
  name: string;
  modes: string[];
  tokens: DesignToken[];
}

// ─── Default Collections ────────────────────────────────────────────────────

export const DEFAULT_COLOR_COLLECTION: TokenCollection = {
  id: 'colors-default',
  name: 'Colors',
  modes: ['Light', 'Dark'],
  tokens: [
    {
      id: 'color-primary',
      name: 'Color/Primary',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#3b82f6', Dark: '#60a5fa' },
    },
    {
      id: 'color-secondary',
      name: 'Color/Secondary',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#8b5cf6', Dark: '#a78bfa' },
    },
    {
      id: 'color-bg-primary',
      name: 'Color/Background/Primary',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#ffffff', Dark: '#1a1a2e' },
    },
    {
      id: 'color-bg-secondary',
      name: 'Color/Background/Secondary',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#f5f5f5', Dark: '#16213e' },
    },
    {
      id: 'color-text-primary',
      name: 'Color/Text/Primary',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#1a1a1a', Dark: '#e8e8e8' },
    },
    {
      id: 'color-text-muted',
      name: 'Color/Text/Muted',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#666666', Dark: '#a0a0a0' },
    },
    {
      id: 'color-border',
      name: 'Color/Border/Default',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#e0e0e0', Dark: '#333333' },
    },
    {
      id: 'color-accent',
      name: 'Color/Interactive/Accent',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#2563eb', Dark: '#3b82f6' },
    },
    {
      id: 'color-success',
      name: 'Color/Semantic/Success',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#10b981', Dark: '#34d399' },
    },
    {
      id: 'color-error',
      name: 'Color/Semantic/Error',
      type: 'color',
      collection: 'colors-default',
      values: { Light: '#ef4444', Dark: '#f87171' },
    },
  ],
};

export const DEFAULT_SPACING_COLLECTION: TokenCollection = {
  id: 'spacing-default',
  name: 'Spacing',
  modes: ['Default'],
  tokens: [
    { id: 'space-xs', name: 'Spacing/XS', type: 'spacing', collection: 'spacing-default', values: { Default: 4 } },
    { id: 'space-s', name: 'Spacing/S', type: 'spacing', collection: 'spacing-default', values: { Default: 8 } },
    { id: 'space-m', name: 'Spacing/M', type: 'spacing', collection: 'spacing-default', values: { Default: 16 } },
    { id: 'space-l', name: 'Spacing/L', type: 'spacing', collection: 'spacing-default', values: { Default: 24 } },
    { id: 'space-xl', name: 'Spacing/XL', type: 'spacing', collection: 'spacing-default', values: { Default: 32 } },
    { id: 'space-2xl', name: 'Spacing/2XL', type: 'spacing', collection: 'spacing-default', values: { Default: 48 } },
    { id: 'space-3xl', name: 'Spacing/3XL', type: 'spacing', collection: 'spacing-default', values: { Default: 64 } },
  ],
};

export const DEFAULT_TYPOGRAPHY_COLLECTION: TokenCollection = {
  id: 'typography-default',
  name: 'Typography',
  modes: ['Default'],
  tokens: [
    {
      id: 'type-heading-1',
      name: 'Typography/Heading/H1',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.5 } },
    },
    {
      id: 'type-heading-2',
      name: 'Typography/Heading/H2',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.3 } },
    },
    {
      id: 'type-heading-3',
      name: 'Typography/Heading/H3',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 } },
    },
    {
      id: 'type-body',
      name: 'Typography/Body/Regular',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 } },
    },
    {
      id: 'type-body-sm',
      name: 'Typography/Body/Small',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0.1 } },
    },
    {
      id: 'type-caption',
      name: 'Typography/Caption',
      type: 'typography',
      collection: 'typography-default',
      values: { Default: { fontFamily: 'Inter', fontSize: 11, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.3 } },
    },
  ],
};

// ─── Token Resolution ───────────────────────────────────────────────────────

/**
 * Resolves a token value for the given mode.
 */
export function resolveToken(token: DesignToken, mode: string): TokenValue | undefined {
  return token.values[mode] ?? token.values[Object.keys(token.values)[0]];
}

/**
 * Resolves a token by ID from a set of collections.
 */
export function resolveTokenById(
  tokenId: string,
  collections: TokenCollection[],
  mode: string
): TokenValue | undefined {
  for (const collection of collections) {
    const token = collection.tokens.find((t) => t.id === tokenId);
    if (token) {
      return resolveToken(token, mode);
    }
  }
  return undefined;
}

/**
 * Generates CSS custom properties from a token collection for a given mode.
 */
export function tokensToCSSVariables(
  collections: TokenCollection[],
  mode: string
): Record<string, string> {
  const variables: Record<string, string> = {};

  for (const collection of collections) {
    for (const token of collection.tokens) {
      const value = resolveToken(token, mode);
      if (value === undefined) continue;

      const cssName = `--${token.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()}`;

      if (typeof value === 'string' || typeof value === 'number') {
        variables[cssName] = typeof value === 'number' ? `${value}px` : value;
      }
    }
  }

  return variables;
}

/**
 * Finds tokens matching a search query.
 */
export function searchTokens(
  collections: TokenCollection[],
  query: string
): DesignToken[] {
  const lowerQuery = query.toLowerCase();
  const results: DesignToken[] = [];

  for (const collection of collections) {
    for (const token of collection.tokens) {
      if (
        token.name.toLowerCase().includes(lowerQuery) ||
        token.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(token);
      }
    }
  }

  return results;
}
