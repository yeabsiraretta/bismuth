/**
 * LDA (Latent Dirichlet Allocation) — Gibbs sampling implementation.
 * Pure TypeScript, no external dependencies.
 *
 * Based on the collapsed Gibbs sampling algorithm for LDA:
 *   Griffiths & Steyvers (2004), "Finding Scientific Topics"
 */

import type { LdaConfig, Topic, TopicKeyword, TopicDocument, CorpusDocument } from '../types';

// ─── Vocabulary ────────────────────────────────────────────────────────────────

/** Build a vocabulary mapping from corpus tokens. */
export function buildVocabulary(documents: CorpusDocument[]): {
  vocab: string[];
  wordToIdx: Map<string, number>;
  docWordIndices: number[][];
} {
  const wordToIdx = new Map<string, number>();
  const vocab: string[] = [];

  for (const doc of documents) {
    for (const token of doc.tokens) {
      if (!wordToIdx.has(token)) {
        wordToIdx.set(token, vocab.length);
        vocab.push(token);
      }
    }
  }

  const docWordIndices = documents.map((doc) => doc.tokens.map((t) => wordToIdx.get(t)!));

  return { vocab, wordToIdx, docWordIndices };
}

// ─── Gibbs sampler ─────────────────────────────────────────────────────────────

interface LdaState {
  /** Topic assignment for each word in each document */
  z: number[][];
  /** Count of word w assigned to topic k: nw[k][w] */
  nw: number[][];
  /** Count of words assigned to topic k in doc d: nd[d][k] */
  nd: number[][];
  /** Total word count for topic k */
  nwSum: number[];
  /** Total word count for doc d */
  ndSum: number[];
}

/** Initialize LDA state with random topic assignments. */
export function initializeLda(docWordIndices: number[][], vocabSize: number, K: number): LdaState {
  const D = docWordIndices.length;
  const z: number[][] = [];
  const nw: number[][] = Array.from({ length: K }, () => new Array(vocabSize).fill(0));
  const nd: number[][] = Array.from({ length: D }, () => new Array(K).fill(0));
  const nwSum = new Array(K).fill(0);
  const ndSum = new Array(D).fill(0);

  for (let d = 0; d < D; d++) {
    const words = docWordIndices[d];
    z[d] = new Array(words.length);
    for (let n = 0; n < words.length; n++) {
      const topic = Math.floor(Math.random() * K);
      z[d][n] = topic;
      nw[topic][words[n]]++;
      nd[d][topic]++;
      nwSum[topic]++;
      ndSum[d]++;
    }
  }

  return { z, nw, nd, nwSum, ndSum };
}

/** Run one Gibbs sampling iteration. */
export function gibbsIteration(
  state: LdaState,
  docWordIndices: number[][],
  vocabSize: number,
  K: number,
  alpha: number,
  beta: number
): void {
  const betaSum = beta * vocabSize;
  const D = docWordIndices.length;

  for (let d = 0; d < D; d++) {
    const words = docWordIndices[d];
    for (let n = 0; n < words.length; n++) {
      const w = words[n];
      const oldTopic = state.z[d][n];

      // Decrement counts
      state.nw[oldTopic][w]--;
      state.nd[d][oldTopic]--;
      state.nwSum[oldTopic]--;

      // Compute probabilities for each topic
      const probs = new Array(K);
      let probSum = 0;
      for (let k = 0; k < K; k++) {
        const p = ((state.nw[k][w] + beta) / (state.nwSum[k] + betaSum)) * (state.nd[d][k] + alpha);
        probs[k] = p;
        probSum += p;
      }

      // Sample new topic
      let r = Math.random() * probSum;
      let newTopic = 0;
      for (let k = 0; k < K; k++) {
        r -= probs[k];
        if (r <= 0) {
          newTopic = k;
          break;
        }
      }

      // Increment counts
      state.z[d][n] = newTopic;
      state.nw[newTopic][w]++;
      state.nd[d][newTopic]++;
      state.nwSum[newTopic]++;
    }
  }
}

// ─── Topic extraction ──────────────────────────────────────────────────────────

/** Extract topic-word distributions from LDA state. */
export function extractTopics(
  state: LdaState,
  vocab: string[],
  documents: CorpusDocument[],
  config: LdaConfig
): Topic[] {
  const K = config.numTopics;
  const topics: Topic[] = [];

  for (let k = 0; k < K; k++) {
    // Top words
    const wordWeights: Array<{ idx: number; weight: number }> = [];
    const topicTotal = state.nwSum[k] || 1;
    for (let w = 0; w < vocab.length; w++) {
      if (state.nw[k][w] > 0) {
        wordWeights.push({ idx: w, weight: state.nw[k][w] / topicTotal });
      }
    }
    wordWeights.sort((a, b) => b.weight - a.weight);

    const keywords: TopicKeyword[] = wordWeights
      .slice(0, config.numWords)
      .map((ww) => ({ word: vocab[ww.idx], weight: ww.weight }));

    // Document relevance
    const docs: TopicDocument[] = [];
    for (let d = 0; d < documents.length; d++) {
      const docTotal = state.ndSum[d] || 1;
      const probability = state.nd[d][k] / docTotal;
      if (probability > 0) {
        docs.push({
          path: documents[d].path,
          title: documents[d].title,
          probability,
        });
      }
    }
    docs.sort((a, b) => b.probability - a.probability);

    const label = keywords
      .slice(0, 3)
      .map((kw) => kw.word)
      .join(', ');
    topics.push({ id: k, label, keywords, documents: docs });
  }

  return topics;
}

// ─── Main LDA runner ───────────────────────────────────────────────────────────

/** Run LDA on a corpus of documents. */
export function runLda(documents: CorpusDocument[], config: LdaConfig): Topic[] {
  if (documents.length === 0) return [];

  const { vocab, docWordIndices } = buildVocabulary(documents);
  if (vocab.length === 0) return [];

  const K = Math.min(config.numTopics, documents.length);
  const state = initializeLda(docWordIndices, vocab.length, K);

  // Gibbs sampling
  for (let i = 0; i < config.iterations; i++) {
    gibbsIteration(state, docWordIndices, vocab.length, K, config.alpha, config.beta);
  }

  return extractTopics(state, vocab, documents, { ...config, numTopics: K });
}
