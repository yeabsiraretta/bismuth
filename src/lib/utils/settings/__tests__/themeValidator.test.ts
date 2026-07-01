import { describe, it, expect } from 'vitest';
import { THEME_TOKEN_ALLOWLIST, isThemeValueSafe, validateThemeManifest } from '../themeValidator';
import type { ThemeManifest } from '../themeValidator';

const validManifest: ThemeManifest = {
  name: 'My Theme',
  author: 'Alice',
  version: '1.0.0',
  tokens: {
    '--color-bg': '#ffffff',
    '--text-normal': '#111111',
  },
};

describe('isThemeValueSafe', () => {
  it('accepts safe hex color', () => expect(isThemeValueSafe('#dc2626')).toBe(true));
  it('accepts safe rgb()', () => expect(isThemeValueSafe('rgb(220, 38, 38)')).toBe(true));
  it('accepts named color', () => expect(isThemeValueSafe('crimson')).toBe(true));
  it('accepts spacing value', () => expect(isThemeValueSafe('8px')).toBe(true));
  it('rejects url() injection', () => expect(isThemeValueSafe("url('evil')")).toBe(false));
  it('rejects expression() injection', () =>
    expect(isThemeValueSafe('expression(alert(1))')).toBe(false));
  it('rejects @ character', () => expect(isThemeValueSafe('@import evil')).toBe(false));
  it('rejects semicolon', () => expect(isThemeValueSafe('#fff; body{display:none}')).toBe(false));
  it('rejects backslash', () => expect(isThemeValueSafe('\\0041')).toBe(false));
  it('rejects javascript: URI', () => expect(isThemeValueSafe('javascript:alert(1)')).toBe(false));
  it('rejects empty string', () => expect(isThemeValueSafe('')).toBe(false));
  it('rejects value over 256 chars', () => expect(isThemeValueSafe('a'.repeat(257))).toBe(false));
});

describe('THEME_TOKEN_ALLOWLIST', () => {
  it('contains --color-bg', () => expect(THEME_TOKEN_ALLOWLIST.has('--color-bg')).toBe(true));
  it('contains --interactive-accent', () =>
    expect(THEME_TOKEN_ALLOWLIST.has('--interactive-accent')).toBe(true));
  it('does not contain --font-size', () =>
    expect(THEME_TOKEN_ALLOWLIST.has('--font-size')).toBe(false));
  it('does not contain arbitrary key', () =>
    expect(THEME_TOKEN_ALLOWLIST.has('--evil-injection')).toBe(false));
});

describe('validateThemeManifest', () => {
  it('accepts a valid manifest', () => expect(validateThemeManifest(validManifest)).toBe(true));

  it('rejects missing name', () => {
    expect(validateThemeManifest({ ...validManifest, name: '' })).toBe(false);
  });

  it('rejects missing author', () => {
    expect(validateThemeManifest({ ...validManifest, author: undefined })).toBe(false);
  });

  it('rejects non-object tokens', () => {
    expect(validateThemeManifest({ ...validManifest, tokens: 'bad' })).toBe(false);
  });

  it('rejects token with unknown key', () => {
    expect(
      validateThemeManifest({
        ...validManifest,
        tokens: { '--unknown-prop': '#fff' },
      })
    ).toBe(false);
  });

  it('rejects token with unsafe value', () => {
    expect(
      validateThemeManifest({
        ...validManifest,
        tokens: { '--color-bg': "url('evil')" },
      })
    ).toBe(false);
  });

  it('rejects null input', () => expect(validateThemeManifest(null)).toBe(false));
  it('rejects array input', () => expect(validateThemeManifest([])).toBe(false));
  it('rejects primitive input', () => expect(validateThemeManifest('string')).toBe(false));
});
