import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../html';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes all special chars together', () => {
    expect(escapeHtml('<a href="x" onclick=\'alert(&)\'>')).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#039;alert(&amp;)&#039;&gt;'
    );
  });

  it('passes normal text through unchanged', () => {
    expect(escapeHtml('Hello world 123')).toBe('Hello world 123');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});
