/**
 * Adamic-Adar index — measures the structural similarity between
 * two nodes in a link graph by weighting their shared neighbors
 * inversely by each neighbor's degree: sum(1 / log(degree(z)))
 * for each common neighbor z.
 *
 * A shared neighbor with low degree (a "niche" atomic note) contributes
 * more than a hub (like a daily note) linked by many pages.
 */

/** Adjacency map: node ID -> set of neighbor IDs (undirected). */
export type AdjMap = Map<string, Set<string>>;

/**
 * Build an undirected adjacency map from edge pairs.
 */
export function buildAdjacency(edges: Array<{ from: string; to: string }>): AdjMap {
  const adj: AdjMap = new Map();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, new Set());
    if (!adj.has(e.to)) adj.set(e.to, new Set());
    adj.get(e.from)!.add(e.to);
    adj.get(e.to)!.add(e.from);
  }
  return adj;
}

/**
 * Compute the Adamic-Adar index between two nodes.
 * Returns 0 if they share no common neighbors or either is missing.
 */
export function adamicAdarScore(adj: AdjMap, nodeA: string, nodeB: string): number {
  const neighborsA = adj.get(nodeA);
  const neighborsB = adj.get(nodeB);
  if (!neighborsA || !neighborsB) return 0;

  let score = 0;
  for (const z of neighborsA) {
    if (!neighborsB.has(z)) continue;
    const degZ = adj.get(z)?.size ?? 0;
    if (degZ > 1) {
      score += 1 / Math.log(degZ);
    }
  }
  return score;
}

/**
 * Get the common neighbors between two nodes.
 */
export function getCommonNeighbors(adj: AdjMap, nodeA: string, nodeB: string): string[] {
  const neighborsA = adj.get(nodeA);
  const neighborsB = adj.get(nodeB);
  if (!neighborsA || !neighborsB) return [];
  const common: string[] = [];
  for (const z of neighborsA) {
    if (neighborsB.has(z)) common.push(z);
  }
  return common;
}

/** Result of scoring one candidate node against a target. */
export interface AaCandidate {
  nodeId: string;
  aaScore: number;
  commonNeighbors: string[];
}

/**
 * Compute Adamic-Adar scores for all reachable nodes from a target.
 * Returns candidates sorted by score (descending), excluding the target
 * itself and its direct neighbors (which are trivially related).
 */
export function rankByAdamicAdar(adj: AdjMap, targetId: string, limit: number = 20): AaCandidate[] {
  const directNeighbors = adj.get(targetId);
  if (!directNeighbors || directNeighbors.size === 0) return [];

  // Candidate set: nodes reachable within 2 hops (share at least one neighbor)
  const candidateSet = new Set<string>();
  for (const neighbor of directNeighbors) {
    for (const twoHop of adj.get(neighbor) ?? []) {
      if (twoHop !== targetId) candidateSet.add(twoHop);
    }
  }

  const candidates: AaCandidate[] = [];
  for (const candidate of candidateSet) {
    const common = getCommonNeighbors(adj, targetId, candidate);
    if (common.length === 0) continue;
    const aaScore = adamicAdarScore(adj, targetId, candidate);
    if (aaScore > 0) {
      candidates.push({ nodeId: candidate, aaScore, commonNeighbors: common });
    }
  }

  candidates.sort((a, b) => b.aaScore - a.aaScore);
  return candidates.slice(0, limit);
}
