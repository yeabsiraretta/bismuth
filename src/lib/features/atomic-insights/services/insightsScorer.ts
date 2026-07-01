/**
 * Insights Scorer — combines the Adamic-Adar graph score with
 * optional context signals: time proximity, shared metadata, edit recency.
 */

import type { InsightWeights, RelatedNote, InsightReason } from '../types';
import type { AaCandidate } from './adamicAdar';

/** Metadata used for context scoring. */
export interface NoteContext {
  path: string;
  label: string;
  tags?: string[];
  createdAt?: number;
  modifiedAt?: number;
}

/**
 * Compute a time proximity score (0–1) based on creation timestamps.
 * Notes created within 7 days score high; beyond 365 days score near 0.
 */
export function timeProximityScore(timestampA: number, timestampB: number): number {
  const diffMs = Math.abs(timestampA - timestampB);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 1.0;
  if (diffDays >= 365) return 0;
  return Math.max(0, 1 - Math.log10(diffDays) / Math.log10(365));
}

/**
 * Compute edit-time proximity score (0–1) based on modification timestamps.
 */
export function editTimeScore(modA: number, modB: number): number {
  return timeProximityScore(modA, modB);
}

/**
 * Compute metadata overlap score (0–1) based on shared tags.
 * Uses Jaccard similarity: |intersection| / |union|.
 */
export function metadataScore(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 && tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Score and rank candidates by combining AA graph score with context signals.
 */
export function scoreAndRank(
  candidates: AaCandidate[],
  targetContext: NoteContext,
  candidateContexts: Map<string, NoteContext>,
  weights: InsightWeights,
  labels: Map<string, string>,
): RelatedNote[] {
  if (candidates.length === 0) return [];

  // Normalize AA scores to [0, 1]
  const maxAa = Math.max(...candidates.map(c => c.aaScore), 0.001);

  const results: RelatedNote[] = [];

  for (const candidate of candidates) {
    const ctx = candidateContexts.get(candidate.nodeId);
    const reasons: InsightReason[] = ['graph'];
    let total = (candidate.aaScore / maxAa) * weights.graph;

    if (ctx) {
      // Time proximity
      if (weights.time > 0 && targetContext.createdAt && ctx.createdAt) {
        const ts = timeProximityScore(targetContext.createdAt, ctx.createdAt);
        if (ts > 0.1) {
          total += ts * weights.time;
          reasons.push('time');
        }
      }

      // Metadata overlap
      if (weights.metadata > 0 && targetContext.tags?.length && ctx.tags?.length) {
        const ms = metadataScore(targetContext.tags, ctx.tags);
        if (ms > 0) {
          total += ms * weights.metadata;
          reasons.push('metadata');
        }
      }

      // Edit-time proximity
      if (weights.editTime > 0 && targetContext.modifiedAt && ctx.modifiedAt) {
        const es = editTimeScore(targetContext.modifiedAt, ctx.modifiedAt);
        if (es > 0.1) {
          total += es * weights.editTime;
          reasons.push('edit-time');
        }
      }
    }

    results.push({
      path: candidate.nodeId,
      label: labels.get(candidate.nodeId) ?? candidate.nodeId.split('/').pop()?.replace(/\.md$/i, '') ?? candidate.nodeId,
      score: Math.round(total * 100) / 100,
      reasons,
      commonNeighbors: candidate.commonNeighbors,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
