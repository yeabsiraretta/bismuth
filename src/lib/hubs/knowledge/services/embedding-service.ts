/**
 * Embedding Service — lightweight TF-IDF vectorization + cosine similarity.
 *
 * Zero-setup, local, private. No API keys. No external dependencies.
 * Uses Term Frequency–Inverse Document Frequency (TF-IDF) to create
 * semantic vectors, then cosine similarity to rank relatedness.
 *
 * Architecture note: designed for drop-in replacement with a real
 * local embedding model (e.g. transformers.js / ONNX) in the future.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmbeddingVector {
  terms: Map<string, number>;
  magnitude: number;
}

export interface EmbeddingIndex {
  vectors: Map<string, EmbeddingVector>;
  idf: Map<string, number>;
  docCount: number;
}

// ── Text preprocessing ───────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'it',
  'as',
  'be',
  'was',
  'are',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'its',
  'our',
  'their',
  'what',
  'which',
  'who',
  'whom',
  'when',
  'where',
  'why',
  'how',
  'not',
  'no',
  'nor',
  'if',
  'then',
  'else',
  'so',
  'up',
  'out',
  'just',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'each',
  'all',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'than',
  'too',
  'very',
  'also',
  'here',
  'there',
  'again',
  'once',
  'only',
  'own',
  'same',
  'over',
  'any',
]);

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n?/;
const MARKDOWN_SYNTAX_RE = /[#*_`~[\]()>!|\\]/g;
const LINK_RE = /\[\[([^\]]+)\]\]/g;
const URL_RE = /https?:\/\/\S+/g;
const CODE_BLOCK_RE = /```[\s\S]*?```/g;

export function tokenize(text: string): string[] {
  let cleaned = text.replace(FRONTMATTER_RE, '');
  cleaned = cleaned.replace(CODE_BLOCK_RE, '');
  cleaned = cleaned.replace(URL_RE, '');
  cleaned = cleaned.replace(LINK_RE, '$1');
  cleaned = cleaned.replace(MARKDOWN_SYNTAX_RE, ' ');

  return cleaned
    .toLowerCase()
    .split(/[\s/\-_.,;:!?()[\]{}<>'"=+|\\@#$%^&*~`]+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

// ── Term frequency ───────────────────────────────────────────────────────────

export function computeTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  if (tokens.length > 0) {
    for (const [term, count] of tf) {
      tf.set(term, count / tokens.length);
    }
  }
  return tf;
}

// ── IDF computation ──────────────────────────────────────────────────────────

export function computeIDF(documents: Map<string, number>[]): Map<string, number> {
  const docCount = documents.length;
  const df = new Map<string, number>();

  for (const tf of documents) {
    for (const term of tf.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((docCount + 1) / (count + 1)) + 1);
  }

  return idf;
}

// ── TF-IDF vector ────────────────────────────────────────────────────────────

export function buildTFIDFVector(
  tf: Map<string, number>,
  idf: Map<string, number>
): EmbeddingVector {
  const terms = new Map<string, number>();
  let sumSq = 0;

  for (const [term, freq] of tf) {
    const idfVal = idf.get(term) ?? 1;
    const weight = freq * idfVal;
    terms.set(term, weight);
    sumSq += weight * weight;
  }

  return { terms, magnitude: Math.sqrt(sumSq) };
}

// ── Cosine similarity ────────────────────────────────────────────────────────

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.magnitude === 0 || b.magnitude === 0) return 0;

  let dotProduct = 0;
  const [smaller, larger] = a.terms.size <= b.terms.size ? [a, b] : [b, a];

  for (const [term, weightA] of smaller.terms) {
    const weightB = larger.terms.get(term);
    if (weightB !== undefined) {
      dotProduct += weightA * weightB;
    }
  }

  return dotProduct / (a.magnitude * b.magnitude);
}

// ── Full index builder ───────────────────────────────────────────────────────

export function buildEmbeddingIndex(documents: { id: string; content: string }[]): EmbeddingIndex {
  const tokenized = documents.map((doc) => ({
    id: doc.id,
    tf: computeTermFrequency(tokenize(doc.content)),
  }));

  const idf = computeIDF(tokenized.map((t) => t.tf));

  const vectors = new Map<string, EmbeddingVector>();
  for (const { id, tf } of tokenized) {
    vectors.set(id, buildTFIDFVector(tf, idf));
  }

  return { vectors, idf, docCount: documents.length };
}

// ── Similarity search ────────────────────────────────────────────────────────

export interface SimilarityResult {
  id: string;
  score: number;
}

export function findSimilar(
  index: EmbeddingIndex,
  targetId: string,
  limit = 20,
  minScore = 0.05
): SimilarityResult[] {
  const target = index.vectors.get(targetId);
  if (!target) return [];

  const results: SimilarityResult[] = [];

  for (const [id, vector] of index.vectors) {
    if (id === targetId) continue;
    const score = cosineSimilarity(target, vector);
    if (score >= minScore) {
      results.push({ id, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function findSimilarToText(
  index: EmbeddingIndex,
  text: string,
  limit = 20,
  minScore = 0.05
): SimilarityResult[] {
  const tokens = tokenize(text);
  const tf = computeTermFrequency(tokens);
  const queryVector = buildTFIDFVector(tf, index.idf);

  const results: SimilarityResult[] = [];

  for (const [id, vector] of index.vectors) {
    const score = cosineSimilarity(queryVector, vector);
    if (score >= minScore) {
      results.push({ id, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
