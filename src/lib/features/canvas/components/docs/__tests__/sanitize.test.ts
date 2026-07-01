/**
 * T068: Markdown sanitization tests for documentation context (SC-02).
 */
import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from '@/features/canvas/utils/sanitize';

describe('sanitizeMarkdown (SC-02)', () => {
  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert(1)</script><p>World</p>';
    expect(sanitizeMarkdown(input)).toBe('<p>Hello</p><p>World</p>');
  });

  it('strips iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    expect(sanitizeMarkdown(input)).toBe('');
  });

  it('strips object and embed tags', () => {
    const input = '<object data="x"></object><embed src="y">';
    expect(sanitizeMarkdown(input)).toBe('');
  });

  it('strips event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('onerror');
  });

  it('strips javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('javascript:');
  });

  it('preserves safe Markdown/HTML', () => {
    const input = '<h1>Title</h1><p>Some <strong>bold</strong> text</p>';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('preserves code blocks', () => {
    const input = '<pre><code>const x = 1;</code></pre>';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('handles empty input', () => {
    expect(sanitizeMarkdown('')).toBe('');
  });

  it('handles nested dangerous tags', () => {
    const input = '<div><script><script>inner</script></script></div>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<script');
  });
});
