/**
 * Token Extractor — transforms CanvasVariable[] into a TokenPayload.
 */

import type { CanvasVariable } from '@/types/canvas';
import type { TokenPayload, TokenCollection, DesignToken } from '@/types/design-documents/token';

/** Map canvas variable type to token type. */
function mapTokenType(varType: CanvasVariable['type']): DesignToken['type'] {
  if (varType === 'color') return 'color';
  if (varType === 'number') return 'number';
  return 'string';
}

/** Convert a CanvasVariable to a DesignToken. */
function variableToToken(variable: CanvasVariable): DesignToken {
  return {
    name: variable.name,
    type: mapTokenType(variable.type),
    values: variable.values as Record<string, string | number>,
    css_var: `--${variable.collection.toLowerCase()}-${variable.name.replace(/\//g, '-')}`,
    description: variable.description,
  };
}

/** Group variables by collection and produce a TokenPayload. */
export function extractTokens(variables: CanvasVariable[]): TokenPayload {
  const collectionMap = new Map<string, DesignToken[]>();

  for (const variable of variables) {
    const key = variable.collection;
    if (!collectionMap.has(key)) {
      collectionMap.set(key, []);
    }
    collectionMap.get(key)!.push(variableToToken(variable));
  }

  const collections: TokenCollection[] = [];
  for (const [name, tokens] of collectionMap) {
    collections.push({ name, tokens });
  }

  return { collections };
}
