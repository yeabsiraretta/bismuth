import { describe, it, expect } from 'vitest';
import {
  buildVocabulary,
  initializeLda,
  gibbsIteration,
  runLda,
  extractTopics,
} from '../services/ldaService';
import type { CorpusDocument, LdaConfig } from '../types';
import { DEFAULT_LDA_CONFIG } from '../types';

function makeDoc(path: string, tokens: string[]): CorpusDocument {
  return { path, title: path.replace('.md', ''), content: '', tokens, tags: [] };
}

describe('buildVocabulary', () => {
  it('builds vocab and word indices', () => {
    const docs = [
      makeDoc('a.md', ['cat', 'dog', 'cat']),
      makeDoc('b.md', ['dog', 'bird']),
    ];
    const { vocab, wordToIdx, docWordIndices } = buildVocabulary(docs);

    expect(vocab).toContain('cat');
    expect(vocab).toContain('dog');
    expect(vocab).toContain('bird');
    expect(vocab).toHaveLength(3);
    expect(wordToIdx.get('cat')).toBeDefined();
    expect(docWordIndices).toHaveLength(2);
    expect(docWordIndices[0]).toHaveLength(3);
  });

  it('handles empty documents', () => {
    const { vocab } = buildVocabulary([makeDoc('a.md', [])]);
    expect(vocab).toHaveLength(0);
  });
});

describe('initializeLda', () => {
  it('initializes state correctly', () => {
    const docs = [makeDoc('a.md', ['x', 'y']), makeDoc('b.md', ['y', 'z'])];
    const { docWordIndices } = buildVocabulary(docs);
    const state = initializeLda(docWordIndices, 3, 2);

    expect(state.z).toHaveLength(2);
    expect(state.nw).toHaveLength(2);
    expect(state.nd).toHaveLength(2);
    expect(state.nwSum).toHaveLength(2);
    expect(state.ndSum).toHaveLength(2);
    // All word counts should sum correctly
    expect(state.ndSum[0]).toBe(2);
    expect(state.ndSum[1]).toBe(2);
  });
});

describe('gibbsIteration', () => {
  it('runs without error', () => {
    const docs = [makeDoc('a.md', ['x', 'y', 'z']), makeDoc('b.md', ['x', 'y'])];
    const { docWordIndices } = buildVocabulary(docs);
    const state = initializeLda(docWordIndices, 3, 2);

    expect(() => {
      gibbsIteration(state, docWordIndices, 3, 2, 0.1, 0.01);
    }).not.toThrow();

    // Counts should still be consistent
    expect(state.ndSum[0]).toBe(3);
    expect(state.ndSum[1]).toBe(2);
  });
});

describe('extractTopics', () => {
  it('extracts topics with keywords and documents', () => {
    const docs = [
      makeDoc('a.md', ['machine', 'learning', 'data']),
      makeDoc('b.md', ['deep', 'learning', 'neural']),
    ];
    const { vocab, docWordIndices } = buildVocabulary(docs);
    const state = initializeLda(docWordIndices, vocab.length, 2);

    // Run a few iterations for stability
    for (let i = 0; i < 10; i++) {
      gibbsIteration(state, docWordIndices, vocab.length, 2, 0.1, 0.01);
    }

    const topics = extractTopics(state, vocab, docs, { ...DEFAULT_LDA_CONFIG, numTopics: 2 });

    expect(topics).toHaveLength(2);
    for (const topic of topics) {
      expect(topic.keywords.length).toBeGreaterThan(0);
      expect(topic.documents.length).toBeGreaterThan(0);
      expect(topic.label).toBeTruthy();
    }
  });
});

describe('runLda', () => {
  const config: LdaConfig = {
    ...DEFAULT_LDA_CONFIG,
    numTopics: 3,
    numWords: 5,
    iterations: 20,
    burnIn: 0,
    thin: 1,
  };

  it('produces topics from corpus', () => {
    const docs = [
      makeDoc('science.md', ['quantum', 'physics', 'particle', 'energy', 'quantum', 'physics']),
      makeDoc('cooking.md', ['recipe', 'flour', 'sugar', 'butter', 'recipe', 'flour']),
      makeDoc('sports.md', ['football', 'goal', 'player', 'match', 'football', 'goal']),
      makeDoc('physics2.md', ['energy', 'particle', 'quantum', 'wave', 'energy']),
      makeDoc('baking.md', ['sugar', 'flour', 'recipe', 'oven', 'sugar']),
    ];

    const topics = runLda(docs, config);
    expect(topics).toHaveLength(3);
    for (const topic of topics) {
      expect(topic.keywords.length).toBeLessThanOrEqual(5);
      expect(topic.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles empty corpus', () => {
    expect(runLda([], config)).toEqual([]);
  });

  it('handles single document', () => {
    const docs = [makeDoc('a.md', ['word', 'another', 'word'])];
    const topics = runLda(docs, { ...config, numTopics: 1 });
    expect(topics).toHaveLength(1);
  });

  it('caps topics at document count', () => {
    const docs = [makeDoc('a.md', ['word', 'test'])];
    const topics = runLda(docs, { ...config, numTopics: 10 });
    expect(topics.length).toBeLessThanOrEqual(1);
  });
});
