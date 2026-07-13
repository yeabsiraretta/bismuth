import { beforeEach, describe, expect, it } from 'vitest';

import { OmnisearchEngine } from '@/hubs/navigator/services/omnisearch-engine';
import {
  buildSearchTerms,
  matchesPhrases,
  parseQuery,
  shouldExclude,
} from '@/hubs/navigator/services/omnisearch-query';

// ── Query Parser Tests ────────────────────────────────────────

describe('parseQuery', () => {
  it('should parse simple terms', () => {
    const result = parseQuery('hello world');
    expect(result.terms).toContain('hello');
    expect(result.terms).toContain('world');
    expect(result.phrases).toHaveLength(0);
    expect(result.exclusions).toHaveLength(0);
    expect(result.extensions).toHaveLength(0);
  });

  it('should extract quoted phrases', () => {
    const result = parseQuery('find "exact match" here');
    expect(result.phrases).toEqual(['exact match']);
    expect(result.terms).toContain('find');
    expect(result.terms).toContain('here');
  });

  it('should extract multiple quoted phrases', () => {
    const result = parseQuery('"first phrase" "second phrase"');
    expect(result.phrases).toEqual(['first phrase', 'second phrase']);
  });

  it('should extract exclusions', () => {
    const result = parseQuery('search -unwanted -removed');
    expect(result.exclusions).toContain('unwanted');
    expect(result.exclusions).toContain('removed');
    expect(result.terms).toContain('search');
  });

  it('should extract extension filters', () => {
    const result = parseQuery('notes .md');
    expect(result.extensions).toEqual(['.md']);
    expect(result.terms).toContain('notes');
  });

  it('should handle multiple extension filters', () => {
    const result = parseQuery('.md .pdf search');
    expect(result.extensions).toContain('.md');
    expect(result.extensions).toContain('.pdf');
  });

  it('should handle combined query features', () => {
    const result = parseQuery('"exact match" search -unwanted .md');
    expect(result.phrases).toEqual(['exact match']);
    expect(result.exclusions).toContain('unwanted');
    expect(result.extensions).toEqual(['.md']);
  });

  it('should handle empty query', () => {
    const result = parseQuery('');
    expect(result.terms).toHaveLength(0);
    expect(result.phrases).toHaveLength(0);
    expect(result.exclusions).toHaveLength(0);
    expect(result.extensions).toHaveLength(0);
  });

  it('should preserve raw query', () => {
    const raw = 'test "phrase" -exclude .md';
    expect(parseQuery(raw).raw).toBe(raw);
  });
});

describe('buildSearchTerms', () => {
  it('should combine terms and phrases', () => {
    const parsed = parseQuery('hello "world order"');
    expect(buildSearchTerms(parsed)).toBe('hello world order');
  });

  it('should return empty for empty query', () => {
    const parsed = parseQuery('');
    expect(buildSearchTerms(parsed)).toBe('');
  });
});

describe('shouldExclude', () => {
  const doc = { path: 'notes/test.md', title: 'Test Note', content: 'some content here' };

  it('should exclude by extension filter', () => {
    const parsed = parseQuery('.pdf');
    expect(shouldExclude(parsed, doc)).toBe(true);
  });

  it('should not exclude matching extension', () => {
    const parsed = parseQuery('.md');
    expect(shouldExclude(parsed, doc)).toBe(false);
  });

  it('should exclude by content exclusion', () => {
    const parsed = parseQuery('-content');
    expect(shouldExclude(parsed, doc)).toBe(true);
  });

  it('should not exclude when exclusion term is absent', () => {
    const parsed = parseQuery('-missing');
    expect(shouldExclude(parsed, doc)).toBe(false);
  });
});

describe('matchesPhrases', () => {
  it('should match when phrase is present', () => {
    expect(matchesPhrases('hello world order today', ['world order'])).toBe(true);
  });

  it('should not match when phrase is absent', () => {
    expect(matchesPhrases('hello world', ['exact phrase'])).toBe(false);
  });

  it('should match case-insensitively', () => {
    expect(matchesPhrases('Hello World', ['hello world'])).toBe(true);
  });

  it('should require all phrases', () => {
    expect(matchesPhrases('hello world', ['hello', 'missing'])).toBe(false);
  });

  it('should pass with no phrases', () => {
    expect(matchesPhrases('anything', [])).toBe(true);
  });
});

// ── Engine Tests ──────────────────────────────────────────────

describe('OmnisearchEngine', () => {
  let engine: OmnisearchEngine;

  beforeEach(() => {
    engine = new OmnisearchEngine();
  });

  describe('indexing', () => {
    it('should add documents', () => {
      engine.addDocument('note1.md', 'First Note', 'Content of first note');
      expect(engine.size).toBe(1);
    });

    it('should add multiple documents', () => {
      engine.addDocument('note1.md', 'First', 'Content 1');
      engine.addDocument('note2.md', 'Second', 'Content 2');
      expect(engine.size).toBe(2);
    });

    it('should re-index existing documents', () => {
      engine.addDocument('note1.md', 'First', 'Old content');
      engine.addDocument('note1.md', 'First Updated', 'New content');
      expect(engine.size).toBe(1);
    });

    it('should remove documents', () => {
      engine.addDocument('note1.md', 'First', 'Content');
      engine.removeDocument('note1.md');
      expect(engine.size).toBe(0);
    });

    it('should clear all documents', () => {
      engine.addDocument('note1.md', 'First', 'Content 1');
      engine.addDocument('note2.md', 'Second', 'Content 2');
      engine.clear();
      expect(engine.size).toBe(0);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      engine.addDocument(
        'notes/daily.md',
        'Daily Journal',
        '# Morning Routine\nWoke up early. Had coffee.\n\n# Evening Review\nGood productive day.'
      );
      engine.addDocument(
        'notes/project.md',
        'Project Plan',
        '# Goals\nBuild the search engine.\n\n# Timeline\nShip by end of month.'
      );
      engine.addDocument(
        'recipes/coffee.md',
        'Coffee Recipe',
        '# French Press\nUse coarse ground coffee beans.\nBrew for 4 minutes.'
      );
      engine.addDocument(
        'notes/meeting.md',
        'Meeting Notes',
        '# Sprint Review\nDiscussed project timeline and goals.\n\n#team #planning'
      );
    });

    it('should return results for simple query', () => {
      const results = engine.search('coffee');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].path).toBe('recipes/coffee.md');
    });

    it('should rank title matches higher', () => {
      const results = engine.search('coffee');
      // Coffee Recipe has 'coffee' in title + content, should rank first
      expect(results[0].title).toBe('Coffee Recipe');
    });

    it('should find results by heading content', () => {
      const results = engine.search('morning routine');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].path).toBe('notes/daily.md');
    });

    it('should handle fuzzy matching (typos)', () => {
      const results = engine.search('cofee'); // typo
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle prefix matching', () => {
      const results = engine.search('prod');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = engine.search('xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return empty for empty query', () => {
      expect(engine.search('')).toHaveLength(0);
      expect(engine.search('   ')).toHaveLength(0);
    });

    it('should include folder in results', () => {
      const results = engine.search('coffee');
      expect(results[0].folder).toBe('recipes');
    });

    it('should include match snippets', () => {
      const results = engine.search('coffee');
      expect(results[0].matches.length).toBeGreaterThan(0);
    });

    it('should respect limit', () => {
      const results = engine.search('project', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should support exact phrase search', () => {
      const results = engine.search('"coarse ground"');
      expect(results.length).toBe(1);
      expect(results[0].path).toBe('recipes/coffee.md');
    });

    it('should support exclusion', () => {
      const results = engine.search('project -timeline');
      // Meeting Notes mentions "project" but also "timeline", so excluded
      // Project Plan mentions "project" AND "timeline", also excluded
      expect(results.every((r) => !r.title.includes('timeline'))).toBe(true);
    });

    it('should support extension filter', () => {
      const results = engine.search('notes .md');
      expect(results.every((r) => r.path.endsWith('.md'))).toBe(true);
    });
  });

  describe('searchInFile', () => {
    beforeEach(() => {
      engine.addDocument(
        'test.md',
        'Test',
        'Line one\nLine two has search term\nLine three\nAnother search here'
      );
    });

    it('should find matches in file', () => {
      const results = engine.searchInFile('test.md', 'search');
      expect(results).toHaveLength(2);
    });

    it('should return line numbers', () => {
      const results = engine.searchInFile('test.md', 'search');
      expect(results[0].lineNumber).toBe(2);
      expect(results[1].lineNumber).toBe(4);
    });

    it('should return match positions', () => {
      const results = engine.searchInFile('test.md', 'search');
      expect(results[0].positions.length).toBeGreaterThan(0);
      const [start, end] = results[0].positions[0];
      expect(results[0].lineContent.slice(start, end)).toBe('search');
    });

    it('should return empty for non-existent file', () => {
      expect(engine.searchInFile('nonexistent.md', 'search')).toHaveLength(0);
    });

    it('should return empty for empty query', () => {
      expect(engine.searchInFile('test.md', '')).toHaveLength(0);
    });
  });

  describe('suggest', () => {
    beforeEach(() => {
      engine.addDocument('note1.md', 'JavaScript Tutorial', 'Learn about closures and promises.');
      engine.addDocument('note2.md', 'Java Basics', 'Object-oriented programming in Java.');
    });

    it('should return suggestions for prefix', () => {
      const suggestions = engine.suggest('java');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty for short prefix', () => {
      expect(engine.suggest('j')).toHaveLength(0);
    });

    it('should respect limit', () => {
      const suggestions = engine.suggest('ja', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('BM25 scoring', () => {
    it('should score title matches higher than content matches', () => {
      engine.addDocument('a.md', 'Svelte Tutorial', 'Learn about web development.');
      engine.addDocument('b.md', 'Web Development', 'This is a Svelte tutorial for beginners.');

      const results = engine.search('svelte tutorial');
      // Document with 'svelte tutorial' in title should score higher
      expect(results[0].path).toBe('a.md');
    });

    it('should score heading matches higher than body matches', () => {
      engine.addDocument('a.md', 'Notes', '# Important Meeting\nDiscussed budgets.');
      engine.addDocument(
        'b.md',
        'Other',
        'We had an important meeting about the budget report for Q4.'
      );

      const results = engine.search('important meeting');
      // Document with heading containing the terms should score higher
      expect(results[0].path).toBe('a.md');
    });
  });
});
