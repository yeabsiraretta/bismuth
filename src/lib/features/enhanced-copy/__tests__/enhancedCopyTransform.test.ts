import { describe, it, expect } from 'vitest';
import {
  transformLinks,
  transformFootnotes,
  transformCallouts,
  removeHighlights,
  convertWikilinks,
  convertTabsToSpaces,
  addStrictLineBreaks,
  applyRegexRules,
  enhancedCopyTransform,
} from '../services/enhancedCopyTransform';
import type { EnhancedCopyConfig } from '../types';
import { DEFAULT_ENHANCED_COPY_CONFIG } from '../types';

describe('transformLinks', () => {
  it('keeps links when mode is keep', () => {
    const text = '[click here](https://example.com)';
    expect(transformLinks(text, 'keep')).toBe(text);
  });

  it('removes all links', () => {
    expect(transformLinks('[click](https://example.com)', 'remove-all')).toBe('click');
  });

  it('removes all links including internal', () => {
    expect(transformLinks('[note](my-note)', 'remove-all')).toBe('note');
  });

  it('removes only internal links', () => {
    const text = '[note](my-note) and [site](https://example.com)';
    expect(transformLinks(text, 'remove-internal')).toBe('note and [site](https://example.com)');
  });

  it('handles multiple links', () => {
    const text = '[a](x) [b](https://b.com) [c](y)';
    expect(transformLinks(text, 'remove-internal')).toBe('a [b](https://b.com) c');
  });
});

describe('transformFootnotes', () => {
  it('keeps footnotes when mode is keep', () => {
    const text = 'Some text[[1]](#fn-1-abc)';
    expect(transformFootnotes(text, 'keep')).toBe(text);
  });

  it('removes all footnote references', () => {
    const text = 'Some text[[1]](#fn-1-abc) more[[2]](#fn-2-def)';
    expect(transformFootnotes(text, 'remove')).toBe('Some text more');
  });

  it('removes standard footnote refs', () => {
    expect(transformFootnotes('text[^1] more[^2]', 'remove')).toBe('text more');
  });

  it('formats footnotes to [^N] style', () => {
    const text = 'Some text[[1]](#fn-1-abc)';
    expect(transformFootnotes(text, 'format')).toBe('Some text[^1]');
  });

  it('formats multiple footnotes with sequential numbering', () => {
    const text = 'A[[1]](#fn-1-abc) B[[2]](#fn-2-def)';
    expect(transformFootnotes(text, 'format')).toBe('A[^1] B[^2]');
  });
});

describe('transformCallouts', () => {
  it('keeps callouts when mode is keep', () => {
    const text = '> [!info] Important note';
    expect(transformCallouts(text, 'keep')).toBe(text);
  });

  it('converts type to strong', () => {
    expect(transformCallouts('> [!info] Important note', 'type-to-strong'))
      .toBe('> **Info** Important note');
  });

  it('converts type to strong without title', () => {
    expect(transformCallouts('> [!warning]', 'type-to-strong'))
      .toBe('> **Warning**');
  });

  it('strips type to plain blockquote', () => {
    expect(transformCallouts('> [!info] Important note', 'blockquote'))
      .toBe('> Important note');
  });

  it('strips type to plain blockquote without title', () => {
    expect(transformCallouts('> [!note]', 'blockquote'))
      .toBe('>');
  });

  it('handles multiple callouts', () => {
    const text = '> [!info] A\n> [!warning] B';
    expect(transformCallouts(text, 'type-to-strong'))
      .toBe('> **Info** A\n> **Warning** B');
  });
});

describe('removeHighlights', () => {
  it('strips highlight marks', () => {
    expect(removeHighlights('Some ==highlighted== text')).toBe('Some highlighted text');
  });

  it('handles multiple highlights', () => {
    expect(removeHighlights('==a== and ==b==')).toBe('a and b');
  });

  it('leaves text without highlights unchanged', () => {
    expect(removeHighlights('no highlights here')).toBe('no highlights here');
  });
});

describe('convertWikilinks', () => {
  it('converts simple wikilink', () => {
    expect(convertWikilinks('See [[My Note]]')).toBe('See [My Note](My Note)');
  });

  it('converts wikilink with alias', () => {
    expect(convertWikilinks('See [[My Note|click here]]')).toBe('See [click here](My Note)');
  });

  it('handles multiple wikilinks', () => {
    expect(convertWikilinks('[[A]] and [[B|link]]')).toBe('[A](A) and [link](B)');
  });
});

describe('convertTabsToSpaces', () => {
  it('converts tabs with default size', () => {
    expect(convertTabsToSpaces('\tindented', 4)).toBe('    indented');
  });

  it('converts with size 2', () => {
    expect(convertTabsToSpaces('\tindented', 2)).toBe('  indented');
  });

  it('converts multiple tabs', () => {
    expect(convertTabsToSpaces('\t\tdeep', 4)).toBe('        deep');
  });
});

describe('addStrictLineBreaks', () => {
  it('adds trailing spaces before newlines', () => {
    expect(addStrictLineBreaks('line1\nline2')).toBe('line1  \nline2');
  });

  it('does not double-add spaces', () => {
    expect(addStrictLineBreaks('line1  \nline2')).toBe('line1  \nline2');
  });
});

describe('applyRegexRules', () => {
  it('applies a simple replacement', () => {
    expect(applyRegexRules('hello world', [{ pattern: 'world', flags: '', replacement: 'there' }]))
      .toBe('hello there');
  });

  it('applies global flag', () => {
    expect(applyRegexRules('a b a', [{ pattern: 'a', flags: 'g', replacement: 'x' }]))
      .toBe('x b x');
  });

  it('skips invalid regex', () => {
    expect(applyRegexRules('text', [{ pattern: '(invalid', flags: '', replacement: '' }]))
      .toBe('text');
  });

  it('applies multiple rules in order', () => {
    const rules = [
      { pattern: 'a', flags: 'g', replacement: 'b' },
      { pattern: 'b', flags: 'g', replacement: 'c' },
    ];
    expect(applyRegexRules('a', rules)).toBe('c');
  });
});

describe('enhancedCopyTransform', () => {
  it('returns unchanged text with default config', () => {
    const config = { ...DEFAULT_ENHANCED_COPY_CONFIG };
    const text = 'Hello **world**';
    expect(enhancedCopyTransform(text, config)).toBe(text);
  });

  it('applies wikilink conversion + link removal', () => {
    const config: EnhancedCopyConfig = {
      ...DEFAULT_ENHANCED_COPY_CONFIG,
      convertWikilinks: true,
      linkMode: 'remove-all',
    };
    expect(enhancedCopyTransform('See [[My Note]]', config)).toBe('See My Note');
  });

  it('applies all transforms in order', () => {
    const config: EnhancedCopyConfig = {
      ...DEFAULT_ENHANCED_COPY_CONFIG,
      convertWikilinks: true,
      linkMode: 'remove-all',
      removeHighlightMarks: true,
      calloutMode: 'type-to-strong',
      tabToSpaces: true,
      tabSize: 2,
    };
    const input = '[[Note]] ==highlight==\n> [!info] Title\n\tindented';
    const result = enhancedCopyTransform(input, config);
    expect(result).toContain('Note');
    expect(result).toContain('highlight');
    expect(result).toContain('**Info**');
    expect(result).not.toContain('==');
    expect(result).not.toContain('\t');
  });

  it('applies regex rules last', () => {
    const config: EnhancedCopyConfig = {
      ...DEFAULT_ENHANCED_COPY_CONFIG,
      regexRules: [{ pattern: 'foo', flags: 'g', replacement: 'bar' }],
    };
    expect(enhancedCopyTransform('foo baz foo', config)).toBe('bar baz bar');
  });
});
