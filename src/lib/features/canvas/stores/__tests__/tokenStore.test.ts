import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  tokenCollections,
  activeMode,
  allTokens,
  resolveToken,
  getTokensForMode,
  createCollection,
  deleteCollection,
  addToken,
  updateToken,
  deleteToken,
  applyTokenToElement,
  removeTokenBinding,
  selectedElementBindings,
  loadCollections,
} from '../design/tokenStore';
import type { TokenCollection, DesignToken } from '@/features/canvas/types/design';

function makeCollection(overrides: Partial<TokenCollection> = {}): TokenCollection {
  return {
    id: 'col-1',
    name: 'Colors',
    modes: [
      { id: 'light', name: 'Light', isDefault: true },
      { id: 'dark', name: 'Dark', isDefault: false },
    ],
    tokens: [],
    ...overrides,
  };
}

function makeToken(overrides: Partial<DesignToken> = {}): DesignToken {
  return {
    id: 'tok-1',
    name: 'Primary',
    collectionId: 'col-1',
    type: 'color',
    values: { light: '#0066ff', dark: '#3388ff' },
    ...overrides,
  };
}

describe('tokenStore', () => {
  beforeEach(() => {
    tokenCollections.set([]);
    activeMode.set('');
    selectedElementBindings.set([]);
  });

  describe('CRUD', () => {
    it('creates a collection', () => {
      const col = makeCollection();
      createCollection(col);
      expect(get(tokenCollections)).toHaveLength(1);
      expect(get(tokenCollections)[0].name).toBe('Colors');
    });

    it('deletes a collection', () => {
      createCollection(makeCollection());
      deleteCollection('col-1');
      expect(get(tokenCollections)).toHaveLength(0);
    });

    it('adds a token to a collection', () => {
      createCollection(makeCollection());
      addToken('col-1', makeToken());
      expect(get(tokenCollections)[0].tokens).toHaveLength(1);
    });

    it('updates a token', () => {
      createCollection(makeCollection({ tokens: [makeToken()] }));
      updateToken('col-1', { ...makeToken(), name: 'Updated' });
      expect(get(tokenCollections)[0].tokens[0].name).toBe('Updated');
    });

    it('deletes a token', () => {
      createCollection(makeCollection({ tokens: [makeToken()] }));
      deleteToken('col-1', 'tok-1');
      expect(get(tokenCollections)[0].tokens).toHaveLength(0);
    });
  });

  describe('resolveToken', () => {
    it('resolves a direct token value', () => {
      createCollection(makeCollection({ tokens: [makeToken()] }));
      activeMode.set('light');
      const value = resolveToken('tok-1', 'light');
      expect(value).toBe('#0066ff');
    });

    it('resolves an alias chain', () => {
      const baseToken = makeToken({ id: 'base', name: 'Blue 500' });
      const aliasToken = makeToken({ id: 'alias', name: 'Primary', aliasOf: 'base', values: {} });
      createCollection(makeCollection({ tokens: [baseToken, aliasToken] }));
      const value = resolveToken('alias', 'light');
      expect(value).toBe('#0066ff');
    });

    it('detects alias cycles (SC-03)', () => {
      const tokenA = makeToken({ id: 'a', aliasOf: 'b', values: {} });
      const tokenB = makeToken({ id: 'b', aliasOf: 'a', values: {} });
      createCollection(makeCollection({ tokens: [tokenA, tokenB] }));
      const value = resolveToken('a', 'light');
      expect(value).toBeNull();
    });

    it('enforces max depth limit (SC-03)', () => {
      const tokens: DesignToken[] = [];
      for (let i = 0; i < 12; i++) {
        tokens.push(makeToken({
          id: `t${i}`,
          aliasOf: i < 11 ? `t${i + 1}` : undefined,
          values: i === 11 ? { light: 'deep' } : {},
        }));
      }
      createCollection(makeCollection({ tokens }));
      const value = resolveToken('t0', 'light');
      expect(value).toBeNull();
    });

    it('returns null for unknown token', () => {
      expect(resolveToken('nonexistent', 'light')).toBeNull();
    });
  });

  describe('getTokensForMode', () => {
    it('returns all resolved values', () => {
      createCollection(makeCollection({
        tokens: [
          makeToken({ id: 'c1', values: { light: 'red', dark: 'darkred' } }),
          makeToken({ id: 'c2', values: { light: 'blue', dark: 'darkblue' } }),
        ],
      }));
      const result = getTokensForMode('dark');
      expect(result['c1']).toBe('darkred');
      expect(result['c2']).toBe('darkblue');
    });
  });

  describe('bindings', () => {
    it('applies a token binding', () => {
      applyTokenToElement('el-1', 'fill', 'tok-1', 'col-1');
      const bindings = get(selectedElementBindings);
      expect(bindings).toHaveLength(1);
      expect(bindings[0]).toEqual({ property: 'fill', tokenId: 'tok-1', collectionId: 'col-1' });
    });

    it('replaces existing binding for same property', () => {
      applyTokenToElement('el-1', 'fill', 'tok-1', 'col-1');
      applyTokenToElement('el-1', 'fill', 'tok-2', 'col-1');
      const bindings = get(selectedElementBindings);
      expect(bindings).toHaveLength(1);
      expect(bindings[0].tokenId).toBe('tok-2');
    });

    it('removes a token binding', () => {
      applyTokenToElement('el-1', 'fill', 'tok-1', 'col-1');
      removeTokenBinding('fill');
      expect(get(selectedElementBindings)).toHaveLength(0);
    });
  });

  describe('loadCollections', () => {
    it('loads collections and sets default mode', () => {
      loadCollections([makeCollection()]);
      expect(get(tokenCollections)).toHaveLength(1);
      expect(get(activeMode)).toBe('light');
    });
  });

  describe('derived stores', () => {
    it('allTokens flattens all tokens', () => {
      createCollection(makeCollection({ tokens: [makeToken(), makeToken({ id: 'tok-2' })] }));
      expect(get(allTokens)).toHaveLength(2);
    });
  });
});
