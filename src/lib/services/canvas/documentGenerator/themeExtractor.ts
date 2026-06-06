/**
 * Theme Extractor — transforms multi-mode canvas variables into ThemePayload.
 */

import type { CanvasVariable } from '@/types/canvas';
import type { ThemePayload } from '@/types/design-documents/theme';

/** Extract a theme payload for a specific mode (e.g., "Dark") from canvas variables. */
export function extractTheme(
  variables: CanvasVariable[],
  modeName: string,
  baseTokenDocRef: string
): ThemePayload | null {
  // Only include variables that have the requested mode
  const relevantVars = variables.filter((v) => modeName in v.values);
  if (relevantVars.length === 0) return null;

  const overrides: Record<string, Record<string, string>> = {};

  for (const variable of relevantVars) {
    const collection = variable.collection.toLowerCase();
    if (!overrides[collection]) {
      overrides[collection] = {};
    }
    const value = variable.values[modeName];
    if (value !== undefined) {
      overrides[collection][variable.name] = String(value);
    }
  }

  return {
    theme_name: modeName.toLowerCase(),
    extends: baseTokenDocRef,
    attribute: `data-theme="${modeName.toLowerCase()}"`,
    overrides,
    css_output_path: 'src/lib/styles/tokens.css',
  };
}
