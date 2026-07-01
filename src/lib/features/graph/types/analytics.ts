/**
 * Advanced graph analytics types — clusters, centrality, gaps, concepts.
 * Inspired by InfraNodus network science metrics.
 */

// ─── Centrality metrics ──────────────────────────────────────────────────────

export interface NodeMetrics {
  id: string;
  label: string;
  /** Betweenness centrality (0–1 normalized) */
  betweenness: number;
  /** Degree (number of connections) */
  degree: number;
  /** Combined relevance score: weighted sum of betweenness + degree */
  relevance: number;
  /** Relative influence: betweenness / max betweenness */
  influence: number;
  /** Cluster ID this node belongs to */
  clusterId: number;
}

// ─── Topical clusters ────────────────────────────────────────────────────────

export interface TopicCluster {
  id: number;
  /** Semantic label derived from top concepts */
  label: string;
  /** Cluster color for visualization */
  color: string;
  /** Node IDs belonging to this cluster */
  nodeIds: string[];
  /** Top concepts by relevance */
  topConcepts: string[];
  /** Density: internal edges / possible internal edges */
  density: number;
  /** Total relevance of cluster members */
  totalRelevance: number;
}

// ─── Structural gaps ─────────────────────────────────────────────────────────

export interface StructuralGap {
  /** Cluster A in the gap */
  clusterA: number;
  /** Cluster B in the gap */
  clusterB: number;
  /** Label for cluster A */
  labelA: string;
  /** Label for cluster B */
  labelB: string;
  /** How disconnected these clusters are (0 = fully connected, 1 = no connection) */
  disconnection: number;
  /** Suggested bridge concepts from each cluster */
  bridgeConcepts: { fromA: string[]; fromB: string[] };
}

// ─── Concept co-occurrence ───────────────────────────────────────────────────

export interface ConceptNode {
  id: string;
  label: string;
  frequency: number;
  isWikilink: boolean;
}

export interface ConceptEdge {
  source: string;
  target: string;
  weight: number;
}

export interface Bigram {
  a: string;
  b: string;
  weight: number;
}

// ─── Analytics result ────────────────────────────────────────────────────────

export interface GraphAnalyticsResult {
  /** Node-level metrics */
  metrics: NodeMetrics[];
  /** Detected topical clusters */
  clusters: TopicCluster[];
  /** Structural gaps between clusters */
  gaps: StructuralGap[];
  /** Top bigrams (co-occurring concept pairs) */
  bigrams: Bigram[];
  /** Graph-level modularity score (0–1, higher = more modular) */
  modularity: number;
  /** Total node count analyzed */
  nodeCount: number;
  /** Total edge count analyzed */
  edgeCount: number;
  /** Timestamp of analysis */
  timestamp: number;
}

// ─── Concept extraction mode ─────────────────────────────────────────────────

export type ConceptMode = 'wikilinks-only' | 'wikilinks-and-concepts';
export type LinkMode = 'paragraph' | 'page';

export interface AnalyticsSettings {
  conceptMode: ConceptMode;
  linkMode: LinkMode;
  includeBacklinks: boolean;
  includeUnlinked: boolean;
  minRelevance: number;
  maxClusters: number;
  stopwords: string[];
}

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  conceptMode: 'wikilinks-and-concepts',
  linkMode: 'paragraph',
  includeBacklinks: true,
  includeUnlinked: false,
  minRelevance: 0.01,
  maxClusters: 8,
  stopwords: [],
};

// ─── Cluster color palette ───────────────────────────────────────────────────

export const CLUSTER_COLORS = [
  '#4a9eff', '#ff6b6b', '#51cf66', '#fcc419',
  '#cc5de8', '#ff922b', '#20c997', '#868e96',
  '#f06595', '#339af0', '#a9e34b', '#f783ac',
];
