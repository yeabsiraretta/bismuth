import { describe, it, expect } from 'vitest';
import {
  coerceValue,
  parseLineInlineFields,
  parseDocumentInlineFields,
  parseDocumentTasks,
} from '../inlineFieldParser';

describe('coerceValue', () => {
  it('returns null for empty strings', () => {
    expect(coerceValue('')).toBeNull();
    expect(coerceValue('null')).toBeNull();
  });

  it('parses booleans', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('false')).toBe(false);
  });

  it('parses numbers', () => {
    expect(coerceValue('42')).toBe(42);
    expect(coerceValue('3.14')).toBe(3.14);
    expect(coerceValue('-7')).toBe(-7);
  });

  it('parses ISO dates', () => {
    const v = coerceValue('2024-01-15');
    expect(v).toBeInstanceOf(Date);
  });

  it('parses wikilinks', () => {
    const v = coerceValue('[[My Note]]');
    expect(v).toEqual({ type: 'link', path: 'My Note', display: undefined });
  });

  it('parses wikilinks with display text', () => {
    const v = coerceValue('[[My Note|Display]]');
    expect(v).toEqual({ type: 'link', path: 'My Note', display: 'Display' });
  });

  it('parses comma-separated lists', () => {
    const v = coerceValue('alpha, beta, gamma');
    expect(v).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns plain string for non-special values', () => {
    expect(coerceValue('just a string')).toBe('just a string');
  });
});

describe('parseLineInlineFields', () => {
  it('parses full-line inline field', () => {
    const fields = parseLineInlineFields('Rating:: 8', 0);
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('Rating');
    expect(fields[0].value).toBe(8);
    expect(fields[0].source).toBe('inline');
  });

  it('parses bold key inline field', () => {
    const fields = parseLineInlineFields('**Rating**:: 8', 0);
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('Rating');
  });

  it('parses bracket inline fields', () => {
    const fields = parseLineInlineFields(
      'Some text [status:: active] more text [priority:: high]',
      0
    );
    expect(fields).toHaveLength(2);
    expect(fields[0].key).toBe('status');
    expect(fields[0].value).toBe('active');
    expect(fields[0].source).toBe('inline-bracket');
    expect(fields[1].key).toBe('priority');
    expect(fields[1].value).toBe('high');
  });

  it('parses paren inline fields (hidden)', () => {
    const fields = parseLineInlineFields('Hidden (key:: value) here', 0);
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('key');
    expect(fields[0].source).toBe('inline-paren');
  });

  it('tracks offsets correctly', () => {
    const fields = parseLineInlineFields('[foo:: bar]', 100);
    expect(fields[0].from).toBe(100);
    expect(fields[0].to).toBe(111);
  });
});

describe('parseDocumentInlineFields', () => {
  it('skips frontmatter', () => {
    const doc = `---\ntitle: Test\n---\nRating:: 9\n`;
    const fields = parseDocumentInlineFields(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('Rating');
    expect(fields[0].value).toBe(9);
  });

  it('skips fenced code blocks', () => {
    const doc = 'Normal:: 1\n```\nCode:: 2\n```\nAfter:: 3\n';
    const fields = parseDocumentInlineFields(doc);
    expect(fields).toHaveLength(2);
    expect(fields.map((f) => f.key)).toEqual(['Normal', 'After']);
  });

  it('handles empty document', () => {
    expect(parseDocumentInlineFields('')).toEqual([]);
  });
});

describe('parseDocumentTasks', () => {
  it('extracts unchecked tasks', () => {
    const tasks = parseDocumentTasks('- [ ] Buy milk\n- [ ] Clean house', 'test.md');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].text).toBe('Buy milk');
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].path).toBe('test.md');
  });

  it('extracts checked tasks', () => {
    const tasks = parseDocumentTasks('- [x] Done task', 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].completed).toBe(true);
  });

  it('extracts tags from task text', () => {
    const tasks = parseDocumentTasks('- [ ] Fix #bug and #urgent issue', 'test.md');
    expect(tasks[0].tags).toEqual(['bug', 'urgent']);
  });

  it('sets correct line numbers', () => {
    const tasks = parseDocumentTasks('# Title\n\n- [ ] First\n- [ ] Second', 'test.md');
    expect(tasks[0].line).toBe(3);
    expect(tasks[1].line).toBe(4);
  });
});
