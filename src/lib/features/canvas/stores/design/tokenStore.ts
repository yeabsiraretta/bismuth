import { writable, derived, get } from 'svelte/store';
import type {
  TokenCollection,
  DesignToken,
  TokenValue,
  TokenBinding,
} from '@/features/canvas/types/design';
import { log } from '@/utils/logger';

// ─── State ──────────────────────────────────────────────────────────────────

/** All token collections in the current canvas document. */
export const tokenCollections = writable<TokenCollection[]>([]);

/** The currently active mode ID for preview. */
export const activeMode = writable<string>('');

/** Token bindings on the currently selected element. */
export const selectedElementBindings = writable<TokenBinding[]>([]);

// ─── Derived ────────────────────────────────────────────────────────────────

/** Flat list of all tokens across all collections. */
export const allTokens = derived(tokenCollections, ($collections) =>
  $collections.flatMap((c) => c.tokens)
);

/** Available modes from all collections (deduplicated by name). */
export const availableModes = derived(tokenCollections, ($collections) => {
  const modes = $collections.flatMap((c) => c.modes);
  const seen = new Set<string>();
  return modes.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
});

// ─── Token Resolution ───────────────────────────────────────────────────────

const MAX_ALIAS_DEPTH = 10;

/**
 * Resolves a token's value, following alias chains.
 * Enforces SC-03: max depth 10, cycle detection.
 */
export function resolveToken(
  tokenId: string,
  modeId: string,
  visited = new Set<string>()
): TokenValue | null {
  if (visited.has(tokenId)) {
    log.warn('Token alias cycle detected', { tokenId, chain: [...visited] });
    return null;
  }
  if (visited.size >= MAX_ALIAS_DEPTH) {
    log.warn('Token alias depth exceeded', { tokenId, depth: visited.size });
    return null;
  }

  const collections = get(tokenCollections);
  const token = collections.flatMap((c) => c.tokens).find((t) => t.id === tokenId);
  if (!token) return null;

  if (token.aliasOf) {
    visited.add(tokenId);
    return resolveToken(token.aliasOf, modeId, visited);
  }

  return token.values[modeId] ?? null;
}

/**
 * Returns all resolved token values for a given mode.
 */
export function getTokensForMode(modeId: string): Record<string, TokenValue> {
  const collections = get(tokenCollections);
  const result: Record<string, TokenValue> = {};

  for (const collection of collections) {
    for (const token of collection.tokens) {
      const resolved = resolveToken(token.id, modeId);
      if (resolved !== null) {
        result[token.id] = resolved;
      }
    }
  }

  return result;
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

/** Creates a new token collection. */
export function createCollection(collection: TokenCollection): void {
  tokenCollections.update((cols) => [...cols, collection]);
}

/** Removes a token collection by ID. */
export function deleteCollection(collectionId: string): void {
  tokenCollections.update((cols) => cols.filter((c) => c.id !== collectionId));
}

/** Adds a token to a specific collection. */
export function addToken(collectionId: string, token: DesignToken): void {
  tokenCollections.update((cols) =>
    cols.map((c) => (c.id === collectionId ? { ...c, tokens: [...c.tokens, token] } : c))
  );
}

/** Updates an existing token within its collection. */
export function updateToken(collectionId: string, token: DesignToken): void {
  tokenCollections.update((cols) =>
    cols.map((c) =>
      c.id === collectionId
        ? { ...c, tokens: c.tokens.map((t) => (t.id === token.id ? token : t)) }
        : c
    )
  );
}

/** Deletes a token from its collection. */
export function deleteToken(collectionId: string, tokenId: string): void {
  tokenCollections.update((cols) =>
    cols.map((c) =>
      c.id === collectionId ? { ...c, tokens: c.tokens.filter((t) => t.id !== tokenId) } : c
    )
  );
}

/** Applies a token binding to an element property. */
export function applyTokenToElement(
  _elementId: string,
  property: string,
  tokenId: string,
  collectionId: string
): TokenBinding {
  const binding: TokenBinding = { property, tokenId, collectionId };
  selectedElementBindings.update((bindings) => [
    ...bindings.filter((b) => b.property !== property),
    binding,
  ]);
  return binding;
}

/** Removes a token binding from an element property. */
export function removeTokenBinding(property: string): void {
  selectedElementBindings.update((bindings) => bindings.filter((b) => b.property !== property));
}

/** Loads token collections from persisted data. */
export function loadCollections(collections: TokenCollection[]): void {
  tokenCollections.set(collections);
  const defaultMode = collections.flatMap((c) => c.modes).find((m) => m.isDefault);
  if (defaultMode) {
    activeMode.set(defaultMode.id);
  }
}
