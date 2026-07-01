import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyThemeTokens, clearThemeTokens } from '../themeApplier';

// Mock log to avoid logger side effects
vi.mock('@/utils/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('themeApplier (T046)', () => {
  beforeEach(() => {
    // Clean up any properties set in prior tests
    document.documentElement.removeAttribute('style');
  });

  it('applies allowed token keys to CSS custom properties', () => {
    applyThemeTokens({ '--color-bg': '#ffffff', '--interactive-accent': '#dc2626' });
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#ffffff');
    expect(document.documentElement.style.getPropertyValue('--interactive-accent')).toBe('#dc2626');
  });

  it('skips unknown token keys without throwing', () => {
    expect(() => applyThemeTokens({ '--unknown-evil-key': '#fff' })).not.toThrow();
    expect(document.documentElement.style.getPropertyValue('--unknown-evil-key')).toBe('');
  });

  it('skips values with url() injection', () => {
    applyThemeTokens({ '--color-bg': "url('evil')" });
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('');
  });

  it('skips values with javascript: URI', () => {
    applyThemeTokens({ '--color-bg': 'javascript:alert(1)' });
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('');
  });

  it('applies multiple tokens in one call', () => {
    const tokens = { '--color-bg': '#111', '--text-normal': '#eee', '--border-color': '#333' };
    applyThemeTokens(tokens);
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#111');
    expect(document.documentElement.style.getPropertyValue('--text-normal')).toBe('#eee');
  });

  it('clearThemeTokens removes previously applied properties', () => {
    applyThemeTokens({ '--color-bg': '#ffffff' });
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#ffffff');
    clearThemeTokens({ '--color-bg': '#ffffff' });
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('');
  });
});
