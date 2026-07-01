/**
 * Code Reflectors — barrel exports and reflectAll orchestrator.
 */

export { reflectTokensFromCSS } from './tokenReflector';
export { reflectComponentFromSvelte } from './componentReflector';
export { reflectLayoutFromCSS } from './layoutReflector';
export { reflectThemeFromCSS } from './themeReflector';

import type { DesignDocumentAny } from '@/types/design-documents';
import type { TokenPayload } from '@/types/design-documents/token';
import type { LayoutPayload } from '@/types/design-documents/layout';
import type { ThemePayload } from '@/types/design-documents/theme';
import { createDocumentEnvelope } from '@/services/design-docs/envelope';
import { reflectTokensFromCSS } from './tokenReflector';
import { reflectLayoutFromCSS } from './layoutReflector';
import { reflectThemeFromCSS } from './themeReflector';
import { log } from '@/utils/logger';

/** File paths for Bismuth's own source that feed the reflectors. */
export const REFLECT_SOURCES = {
  tokens: 'src/lib/styles/tokens.css',
  grid: 'src/lib/styles/grid-system.css',
} as const;


/** Reflect all available source files into design documents. */
export async function reflectAll(readFile: (path: string) => Promise<string>): Promise<DesignDocumentAny[]> {
  const docs: DesignDocumentAny[] = [];

  // Read tokens.css once for both token and theme extraction
  try {
    const tokensCss = await readFile(REFLECT_SOURCES.tokens);
    const tokenPayload = reflectTokensFromCSS(tokensCss);
    if (tokenPayload.collections.length > 0) {
      docs.push(createDocumentEnvelope<TokenPayload>('token', 'tok_reflected', 'Reflected Tokens', tokenPayload));
    }
    const themePayload = reflectThemeFromCSS(tokensCss);
    if (themePayload) {
      docs.push(createDocumentEnvelope<ThemePayload>('theme', 'theme_reflected_dark', 'Reflected Dark Theme', themePayload));
    }
  } catch (e) { log.warn('Failed to reflect tokens/theme from CSS', { error: String(e) }); }

  // Layout from grid-system.css
  try {
    const gridCss = await readFile(REFLECT_SOURCES.grid);
    const layoutPayload = reflectLayoutFromCSS(gridCss);
    if (layoutPayload) {
      docs.push(createDocumentEnvelope<LayoutPayload>('layout', 'layout_reflected', 'Reflected Layout', layoutPayload));
    }
  } catch (e) { log.warn('Failed to reflect layout from CSS', { error: String(e) }); }

  return docs;
}
