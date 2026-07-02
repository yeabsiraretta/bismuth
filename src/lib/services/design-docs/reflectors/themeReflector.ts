/**
 * Theme Reflector — parses tokens.css dark mode variables into a ThemePayload.
 */

import type { ThemePayload } from '@/types/design-documents/theme';

/** Parse tokens.css and extract dark theme overrides from [data-theme="dark"] block. */
export function reflectThemeFromCSS(cssContent: string): ThemePayload | null {
  const darkBlock = extractDarkBlock(cssContent);
  if (!darkBlock) return null;

  const overrides = parseDarkOverrides(darkBlock);
  if (Object.keys(overrides).length === 0) return null;

  return {
    theme_name: 'dark',
    extends: 'tokens.json',
    attribute: 'data-theme="dark"',
    overrides,
    css_output_path: 'src/lib/styles/tokens.css',
  };
}

/** Extract the [data-theme="dark"] CSS block content. */
function extractDarkBlock(content: string): string | null {
  const regex = /\[data-theme="dark"\]\s*\{([^}]+)\}/;
  const match = content.match(regex);
  return match?.[1] || null;
}

/** Parse CSS custom properties from a dark theme block into grouped overrides. */
function parseDarkOverrides(block: string): Record<string, Record<string, string>> {
  const overrides: Record<string, Record<string, string>> = {};
  const lines = block.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*--([\w-]+):\s*(.+?)\s*;/);
    if (!match) continue;

    const [, varName, value] = match;
    const group = inferGroup(varName);

    if (!overrides[group]) {
      overrides[group] = {};
    }
    overrides[group][varName] = value;
  }

  return overrides;
}

/** Infer the grouping category from a variable name. */
function inferGroup(varName: string): string {
  if (varName.startsWith('color-')) return 'colors';
  if (varName.startsWith('surface-')) return 'colors';
  if (varName.startsWith('text-')) return 'colors';
  if (varName.startsWith('shadow-')) return 'shadows';
  if (varName.startsWith('border-')) return 'borders';
  return 'misc';
}
