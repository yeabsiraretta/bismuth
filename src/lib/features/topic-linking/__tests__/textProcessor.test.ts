import { describe, it, expect } from 'vitest';
import {
  stem,
  stripMarkdown,
  tokenize,
  sampleTokens,
  extractTags,
  extractUrls,
  buildDocument,
  matchesPattern,
  matchesTags,
} from '../services/textProcessor';
import { DEFAULT_SAMPLING_CONFIG } from '../types';

describe('stem', () => {
  it('strips plural s', () => expect(stem('cats')).toBe('cat'));
  it('strips -ing', () => expect(stem('running')).toBe('runn'));
  it('strips -ed', () => expect(stem('walked')).toBe('walk'));
  it('strips -ness', () => expect(stem('darkness')).toBe('dark'));
  it('strips -ation', () => expect(stem('information')).toBe('inform'));
  it('keeps short words', () => expect(stem('be')).toBe('be'));
  it('handles -ies', () => expect(stem('cities')).toBe('citi'));
  it('handles -sses', () => expect(stem('grasses')).toBe('grass'));
});

describe('stripMarkdown', () => {
  it('strips frontmatter', () => {
    expect(stripMarkdown('---\ntitle: foo\n---\nHello')).toBe('Hello');
  });

  it('strips code blocks', () => {
    expect(stripMarkdown('```js\ncode\n```\nText')).toBe('\nText');
  });

  it('converts wikilinks to text', () => {
    expect(stripMarkdown('Link to [[My Note]]')).toContain('My Note');
    expect(stripMarkdown('[[Note|Alias]]')).toContain('Alias');
  });

  it('strips heading markers', () => {
    expect(stripMarkdown('## Heading')).toBe('Heading');
  });

  it('strips tags', () => {
    expect(stripMarkdown('Text #tag here')).toBe('Text  here');
  });
});

describe('tokenize', () => {
  it('tokenizes into lowercase words', () => {
    const tokens = tokenize('Hello World Test');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
    expect(tokens).toContain('test');
  });

  it('removes stopwords', () => {
    const tokens = tokenize('The quick brown fox and the lazy dog');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
    expect(tokens).toContain('quick');
  });

  it('removes short words', () => {
    const tokens = tokenize('It is a no go');
    expect(tokens).toHaveLength(0);
  });

  it('applies stemming when enabled', () => {
    const tokens = tokenize('running cats walking', true);
    expect(tokens).toContain('runn');
    expect(tokens).toContain('cat');
    expect(tokens).toContain('walk');
  });

  it('removes numeric tokens', () => {
    const tokens = tokenize('chapter 123 test');
    expect(tokens).not.toContain('123');
    expect(tokens).toContain('chapter');
  });
});

describe('sampleTokens', () => {
  const tokens = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

  it('returns all tokens when no sampling', () => {
    expect(sampleTokens(tokens, DEFAULT_SAMPLING_CONFIG)).toEqual(tokens);
  });

  it('samples fixed word count', () => {
    const result = sampleTokens(tokens, { ...DEFAULT_SAMPLING_CONFIG, fixedWordCount: 3 });
    expect(result).toHaveLength(3);
  });

  it('samples percentage of text', () => {
    const result = sampleTokens(tokens, { ...DEFAULT_SAMPLING_CONFIG, percentageOfText: 40 });
    expect(result).toHaveLength(2);
  });

  it('returns random sample when randomise is true', () => {
    const result = sampleTokens(tokens, { ...DEFAULT_SAMPLING_CONFIG, fixedWordCount: 3, randomise: true });
    expect(result).toHaveLength(3);
    // All sampled tokens must come from the original
    for (const t of result) expect(tokens).toContain(t);
  });

  it('handles empty tokens', () => {
    expect(sampleTokens([], DEFAULT_SAMPLING_CONFIG)).toEqual([]);
  });
});

describe('extractTags', () => {
  it('extracts inline tags', () => {
    const tags = extractTags('Hello #world #test content');
    expect(tags).toContain('world');
    expect(tags).toContain('test');
  });

  it('extracts nested tags', () => {
    const tags = extractTags('#parent/child');
    expect(tags).toContain('parent/child');
  });

  it('returns empty for no tags', () => {
    expect(extractTags('No tags here')).toEqual([]);
  });
});

describe('extractUrls', () => {
  it('extracts markdown links', () => {
    const urls = extractUrls('[Google](https://google.com)');
    expect(urls).toHaveLength(1);
    expect(urls[0].url).toBe('https://google.com');
    expect(urls[0].displayText).toBe('Google');
  });

  it('extracts bare URLs', () => {
    const urls = extractUrls('Visit https://example.com today');
    expect(urls).toHaveLength(1);
    expect(urls[0].url).toBe('https://example.com');
  });

  it('deduplicates markdown + bare', () => {
    const urls = extractUrls('[Link](https://test.com) https://test.com');
    expect(urls).toHaveLength(1);
  });

  it('returns empty for no urls', () => {
    expect(extractUrls('No URLs')).toEqual([]);
  });
});

describe('buildDocument', () => {
  it('creates a corpus document', () => {
    const doc = buildDocument('folder/My Note.md', '# Title\n\nSome content with #tag', DEFAULT_SAMPLING_CONFIG);
    expect(doc.path).toBe('folder/My Note.md');
    expect(doc.title).toBe('My Note');
    expect(doc.tags).toContain('tag');
    expect(doc.tokens.length).toBeGreaterThan(0);
  });
});

describe('matchesPattern', () => {
  it('matches substring', () => {
    expect(matchesPattern('Generated/Data Analysis.md', 'Generated/Data')).toBe(true);
  });

  it('matches with wildcard', () => {
    expect(matchesPattern('Generated/Data Analysis.md', 'Generated/*Analysis')).toBe(true);
  });

  it('rejects non-matching', () => {
    expect(matchesPattern('Other/File.md', 'Generated/Data')).toBe(false);
  });

  it('matches everything when empty', () => {
    expect(matchesPattern('any/path.md', '')).toBe(true);
  });
});

describe('matchesTags', () => {
  it('matches any tag', () => {
    expect(matchesTags(['fashion', 'data'], 'fashion')).toBe(true);
  });

  it('handles # prefix', () => {
    expect(matchesTags(['fashion'], '#fashion')).toBe(true);
  });

  it('matches space-separated tags', () => {
    expect(matchesTags(['data'], '#fashion #data')).toBe(true);
  });

  it('rejects when no match', () => {
    expect(matchesTags(['other'], '#fashion')).toBe(false);
  });

  it('matches everything when empty', () => {
    expect(matchesTags([], '')).toBe(true);
  });
});
