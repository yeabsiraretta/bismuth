import { describe, it, expect } from 'vitest';
import {
  extractWikilinks, extractConcepts, conceptFrequencies,
  topConcepts, buildConceptGraph, buildMultiSourceGraph,
  splitParagraphs,
} from '../services/conceptExtractor';

describe('extractWikilinks', () => {
  it('extracts simple wikilinks', () => {
    expect(extractWikilinks('See [[Note A]] and [[Note B]]')).toEqual(['Note A', 'Note B']);
  });

  it('handles aliased links', () => {
    expect(extractWikilinks('[[Real|Display]]')).toEqual(['Real']);
  });

  it('returns empty for no links', () => {
    expect(extractWikilinks('Plain text')).toEqual([]);
  });
});

describe('extractConcepts', () => {
  it('extracts meaningful words, skips stopwords', () => {
    const concepts = extractConcepts('The mitochondria is the powerhouse of the cell');
    expect(concepts).toContain('mitochondria');
    expect(concepts).toContain('powerhouse');
    expect(concepts).toContain('cell');
    expect(concepts).not.toContain('the');
    expect(concepts).not.toContain('is');
  });

  it('strips markdown formatting', () => {
    const concepts = extractConcepts('**Bold** and *italic* words');
    expect(concepts).toContain('bold');
    expect(concepts).toContain('italic');
    expect(concepts).toContain('words');
  });

  it('removes code blocks', () => {
    const concepts = extractConcepts('Text\n```js\ncode here\n```\nMore text');
    expect(concepts).not.toContain('code');
    expect(concepts).toContain('text');
  });

  it('removes wikilinks (handled separately)', () => {
    const concepts = extractConcepts('See [[Important Note]] for details');
    expect(concepts).not.toContain('important');
    expect(concepts).toContain('see');
    expect(concepts).toContain('details');
  });

  it('filters short words', () => {
    const concepts = extractConcepts('I am a go to it');
    expect(concepts.length).toBe(0);
  });

  it('removes frontmatter', () => {
    const concepts = extractConcepts('---\ntitle: Test\n---\nActual content here');
    expect(concepts).not.toContain('title');
    expect(concepts).toContain('actual');
    expect(concepts).toContain('content');
  });
});

describe('conceptFrequencies', () => {
  it('counts occurrences', () => {
    const freq = conceptFrequencies(['alpha', 'beta', 'alpha', 'alpha', 'beta']);
    expect(freq.get('alpha')).toBe(3);
    expect(freq.get('beta')).toBe(2);
  });
});

describe('topConcepts', () => {
  it('returns top N by frequency', () => {
    const freq = new Map([['a', 10], ['b', 5], ['c', 20], ['d', 1]]);
    expect(topConcepts(freq, 2)).toEqual(['c', 'a']);
  });
});

describe('splitParagraphs', () => {
  it('splits on double newlines', () => {
    const paras = splitParagraphs('Para one [[A]]\n\nPara two [[B]]', 'wikilinks-and-concepts');
    expect(paras.length).toBe(2);
    expect(paras[0].wikilinks).toEqual(['A']);
    expect(paras[1].wikilinks).toEqual(['B']);
  });

  it('extracts concepts in wikilinks-and-concepts mode', () => {
    const paras = splitParagraphs('Mitochondria generate energy', 'wikilinks-and-concepts');
    expect(paras[0].concepts.length).toBeGreaterThan(0);
  });

  it('skips concepts in wikilinks-only mode', () => {
    const paras = splitParagraphs('Mitochondria generate energy', 'wikilinks-only');
    expect(paras[0].concepts.length).toBe(0);
  });
});

describe('buildConceptGraph', () => {
  it('builds nodes and edges from content', () => {
    const content = '[[Note A]] and [[Note B]] are related.\n\n[[Note C]] is separate.';
    const { nodes, edges } = buildConceptGraph(content, 'wikilinks-only', 'paragraph');
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    // Note A and Note B should be connected (same paragraph)
    const hasAB = edges.some(e =>
      (e.from === 'Note A' && e.to === 'Note B') ||
      (e.from === 'Note B' && e.to === 'Note A'),
    );
    expect(hasAB).toBe(true);
  });

  it('includes concept nodes in concepts mode', () => {
    const content = 'Mitochondria generate energy through ATP synthesis. [[Cell Biology]]';
    const { nodes } = buildConceptGraph(content, 'wikilinks-and-concepts', 'paragraph');
    const conceptNodes = nodes.filter(n => n.id.startsWith('concept:'));
    expect(conceptNodes.length).toBeGreaterThan(0);
  });

  it('page mode connects all items', () => {
    const content = '[[A]] first paragraph\n\n[[B]] second paragraph';
    const { edges } = buildConceptGraph(content, 'wikilinks-only', 'page');
    const hasAB = edges.some(e =>
      (e.from === 'A' && e.to === 'B') || (e.from === 'B' && e.to === 'A'),
    );
    expect(hasAB).toBe(true);
  });
});

describe('buildMultiSourceGraph', () => {
  it('merges concept graphs from multiple files', () => {
    const sources = [
      { path: 'a.md', content: '[[Shared]] and [[OnlyA]]' },
      { path: 'b.md', content: '[[Shared]] and [[OnlyB]]' },
    ];
    const result = buildMultiSourceGraph(sources, 'wikilinks-only', 'paragraph');
    expect(result.nodes.find(n => n.id === 'Shared')).toBeDefined();
    expect(result.nodes.find(n => n.id === 'OnlyA')).toBeDefined();
    expect(result.nodes.find(n => n.id === 'OnlyB')).toBeDefined();
    expect(result.edges.length).toBeGreaterThanOrEqual(0);
  });
});
