/**
 * Graph Analytics — betweenness centrality, modularity clustering,
 * gap detection, bigram extraction, influence ranking.
 * All algorithms are pure TS with no external dependencies.
 */
import type { GraphNode, GraphEdge } from '../types';
import type {
  NodeMetrics,
  TopicCluster,
  StructuralGap,
  Bigram,
  GraphAnalyticsResult,
} from '../types/analytics';
import { CLUSTER_COLORS } from '../types/analytics';

// ─── Adjacency helpers ───────────────────────────────────────────────────────

type AdjMap = Map<string, Set<string>>;

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]): AdjMap {
  const adj: AdjMap = new Map();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const e of edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }
  return adj;
}

// ─── Betweenness centrality (Brandes algorithm) ──────────────────────────────

export function betweennessCentrality(nodeIds: string[], adj: AdjMap): Map<string, number> {
  const cb = new Map<string, number>();
  for (const id of nodeIds) cb.set(id, 0);

  for (const s of nodeIds) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    for (const v of nodeIds) {
      pred.set(v, []);
      sigma.set(v, 0);
      dist.set(v, -1);
    }
    sigma.set(s, 1);
    dist.set(s, 0);

    const queue: string[] = [s];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    const delta = new Map<string, number>();
    for (const v of nodeIds) delta.set(v, 0);
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w) ?? []) {
        delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }

  // Normalize to [0, 1]
  const n = nodeIds.length;
  const normFactor = n > 2 ? (n - 1) * (n - 2) : 1;
  for (const [id, val] of cb) cb.set(id, val / normFactor);
  return cb;
}

// ─── Louvain-like community detection (greedy modularity) ────────────────────

export function detectCommunities(
  nodeIds: string[],
  adj: AdjMap,
  maxClusters: number = 8
): { communities: Map<string, number>; modularity: number } {
  const m = [...adj.values()].reduce((s, neighbors) => s + neighbors.size, 0) / 2;
  if (m === 0) {
    const communities = new Map<string, number>();
    nodeIds.forEach((id, i) => communities.set(id, Math.min(i, maxClusters - 1)));
    return { communities, modularity: 0 };
  }

  const degree = new Map<string, number>();
  for (const id of nodeIds) degree.set(id, adj.get(id)?.size ?? 0);

  const community = new Map<string, number>();
  nodeIds.forEach((id, i) => community.set(id, i));

  // Precompute community degree sums for performance
  const commDegreeSum = new Map<number, number>();
  for (const id of nodeIds) {
    const c = community.get(id)!;
    commDegreeSum.set(c, (commDegreeSum.get(c) ?? 0) + degree.get(id)!);
  }

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 30) {
    improved = false;
    iterations++;
    for (const node of nodeIds) {
      const currentComm = community.get(node)!;
      const ki = degree.get(node)!;
      const neighbors = adj.get(node) ?? new Set<string>();

      // Count edges to each neighboring community
      const commEdges = new Map<number, number>();
      for (const nb of neighbors) {
        const c = community.get(nb)!;
        commEdges.set(c, (commEdges.get(c) ?? 0) + 1);
      }

      // Modularity loss from removing node from its current community
      const edgesToCurrent = commEdges.get(currentComm) ?? 0;
      const sumCurrent = (commDegreeSum.get(currentComm) ?? 0) - ki;
      const removeLoss = -(edgesToCurrent / m) + (ki * sumCurrent) / (2 * m * m);

      let bestComm = currentComm;
      let bestGain = 0;
      for (const [c, edgesInC] of commEdges) {
        if (c === currentComm) continue;
        const sumTarget = commDegreeSum.get(c) ?? 0;
        const gain = edgesInC / m - (ki * sumTarget) / (2 * m * m);
        const totalGain = gain + removeLoss;
        if (totalGain > bestGain) {
          bestGain = totalGain;
          bestComm = c;
        }
      }

      if (bestComm !== currentComm) {
        // Update community degree sums
        commDegreeSum.set(currentComm, (commDegreeSum.get(currentComm) ?? 0) - ki);
        commDegreeSum.set(bestComm, (commDegreeSum.get(bestComm) ?? 0) + ki);
        community.set(node, bestComm);
        improved = true;
      }
    }
  }

  // Remap to contiguous IDs and cap at maxClusters
  const uniqueComms = [...new Set(community.values())];
  const remap = new Map<number, number>();
  uniqueComms.forEach((c, i) => remap.set(c, Math.min(i, maxClusters - 1)));
  for (const [id, c] of community) community.set(id, remap.get(c)!);

  // Compute modularity Q
  let Q = 0;
  for (const [u, neighborsU] of adj) {
    for (const v of neighborsU) {
      if (community.get(u) === community.get(v)) {
        Q += 1 - (degree.get(u)! * degree.get(v)!) / (2 * m);
      }
    }
  }
  Q /= 2 * m;

  return { communities: community, modularity: Math.max(0, Math.min(1, Q)) };
}

// ─── Gap detection ───────────────────────────────────────────────────────────

export function detectGaps(clusters: TopicCluster[], adj: AdjMap): StructuralGap[] {
  const gaps: StructuralGap[] = [];

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i];
      const b = clusters[j];
      let crossEdges = 0;
      const maxCross = a.nodeIds.length * b.nodeIds.length;
      if (maxCross === 0) continue;

      for (const nA of a.nodeIds) {
        const neighbors = adj.get(nA) ?? new Set();
        for (const nB of b.nodeIds) {
          if (neighbors.has(nB)) crossEdges++;
        }
      }

      const disconnection = 1 - crossEdges / Math.max(maxCross, 1);
      if (disconnection > 0.7) {
        gaps.push({
          clusterA: a.id,
          clusterB: b.id,
          labelA: a.label,
          labelB: b.label,
          disconnection,
          bridgeConcepts: {
            fromA: a.topConcepts.slice(0, 3),
            fromB: b.topConcepts.slice(0, 3),
          },
        });
      }
    }
  }

  return gaps.sort((a, b) => b.disconnection - a.disconnection);
}

// ─── Bigram extraction ───────────────────────────────────────────────────────

export function extractBigrams(edges: GraphEdge[], labels: Map<string, string>): Bigram[] {
  const counts = new Map<string, number>();
  for (const e of edges) {
    const key = [e.from, e.to].sort().join('||');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const bigrams: Bigram[] = [];
  for (const [key, weight] of counts) {
    const [a, b] = key.split('||');
    bigrams.push({ a: labels.get(a) ?? a, b: labels.get(b) ?? b, weight });
  }
  return bigrams.sort((a, b) => b.weight - a.weight).slice(0, 50);
}

// ─── Build full analytics ────────────────────────────────────────────────────

export function analyzeGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  maxClusters: number = 8
): GraphAnalyticsResult {
  const nodeIds = nodes.map((n) => n.id);
  const adj = buildAdjacency(nodes, edges);
  const labels = new Map(nodes.map((n) => [n.id, n.label]));

  // Centrality
  const bc = betweennessCentrality(nodeIds, adj);
  const maxBC = Math.max(...bc.values(), 0.001);

  // Communities
  const { communities, modularity } = detectCommunities(nodeIds, adj, maxClusters);

  // Node metrics
  const metrics: NodeMetrics[] = nodes.map((n) => {
    const degree = adj.get(n.id)?.size ?? 0;
    const betweenness = bc.get(n.id) ?? 0;
    return {
      id: n.id,
      label: n.label,
      betweenness,
      degree,
      relevance: betweenness * 0.6 + (degree / Math.max(nodes.length, 1)) * 0.4,
      influence: betweenness / maxBC,
      clusterId: communities.get(n.id) ?? 0,
    };
  });

  // Build clusters
  const clusterMap = new Map<number, NodeMetrics[]>();
  for (const m of metrics) {
    if (!clusterMap.has(m.clusterId)) clusterMap.set(m.clusterId, []);
    clusterMap.get(m.clusterId)!.push(m);
  }

  const clusters: TopicCluster[] = [...clusterMap.entries()]
    .map(([id, members]) => {
      const sorted = [...members].sort((a, b) => b.relevance - a.relevance);
      const clusterNodeIds = members.map((m) => m.id);

      // Density
      let internalEdges = 0;
      const memberSet = new Set(clusterNodeIds);
      for (const nId of clusterNodeIds) {
        for (const nb of adj.get(nId) ?? []) {
          if (memberSet.has(nb)) internalEdges++;
        }
      }
      internalEdges /= 2;
      const possibleEdges = (clusterNodeIds.length * (clusterNodeIds.length - 1)) / 2;

      return {
        id,
        label: sorted
          .slice(0, 3)
          .map((m) => m.label)
          .join(', '),
        color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
        nodeIds: clusterNodeIds,
        topConcepts: sorted.slice(0, 5).map((m) => m.label),
        density: possibleEdges > 0 ? internalEdges / possibleEdges : 0,
        totalRelevance: members.reduce((s, m) => s + m.relevance, 0),
      };
    })
    .sort((a, b) => b.totalRelevance - a.totalRelevance);

  // Gaps
  const gaps = detectGaps(clusters, adj);

  // Bigrams
  const bigrams = extractBigrams(edges, labels);

  return {
    metrics: metrics.sort((a, b) => b.relevance - a.relevance),
    clusters,
    gaps,
    bigrams,
    modularity,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    timestamp: Date.now(),
  };
}
