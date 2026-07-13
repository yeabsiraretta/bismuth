import { describe, expect, it } from 'vitest';

import {
  addStrictLineBreaks,
  convertTabsToSpaces,
  convertWikilinks,
  DEFAULT_ENHANCED_COPY_CONFIG,
  enhancedCopyTransform,
  removeHighlights,
  transformCallouts,
  transformFootnotes,
  transformLinks,
} from '@/hubs/editor/services/enhanced-copy';

describe('transformLinks', () => {
  it('keeps links in keep mode', () => {
    expect(transformLinks('[text](url)', 'keep')).toBe('[text](url)');
  });

  it('removes all links', () => {
    expect(transformLinks('[click](https://x.com)', 'remove-all')).toBe('click');
    expect(transformLinks('[note](other.md)', 'remove-all')).toBe('note');
  });

  it('removes only internal links', () => {
    expect(transformLinks('[click](https://x.com)', 'remove-internal')).toBe(
      '[click](https://x.com)'
    );
    expect(transformLinks('[note](other.md)', 'remove-internal')).toBe('note');
  });
});

describe('transformFootnotes', () => {
  it('keeps in keep mode', () => {
    expect(transformFootnotes('Text [^1]', 'keep')).toBe('Text [^1]');
  });

  it('removes footnote refs and defs', () => {
    const input = 'Text [^1] more\n\n[^1]: detail';
    const result = transformFootnotes(input, 'remove');
    expect(result).not.toContain('[^1]');
    expect(result).not.toContain('[^1]: detail');
  });
});

describe('transformCallouts', () => {
  it('keeps callouts in keep mode', () => {
    const input = '> [!note] Title';
    expect(transformCallouts(input, 'keep')).toBe(input);
  });

  it('converts type to strong', () => {
    expect(transformCallouts('> [!warning] Be careful', 'type-to-strong')).toBe(
      '> **Warning** Be careful'
    );
  });

  it('strips type in blockquote mode', () => {
    expect(transformCallouts('> [!tip] Helpful', 'blockquote')).toBe('> Helpful');
  });

  it('handles callout without title', () => {
    expect(transformCallouts('> [!info]', 'type-to-strong')).toBe('> **Info**');
    expect(transformCallouts('> [!info]', 'blockquote')).toBe('>');
  });
});

describe('removeHighlights', () => {
  it('strips highlight marks', () => {
    expect(removeHighlights('Some ==highlighted== text')).toBe('Some highlighted text');
  });

  it('handles multiple highlights', () => {
    expect(removeHighlights('==a== and ==b==')).toBe('a and b');
  });
});

describe('convertWikilinks', () => {
  it('converts simple wikilinks', () => {
    expect(convertWikilinks('See [[Note Name]]')).toBe('See [Note Name](Note Name)');
  });

  it('converts aliased wikilinks', () => {
    expect(convertWikilinks('See [[Target|Display]]')).toBe('See [Display](Target)');
  });

  it('handles multiple wikilinks', () => {
    expect(convertWikilinks('[[A]] and [[B|b]]')).toBe('[A](A) and [b](B)');
  });
});

describe('convertTabsToSpaces', () => {
  it('converts tabs', () => {
    expect(convertTabsToSpaces('\tindented', 4)).toBe('    indented');
    expect(convertTabsToSpaces('\tindented', 2)).toBe('  indented');
  });
});

describe('addStrictLineBreaks', () => {
  it('adds trailing spaces before newlines', () => {
    expect(addStrictLineBreaks('a\nb')).toBe('a  \nb');
  });

  it('does not double-add spaces', () => {
    expect(addStrictLineBreaks('a  \nb')).toBe('a  \nb');
  });
});

describe('enhancedCopyTransform', () => {
  it('applies full pipeline with defaults', () => {
    const input = '[[Note]] text';
    const result = enhancedCopyTransform(input, DEFAULT_ENHANCED_COPY_CONFIG);
    expect(result).toBe('[Note](Note) text');
  });

  it('applies all transforms when configured', () => {
    const input = '> [!tip] Use ==this== and [[Note|link]]';
    const config = {
      ...DEFAULT_ENHANCED_COPY_CONFIG,
      calloutMode: 'type-to-strong' as const,
      removeHighlightMarks: true,
    };
    const result = enhancedCopyTransform(input, config);
    expect(result).toBe('> **Tip** Use this and [link](Note)');
  });
});
