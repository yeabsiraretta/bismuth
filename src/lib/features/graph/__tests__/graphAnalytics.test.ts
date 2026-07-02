import { describe, it, expect } from 'vitest';
import {
  betweennessCentrality,
  detectCommunities,
  detectGaps,
  extractBigrams,
  analyzeGraph,
} from '../services/graphAnalytics';
import type { GraphNode, GraphEdge } from '../types';
import type { TopicCluster } from '../types/analytics';

function node(id: string): GraphNode {
  return { id, label: id, node_type: 'note' };
}

function edge(from: string, to: string): GraphEdge {
  return { from, to, edge_type: 'wikilink' };
}

describe('betweennessCentrality', () => {
  it('computes centrality for a line graph', () => {
    // A - B - C: B is the bridge
    const adj = new Map([
      ['A', new Set(['B'])],
      ['B', new Set(['A', 'C'])],
      ['C', new Set(['B'])],
    ]);
    const bc = betweennessCentrality(['A', 'B', 'C'], adj);
    expect(bc.get('B')).toBeGreaterThan(bc.get('A')!);
    expect(bc.get('B')).toBeGreaterThan(bc.get('C')!);
  });

  it('returns zero for isolated nodes', () => {
    const adj = new Map([['A', new Set<string>()]]);
    const bc = betweennessCentrality(['A'], adj);
    expect(bc.get('A')).toBe(0);
  });

  it('star graph: center has highest centrality', () => {
    const adj = new Map([
      ['center', new Set(['a', 'b', 'c', 'd'])],
      ['a', new Set(['center'])],
      ['b', new Set(['center'])],
      ['c', new Set(['center'])],
      ['d', new Set(['center'])],
    ]);
    const bc = betweennessCentrality(['center', 'a', 'b', 'c', 'd'], adj);
    expect(bc.get('center')).toBeGreaterThan(0);
    expect(bc.get('a')).toBe(0);
  });
});

describe('detectCommunities', () => {
  it('detects separate clusters', () => {
    // Two cliques connected by one edge
    const adj = new Map([
      ['a1', new Set(['a2', 'a3'])],
      ['a2', new Set(['a1', 'a3'])],
      ['a3', new Set(['a1', 'a2', 'b1'])],
      ['b1', new Set(['a3', 'b2', 'b3'])],
      ['b2', new Set(['b1', 'b3'])],
      ['b3', new Set(['b1', 'b2'])],
    ]);
    const { communities, modularity } = detectCommunities(
      ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'],
      adj,
      4
    );
    expect(communities.size).toBe(6);
    expect(modularity).toBeGreaterThanOrEqual(0);
    // a1 and a2 should be in the same community
    expect(communities.get('a1')).toBe(communities.get('a2'));
    // b2 and b3 should be in the same community
    expect(communities.get('b2')).toBe(communities.get('b3'));
  });

  it('handles empty graph', () => {
    const adj = new Map<string, Set<string>>();
    const { communities, modularity } = detectCommunities([], adj, 4);
    expect(communities.size).toBe(0);
    expect(modularity).toBe(0);
  });
});

describe('detectGaps', () => {
  it('finds gaps between disconnected clusters', () => {
    const clusterA: TopicCluster = {
      id: 0,
      label: 'A',
      color: '#ff0000',
      nodeIds: ['a1', 'a2'],
      topConcepts: ['alpha'],
      density: 1,
      totalRelevance: 1,
    };
    const clusterB: TopicCluster = {
      id: 1,
      label: 'B',
      color: '#0000ff',
      nodeIds: ['b1', 'b2'],
      topConcepts: ['beta'],
      density: 1,
      totalRelevance: 1,
    };
    const adj = new Map([
      ['a1', new Set(['a2'])],
      ['a2', new Set(['a1'])],
      ['b1', new Set(['b2'])],
      ['b2', new Set(['b1'])],
    ]);
    const gaps = detectGaps([clusterA, clusterB], adj);
    expect(gaps.length).toBe(1);
    expect(gaps[0].disconnection).toBe(1);
  });

  it('returns no gaps for well-connected clusters', () => {
    const cluster: TopicCluster = {
      id: 0,
      label: 'All',
      color: '#ff0000',
      nodeIds: ['a', 'b'],
      topConcepts: ['x'],
      density: 1,
      totalRelevance: 1,
    };
    const adj = new Map([
      ['a', new Set(['b'])],
      ['b', new Set(['a'])],
    ]);
    const gaps = detectGaps([cluster], adj);
    expect(gaps.length).toBe(0);
  });
});

describe('extractBigrams', () => {
  it('extracts top bigrams by weight', () => {
    const edges: GraphEdge[] = [edge('a', 'b'), edge('a', 'b'), edge('b', 'c')];
    const labels = new Map([
      ['a', 'Alpha'],
      ['b', 'Beta'],
      ['c', 'Gamma'],
    ]);
    const bigrams = extractBigrams(edges, labels);
    expect(bigrams[0].weight).toBe(2);
    expect(bigrams[0].a).toBe('Alpha');
    expect(bigrams[0].b).toBe('Beta');
  });
});

describe('analyzeGraph', () => {
  it('produces a full analytics result', () => {
    const nodes = [node('A'), node('B'), node('C'), node('D')];
    const edges = [edge('A', 'B'), edge('B', 'C'), edge('C', 'D')];
    const result = analyzeGraph(nodes, edges);

    expect(result.nodeCount).toBe(4);
    expect(result.edgeCount).toBe(3);
    expect(result.metrics.length).toBe(4);
    expect(result.clusters.length).toBeGreaterThan(0);
    expect(result.modularity).toBeGreaterThanOrEqual(0);
    expect(result.bigrams.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('ranks bridge nodes higher in relevance', () => {
    // A-B-C-D line: B and C are bridges
    const nodes = [node('A'), node('B'), node('C'), node('D')];
    const edges = [edge('A', 'B'), edge('B', 'C'), edge('C', 'D')];
    const result = analyzeGraph(nodes, edges);
    const metricsMap = new Map(result.metrics.map((m) => [m.id, m]));
    expect(metricsMap.get('B')!.betweenness).toBeGreaterThan(metricsMap.get('A')!.betweenness);
  });

  it('handles single node', () => {
    const result = analyzeGraph([node('solo')], []);
    expect(result.nodeCount).toBe(1);
    expect(result.clusters.length).toBe(1);
    expect(result.gaps.length).toBe(0);
  });
});
