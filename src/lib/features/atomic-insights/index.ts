/**
 * Atomic Insights — discover structurally related notes through
 * the Adamic-Adar index on your personal link graph.
 * Public API barrel.
 */

// Types
export type {
  RelatedNote, InsightReason, InsightResult,
  InsightQueryOptions, InsightWeights, AtomicInsightsConfig,
} from './types';
export { DEFAULT_INSIGHT_WEIGHTS, DEFAULT_INSIGHTS_CONFIG } from './types';

// Services
export {
  buildAdjacency, adamicAdarScore, getCommonNeighbors, rankByAdamicAdar,
} from './services/adamicAdar';
export type { AdjMap, AaCandidate } from './services/adamicAdar';
export {
  timeProximityScore, editTimeScore, metadataScore, scoreAndRank,
} from './services/insightsScorer';
export type { NoteContext } from './services/insightsScorer';

// Store
export {
  insightsConfig, insightsResults, insightsLoading, insightsError,
  updateInsightsConfig, resetInsightsConfig,
  getRelatedNotes, getRelatedNotesSync, clearInsights,
} from './stores/insightsStore';

// Components
export { default as InsightsPanel } from './components/InsightsPanel.svelte';
