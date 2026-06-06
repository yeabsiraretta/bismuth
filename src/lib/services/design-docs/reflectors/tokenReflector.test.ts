/**
 * Unit tests for token reflector — parses CSS custom properties into TokenPayload.
 */

import { describe, it, expect } from 'vitest';
import { reflectTokensFromCSS } from './tokenReflector';

const sampleCSS = `
:root {
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --space-m: 16px;
  --space-l: 24px;
  --font-family: 'Inter', sans-serif;
  --radius-m: 8px;
}
`;

describe('reflectTokensFromCSS', () => {
  it('extracts tokens grouped by prefix-based collections', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const names = result.collections.map((c) => c.name);
    expect(names).toContain('colors');
    expect(names).toContain('spacing');
    expect(names).toContain('typography');
    expect(names).toContain('radius');
  });

  it('assigns correct token count per collection', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const colors = result.collections.find((c) => c.name === 'colors');
    expect(colors?.tokens).toHaveLength(2);
    const spacing = result.collections.find((c) => c.name === 'spacing');
    expect(spacing?.tokens).toHaveLength(2);
  });

  it('preserves css_var reference', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const colors = result.collections.find((c) => c.name === 'colors')!;
    expect(colors.tokens[0].css_var).toBe('--color-primary');
  });

  it('infers color type for hex values', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const colors = result.collections.find((c) => c.name === 'colors')!;
    expect(colors.tokens[0].type).toBe('color');
  });

  it('infers number type for spacing values', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const spacing = result.collections.find((c) => c.name === 'spacing')!;
    expect(spacing.tokens[0].type).toBe('number');
  });

  it('stores value in default mode', () => {
    const result = reflectTokensFromCSS(sampleCSS);
    const colors = result.collections.find((c) => c.name === 'colors')!;
    expect(colors.tokens[0].values.default).toBe('#3b82f6');
  });

  it('returns empty collections for empty CSS', () => {
    const result = reflectTokensFromCSS('');
    expect(result.collections).toHaveLength(0);
  });

  it('ignores non-custom-property lines', () => {
    const css = `
      .class { color: red; }
      /* comment */
      --color-test: blue;
    `;
    const result = reflectTokensFromCSS(css);
    expect(result.collections).toHaveLength(1);
  });
});
