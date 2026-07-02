/**
 * Tests for pasteUrlIntoSelection extension — URL detection and link building.
 */
import { describe, it, expect } from 'vitest';
import { isUrl, buildMarkdownLink } from '../pasteUrlIntoSelection';

describe('isUrl', () => {
  it('detects http URLs', () => {
    expect(isUrl('http://example.com')).toBe(true);
  });

  it('detects https URLs', () => {
    expect(isUrl('https://example.com/path?q=1&r=2#hash')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isUrl('hello world')).toBe(false);
  });

  it('rejects partial URLs', () => {
    expect(isUrl('example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isUrl('')).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isUrl('  https://example.com  ')).toBe(true);
  });

  it('rejects URLs with spaces', () => {
    expect(isUrl('https://example .com')).toBe(false);
  });

  it('rejects markdown links', () => {
    expect(isUrl('[text](https://example.com)')).toBe(false);
  });
});

describe('buildMarkdownLink', () => {
  it('wraps selected text with pasted URL', () => {
    const result = buildMarkdownLink('click here', 'https://example.com');
    expect(result).not.toBeNull();
    expect(result!.replacement).toBe('[click here](https://example.com)');
  });

  it('wraps selected URL with pasted text', () => {
    const result = buildMarkdownLink('https://example.com', 'My Link');
    expect(result).not.toBeNull();
    expect(result!.replacement).toBe('[My Link](https://example.com)');
  });

  it('returns null when both are plain text', () => {
    const result = buildMarkdownLink('hello', 'world');
    expect(result).toBeNull();
  });

  it('returns null when both are URLs', () => {
    const result = buildMarkdownLink('https://a.com', 'https://b.com');
    expect(result).toBeNull();
  });

  it('returns null when no selection', () => {
    const result = buildMarkdownLink('', 'https://example.com');
    expect(result).toBeNull();
  });

  it('returns null when clipboard is empty', () => {
    const result = buildMarkdownLink('some text', '');
    expect(result).toBeNull();
  });

  it('trims whitespace from URL', () => {
    const result = buildMarkdownLink('text', '  https://example.com  ');
    expect(result!.replacement).toBe('[text](https://example.com)');
  });

  it('preserves selected text with special characters', () => {
    const result = buildMarkdownLink('foo & bar', 'https://example.com');
    expect(result!.replacement).toBe('[foo & bar](https://example.com)');
  });

  it('cursor is placed at end of replacement', () => {
    const result = buildMarkdownLink('text', 'https://x.com');
    expect(result!.cursorOffset).toBe('[text](https://x.com)'.length);
  });
});
