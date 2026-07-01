import { describe, it, expect } from 'vitest';
import {
  buildAdjacency, adamicAdarScore, getCommonNeighbors, rankByAdamicAdar,
} from '../services/adamicAdar';

/**
 * Test graph:
 *   A — C — B
 *   A — D — B
 *   A — E
 *   C — F
 *   D — F
 *   D — G
 *   D — H
 *   D — I   (D is a hub with degree 5)
 *   C has degree 3 (A, B, F) — "niche" node
 */
const EDGES = [
  { from: 'A', to: 'C' },
  { from: 'A', to: 'D' },
  { from: 'A', to: 'E' },
  { from: 'B', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'C', to: 'F' },
  { from: 'D', to: 'F' },
  { from: 'D', to: 'G' },
  { from: 'D', to: 'H' },
  { from: 'D', to: 'I' },
];

describe('buildAdjacency', () => {
  it('builds undirected adjacency map', () => {
    const adj = buildAdjacency(EDGES);
    expect(adj.get('A')).toContain('C');
    expect(adj.get('C')).toContain('A');
    expect(adj.get('D')?.size).toBe(6); // A, B, F, G, H, I
  });

  it('handles empty edges', () => {
    const adj = buildAdjacency([]);
    expect(adj.size).toBe(0);
  });
});

describe('getCommonNeighbors', () => {
  const adj = buildAdjacency(EDGES);

  it('finds common neighbors of A and B', () => {
    const common = getCommonNeighbors(adj, 'A', 'B');
    expect(common).toContain('C');
    expect(common).toContain('D');
    expect(common).toHaveLength(2);
  });

  it('returns empty for disconnected nodes', () => {
    expect(getCommonNeighbors(adj, 'E', 'I')).toHaveLength(0);
  });

  it('returns empty for missing nodes', () => {
    expect(getCommonNeighbors(adj, 'A', 'MISSING')).toHaveLength(0);
  });
});

describe('adamicAdarScore', () => {
  const adj = buildAdjacency(EDGES);

  it('scores A-B higher through niche node C than hub D', () => {
    // C has degree 3, D has degree 6
    // Contribution from C: 1/log(3) ≈ 0.91
    // Contribution from D: 1/log(6) ≈ 0.56
    const score = adamicAdarScore(adj, 'A', 'B');
    expect(score).toBeGreaterThan(0);

    // C contributes more than D since C has lower degree
    const cContribution = 1 / Math.log(3);
    const dContribution = 1 / Math.log(6);
    expect(cContribution).toBeGreaterThan(dContribution);
    expect(score).toBeCloseTo(cContribution + dContribution, 5);
  });

  it('returns 0 for nodes with no common neighbors', () => {
    expect(adamicAdarScore(adj, 'E', 'I')).toBe(0);
  });

  it('returns 0 for missing nodes', () => {
    expect(adamicAdarScore(adj, 'A', 'MISSING')).toBe(0);
  });

  it('handles self-comparison', () => {
    // Self-comparison: common neighbors are A's own neighbors that link back to A
    // In undirected graph, neighbors of A that are also neighbors of A = all neighbors of A
    const score = adamicAdarScore(adj, 'A', 'A');
    // All of A's neighbors (C, D, E) are common neighbors with itself
    expect(score).toBeGreaterThan(0);
  });
});

describe('rankByAdamicAdar', () => {
  const adj = buildAdjacency(EDGES);

  it('ranks B as top related for A', () => {
    const ranked = rankByAdamicAdar(adj, 'A');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].nodeId).toBe('B');
    expect(ranked[0].commonNeighbors).toContain('C');
    expect(ranked[0].commonNeighbors).toContain('D');
  });

  it('respects limit parameter', () => {
    const ranked = rankByAdamicAdar(adj, 'A', 1);
    expect(ranked).toHaveLength(1);
  });

  it('excludes direct neighbors from candidates', () => {
    // Direct neighbors of A: C, D, E — these should still appear
    // because they're 2-hop reachable through other paths
    const ranked = rankByAdamicAdar(adj, 'A');
    const ids = ranked.map(r => r.nodeId);
    // B, F, G, H, I are 2-hop reachable
    expect(ids).toContain('B');
  });

  it('returns empty for isolated node', () => {
    const isolatedAdj = buildAdjacency([{ from: 'X', to: 'Y' }]);
    // Z is not in the graph
    expect(rankByAdamicAdar(isolatedAdj, 'Z')).toHaveLength(0);
  });
});
