/**
 * Atomic Insights types — graph-based related note discovery
 * using the Adamic-Adar index combined with context signals.
 */

/** A single related note result with scoring breakdown. */
export interface RelatedNote {
  path: string;
  label: string;
  score: number;
  reasons: InsightReason[];
  commonNeighbors: string[];
}

/** Which signal contributed to a result. */
export type InsightReason = 'graph' | 'time' | 'metadata' | 'edit-time';

/** Full response from an insights query. */
export interface InsightResult {
  status: 'success' | 'error';
  results: RelatedNote[];
  message?: string;
}

/** Query options for related notes. */
export interface InsightQueryOptions {
  limit?: number;
}

/** Weight configuration for combining signals. */
export interface InsightWeights {
  graph: number;
  time: number;
  metadata: number;
  editTime: number;
}

/** Feature configuration persisted to localStorage. */
export interface AtomicInsightsConfig {
  weights: InsightWeights;
  excludeFolders: string[];
  defaultLimit: number;
  autoUpdate: boolean;
}

export const DEFAULT_INSIGHT_WEIGHTS: InsightWeights = {
  graph: 1.0,
  time: 0.2,
  metadata: 0.15,
  editTime: 0.1,
};

export const DEFAULT_INSIGHTS_CONFIG: AtomicInsightsConfig = {
  weights: { ...DEFAULT_INSIGHT_WEIGHTS },
  excludeFolders: [],
  defaultLimit: 20,
  autoUpdate: true,
};
