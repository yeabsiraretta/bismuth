import { describe, it, expect } from 'vitest';
import { renderTemplate, sanitizeFilename } from '../services/templateEngine';

describe('renderTemplate', () => {
  it('substitutes simple variables', () => {
    expect(renderTemplate('Hello {{ name }}!', { name: 'World' })).toBe('Hello World!');
  });

  it('handles missing variables as empty', () => {
    expect(renderTemplate('{{ missing }}', {})).toBe('');
  });

  it('supports dot notation', () => {
    const ctx = { author: { name: 'Alice' } } as unknown as Record<string, string>;
    expect(renderTemplate('By {{ author.name }}', ctx)).toBe('By Alice');
  });

  it('applies upper filter', () => {
    expect(renderTemplate('{{ name | upper }}', { name: 'hello' })).toBe('HELLO');
  });

  it('applies lower filter', () => {
    expect(renderTemplate('{{ name | lower }}', { name: 'HELLO' })).toBe('hello');
  });

  it('applies capitalize filter', () => {
    expect(renderTemplate('{{ name | capitalize }}', { name: 'hello' })).toBe('Hello');
  });

  it('applies blockquote filter', () => {
    expect(renderTemplate('{{ text | blockquote }}', { text: 'line1\nline2' })).toBe('> line1\n> line2');
  });

  it('applies replace filter', () => {
    expect(renderTemplate('{{ text | replace(foo,bar) }}', { text: 'foo baz foo' })).toBe('bar baz bar');
  });

  it('applies numberLexify filter', () => {
    expect(renderTemplate('{{ count | numberLexify }}', { count: '1000000' })).toBe('1,000,000');
  });

  it('chains multiple filters', () => {
    expect(renderTemplate('{{ name | upper | replace(HELLO,HI) }}', { name: 'hello' })).toBe('HI');
  });

  it('renders multiple variables', () => {
    expect(renderTemplate('{{ a }} and {{ b }}', { a: 'X', b: 'Y' })).toBe('X and Y');
  });
});

describe('sanitizeFilename', () => {
  it('removes invalid characters', () => {
    expect(sanitizeFilename('file:name/with*chars')).toBe('filenamewithchars');
  });

  it('collapses whitespace', () => {
    expect(sanitizeFilename('too   many   spaces')).toBe('too many spaces');
  });

  it('truncates long names', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeFilename(long).length).toBe(200);
  });
});
