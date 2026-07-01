/**
 * T007: Extended sanitize.ts branch coverage.
 * Supplements existing sanitize tests in components/docs/__tests__/sanitize.test.ts
 * with additional branches for data: URLs, form/meta/link tags, and null-like input.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from '@/features/canvas/utils/sanitize';

describe('sanitizeMarkdown — extended branch coverage', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeMarkdown('')).toBe('');
  });

  it('returns empty string for falsy null-like coercion (undefined cast)', () => {
    // The guard is `if (!input) return ''` — falsy strings hit this path
    expect(sanitizeMarkdown(null as unknown as string)).toBe('');
    expect(sanitizeMarkdown(undefined as unknown as string)).toBe('');
  });

  it('strips <form> tags', () => {
    const input = '<form action="/submit"><input type="text"></form>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<form');
    expect(result).not.toContain('</form>');
  });

  it('strips self-closing <meta> tags', () => {
    const input = '<meta http-equiv="refresh" content="0; url=https://evil.com" />';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<meta');
  });

  it('strips <link> tags', () => {
    const input = '<link rel="stylesheet" href="https://evil.com/evil.css">';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<link');
  });

  it('strips data: text/html src URLs', () => {
    const input = '<img src="data: text/html,<script>alert(1)</script>">';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('data:');
  });

  it('strips data:text/html (no space) src URLs', () => {
    const input = '<iframe src="data:text/html,<h1>hi</h1>"></iframe>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('data:text/html');
  });

  it('strips event handler with single-quoted value', () => {
    const input = "<div onclick='doEvil()'>click me</div>";
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('onclick');
  });

  it('strips event handler with unquoted value', () => {
    const input = '<div onmouseover=doEvil()>hover me</div>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('onmouseover');
  });

  it('strips javascript: href in single quotes', () => {
    const input = "<a href='javascript:void(0)'>link</a>";
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('javascript:');
  });

  it('preserves unrelated attributes like class and id', () => {
    const input = '<p class="highlight" id="intro">Hello</p>';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('handles multiple dangerous elements in sequence', () => {
    const input = [
      '<script>x=1</script>',
      '<iframe src="evil"></iframe>',
      '<p>safe content</p>',
      '<object>bad</object>',
    ].join('');
    const result = sanitizeMarkdown(input);
    expect(result).toBe('<p>safe content</p>');
  });

  it('handles mixed content with safe markdown-like text', () => {
    const input = '## Heading\n\nSome text with **bold** and _italic_.\n\n<script>bad()</script>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('## Heading');
    expect(result).toContain('**bold**');
  });
});
