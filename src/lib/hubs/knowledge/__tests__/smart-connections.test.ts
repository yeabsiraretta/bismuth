import { describe, expect, it } from 'vitest';

import {
  buildEmbeddingIndex,
  buildTFIDFVector,
  computeIDF,
  computeTermFrequency,
  cosineSimilarity,
  findSimilar,
  findSimilarToText,
  tokenize,
} from '@/hubs/knowledge/services/embedding-service';

// ── tokenize ─────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('tokenizes basic text', () => {
    const tokens = tokenize('Machine learning algorithms process data');
    expect(tokens).toContain('machine');
    expect(tokens).toContain('learning');
    expect(tokens).toContain('algorithms');
    expect(tokens).toContain('process');
    expect(tokens).toContain('data');
  });

  it('removes stop words', () => {
    const tokens = tokenize('This is a test of the system');
    expect(tokens).not.toContain('this');
    expect(tokens).not.toContain('is');
    expect(tokens).not.toContain('a');
    expect(tokens).not.toContain('of');
    expect(tokens).not.toContain('the');
    expect(tokens).toContain('test');
    expect(tokens).toContain('system');
  });

  it('removes frontmatter', () => {
    const content = '---\ntitle: Test\ntags: [a, b]\n---\nActual content here';
    const tokens = tokenize(content);
    expect(tokens).not.toContain('title');
    expect(tokens).toContain('actual');
    expect(tokens).toContain('content');
  });

  it('removes code blocks', () => {
    const content = 'Some text\n```js\nconsole.log("hello");\n```\nMore text';
    const tokens = tokenize(content);
    expect(tokens).not.toContain('console');
    expect(tokens).toContain('text');
  });

  it('extracts wikilink text', () => {
    const content = 'See [[Machine Learning]] for details';
    const tokens = tokenize(content);
    expect(tokens).toContain('machine');
    expect(tokens).toContain('learning');
  });

  it('removes URLs', () => {
    const tokens = tokenize('Visit https://example.com for info');
    expect(tokens).not.toContain('https');
    expect(tokens).not.toContain('example');
  });

  it('removes single-character tokens', () => {
    const tokens = tokenize('A B C test');
    expect(tokens).toEqual(['test']);
  });

  it('removes pure numeric tokens', () => {
    const tokens = tokenize('The year 2024 was notable');
    expect(tokens).not.toContain('2024');
    expect(tokens).toContain('year');
    expect(tokens).toContain('notable');
  });
});

// ── computeTermFrequency ─────────────────────────────────────────────────────

describe('computeTermFrequency', () => {
  it('computes normalized frequencies', () => {
    const tf = computeTermFrequency(['apple', 'banana', 'apple', 'cherry']);
    expect(tf.get('apple')).toBe(2 / 4);
    expect(tf.get('banana')).toBe(1 / 4);
    expect(tf.get('cherry')).toBe(1 / 4);
  });

  it('returns empty map for empty input', () => {
    const tf = computeTermFrequency([]);
    expect(tf.size).toBe(0);
  });
});

// ── computeIDF ───────────────────────────────────────────────────────────────

describe('computeIDF', () => {
  it('computes inverse document frequency', () => {
    const docs = [
      new Map([
        ['apple', 1],
        ['banana', 1],
      ]),
      new Map([
        ['apple', 1],
        ['cherry', 1],
      ]),
      new Map([
        ['banana', 1],
        ['cherry', 1],
      ]),
    ];
    const idf = computeIDF(docs);
    expect(idf.get('apple')).toBeDefined();
    expect(idf.get('banana')).toBeDefined();
    expect(idf.get('cherry')).toBeDefined();
    // All terms appear in 2 of 3 docs, so IDF should be equal
    expect(idf.get('apple')).toBe(idf.get('banana'));
  });

  it('gives higher IDF to rare terms', () => {
    const docs = [
      new Map([
        ['common', 1],
        ['rare', 1],
      ]),
      new Map([['common', 1]]),
      new Map([['common', 1]]),
    ];
    const idf = computeIDF(docs);
    expect(idf.get('rare')!).toBeGreaterThan(idf.get('common')!);
  });
});

// ── cosineSimilarity ─────────────────────────────────────────────────────────

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const idf = new Map([
      ['a', 1],
      ['b', 1],
    ]);
    const tf = new Map([
      ['a', 0.5],
      ['b', 0.5],
    ]);
    const vec = buildTFIDFVector(tf, idf);
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const idf = new Map([
      ['a', 1],
      ['b', 1],
    ]);
    const v1 = buildTFIDFVector(new Map([['a', 1]]), idf);
    const v2 = buildTFIDFVector(new Map([['b', 1]]), idf);
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });

  it('returns 0 for empty vectors', () => {
    const v1 = { terms: new Map(), magnitude: 0 };
    const v2 = { terms: new Map([['a', 1]]), magnitude: 1 };
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const idf = new Map([
      ['a', 1],
      ['b', 1],
      ['c', 1],
    ]);
    const v1 = buildTFIDFVector(
      new Map([
        ['a', 0.5],
        ['b', 0.5],
      ]),
      idf
    );
    const v2 = buildTFIDFVector(
      new Map([
        ['b', 0.5],
        ['c', 0.5],
      ]),
      idf
    );
    const sim = cosineSimilarity(v1, v2);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
});

// ── buildEmbeddingIndex + findSimilar ────────────────────────────────────────

describe('buildEmbeddingIndex', () => {
  const docs = [
    {
      id: 'ml.md',
      content:
        'Machine learning neural networks deep learning AI artificial intelligence training models',
    },
    {
      id: 'nlp.md',
      content: 'Natural language processing text mining NLP machine learning models tokens',
    },
    {
      id: 'cooking.md',
      content: 'Italian pasta recipe tomato sauce basil garlic olive oil parmesan cheese',
    },
    {
      id: 'baking.md',
      content: 'Chocolate cake recipe flour sugar butter eggs vanilla frosting dessert',
    },
    {
      id: 'physics.md',
      content: 'Quantum mechanics particles wave function Schrödinger equation energy states',
    },
  ];

  it('builds index with correct document count', () => {
    const index = buildEmbeddingIndex(docs);
    expect(index.docCount).toBe(5);
    expect(index.vectors.size).toBe(5);
  });

  it('finds related documents', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilar(index, 'ml.md', 5, 0.01);
    expect(results.length).toBeGreaterThan(0);
    // NLP should be more similar to ML than cooking
    const nlpResult = results.find((r) => r.id === 'nlp.md');
    const cookingResult = results.find((r) => r.id === 'cooking.md');
    if (nlpResult && cookingResult) {
      expect(nlpResult.score).toBeGreaterThan(cookingResult.score);
    }
  });

  it('cooking and baking are more related than cooking and physics', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilar(index, 'cooking.md', 5, 0.01);
    const bakingResult = results.find((r) => r.id === 'baking.md');
    const physicsResult = results.find((r) => r.id === 'physics.md');
    if (bakingResult && physicsResult) {
      expect(bakingResult.score).toBeGreaterThan(physicsResult.score);
    }
  });

  it('respects limit parameter', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilar(index, 'ml.md', 2, 0.01);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('respects minScore parameter', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilar(index, 'ml.md', 10, 0.99);
    // No document should have 99% similarity to ML
    expect(results.length).toBe(0);
  });

  it('returns empty for unknown document', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilar(index, 'nonexistent.md');
    expect(results).toEqual([]);
  });
});

// ── findSimilarToText ────────────────────────────────────────────────────────

describe('findSimilarToText', () => {
  const docs = [
    {
      id: 'ml.md',
      content:
        'Machine learning neural networks deep learning AI artificial intelligence training models',
    },
    {
      id: 'nlp.md',
      content: 'Natural language processing text mining NLP machine learning models tokens',
    },
    {
      id: 'cooking.md',
      content: 'Italian pasta recipe tomato sauce basil garlic olive oil parmesan cheese',
    },
    {
      id: 'baking.md',
      content: 'Chocolate cake recipe flour sugar butter eggs vanilla frosting dessert',
    },
  ];

  it('finds documents matching a text query', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilarToText(index, 'machine learning models', 5, 0.01);
    expect(results.length).toBeGreaterThan(0);
    // ML and NLP should rank high
    const topIds = results.slice(0, 2).map((r) => r.id);
    expect(topIds).toContain('ml.md');
  });

  it('finds cooking-related documents for food query', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilarToText(index, 'pasta recipe sauce', 5, 0.01);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('cooking.md');
  });

  it('returns empty for irrelevant query', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilarToText(index, 'zyxwvutsrqp', 5, 0.01);
    expect(results).toEqual([]);
  });

  it('results are sorted by score descending', () => {
    const index = buildEmbeddingIndex(docs);
    const results = findSimilarToText(index, 'learning models training', 10, 0.01);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});
