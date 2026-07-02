import { describe, it, expect } from 'vitest';
import { sanitizeFontValue } from '../fontSanitizer';
import { assertHelpUrl, HELP_BASE_URL } from '../helpUrls';

describe('sanitizeFontValue', () => {
  it('passes through safe font name', () => {
    expect(sanitizeFontValue('Inter Variable')).toBe('Inter Variable');
  });
  it('passes through font with quotes', () => {
    expect(sanitizeFontValue("'JetBrains Mono'")).toBe("'JetBrains Mono'");
  });
  it('strips semicolons', () => {
    expect(sanitizeFontValue('Comic Sans; } body{display:none')).not.toContain(';');
  });
  it('strips braces', () => {
    expect(sanitizeFontValue('Arial { color: red }')).not.toContain('{');
  });
  it('truncates at 128 chars', () => {
    expect(sanitizeFontValue('a'.repeat(200)).length).toBeLessThanOrEqual(128);
  });
  it('returns fallback for empty string', () => {
    expect(sanitizeFontValue('')).toBe('sans-serif');
  });
  it('returns fallback for all-stripped input', () => {
    expect(sanitizeFontValue(';;;{}')).toBe('sans-serif');
  });
  it('accepts custom fallback', () => {
    expect(sanitizeFontValue('', 'monospace')).toBe('monospace');
  });
});

describe('assertHelpUrl', () => {
  it('passes for URL starting with HELP_BASE_URL', () => {
    expect(() => assertHelpUrl(`${HELP_BASE_URL}/Getting-Started`)).not.toThrow();
  });
  it('throws for unrelated URL', () => {
    expect(() => assertHelpUrl('https://evil.example.com')).toThrow();
  });
  it('throws for empty string', () => {
    expect(() => assertHelpUrl('')).toThrow();
  });
  it('throws for URL that only contains HELP_BASE_URL as substring', () => {
    expect(() => assertHelpUrl(`https://evil.com?redirect=${HELP_BASE_URL}`)).toThrow();
  });
});
