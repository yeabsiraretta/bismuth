/**
 * Design Token System types.
 * Manages token collections, modes, aliases, and values for the design system.
 */

/** A collection of design tokens grouped by purpose (e.g., Colors, Typography). */
export interface TokenCollection {
  id: string;
  name: string;
  modes: TokenMode[];
  tokens: DesignToken[];
}

/** A mode within a token collection (e.g., Light, Dark, High Contrast). */
export interface TokenMode {
  id: string;
  name: string;
  isDefault: boolean;
}

/** A single design token with values per mode. */
export interface DesignToken {
  id: string;
  name: string;
  collectionId: string;
  type: TokenType;
  values: Record<string, TokenValue>;
  description?: string;
  aliasOf?: string;
}

/** Supported token categories. */
export type TokenType = 'color' | 'spacing' | 'typography' | 'shadow' | 'radius' | 'opacity';

/** A resolved token value — can be a primitive or a structured type. */
export type TokenValue = string | number | TypographyToken | ShadowToken;

/** Typography token with all font properties. */
export interface TypographyToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

/** Shadow token with position, blur, spread, and color. */
export interface ShadowToken {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

/** Token binding on a canvas element — maps a property to a token ID. */
export interface TokenBinding {
  property: string;
  tokenId: string;
  collectionId: string;
}
