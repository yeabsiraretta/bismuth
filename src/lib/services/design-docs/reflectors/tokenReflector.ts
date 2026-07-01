/**
 * Token Reflector — parses tokens.css to produce a TokenPayload.
 * Reads CSS custom properties with standard prefixes.
 */

import type { TokenPayload, TokenCollection, DesignToken } from '@/types/design-documents/token';

/** Parse a CSS file content string and extract custom properties as tokens. */
export function reflectTokensFromCSS(cssContent: string): TokenPayload {
  const collections = new Map<string, DesignToken[]>();
  const lines = cssContent.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*--([\w-]+):\s*(.+?)\s*;/);
    if (!match) continue;

    const [, varName, value] = match;
    const collection = inferCollection(varName);
    const token = createToken(varName, value, collection);

    if (!collections.has(collection)) {
      collections.set(collection, []);
    }
    collections.get(collection)!.push(token);
  }

  const result: TokenCollection[] = [];
  for (const [name, tokens] of collections) {
    result.push({ name, tokens });
  }

  return { collections: result };
}

/** Infer collection name from variable name prefix. */
function inferCollection(varName: string): string {
  if (varName.startsWith('color-')) return 'colors';
  if (varName.startsWith('space-')) return 'spacing';
  if (varName.startsWith('font-')) return 'typography';
  if (varName.startsWith('radius-')) return 'radius';
  if (varName.startsWith('shadow-')) return 'shadows';
  if (varName.startsWith('size-')) return 'sizing';
  return 'misc';
}

/** Create a DesignToken from parsed CSS variable data. */
function createToken(varName: string, value: string, collection: string): DesignToken {
  const name = varName.replace(`${collection.slice(0, -1)}-`, '');
  const type = inferTokenType(value, collection);

  return {
    name,
    type,
    values: { default: value },
    css_var: `--${varName}`,
    description: undefined,
  };
}

/** Infer token type from value and collection. */
function inferTokenType(value: string, collection: string): DesignToken['type'] {
  if (
    collection === 'colors' ||
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl')
  ) {
    return 'color';
  }
  if (collection === 'spacing' || collection === 'sizing' || /^\d/.test(value)) {
    return 'number';
  }
  return 'string';
}
