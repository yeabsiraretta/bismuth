/**
 * Atomic Insights store — manages config, computes related notes
 * for the active note, and exposes the runtime API.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { AtomicInsightsConfig, RelatedNote, InsightResult, InsightQueryOptions } from '../types';
import { DEFAULT_INSIGHTS_CONFIG } from '../types';
import { buildAdjacency, rankByAdamicAdar } from '../services/adamicAdar';
import { scoreAndRank } from '../services/insightsScorer';
import type { NoteContext } from '../services/insightsScorer';

const CONFIG_KEY = 'bismuth:atomic-insights-config';

function loadConfig(): AtomicInsightsConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_INSIGHTS_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_INSIGHTS_CONFIG };
}

function saveConfig(cfg: AtomicInsightsConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    log.warn('insightsStore: failed to persist config');
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

const configInternal = writable<AtomicInsightsConfig>(loadConfig());
const resultsInternal = writable<RelatedNote[]>([]);
const loadingInternal = writable(false);
const errorInternal = writable<string | null>(null);

export const insightsConfig = derived(configInternal, $c => $c);
export const insightsResults = derived(resultsInternal, $r => $r);
export const insightsLoading = derived(loadingInternal, $l => $l);
export const insightsError = derived(errorInternal, $e => $e);

// ─── Config ─────────────────────────────────────────────────────────────────

export function updateInsightsConfig(patch: Partial<AtomicInsightsConfig>): void {
  configInternal.update(c => {
    const next = { ...c, ...patch };
    saveConfig(next);
    return next;
  });
}

export function resetInsightsConfig(): void {
  configInternal.set({ ...DEFAULT_INSIGHTS_CONFIG });
  saveConfig(DEFAULT_INSIGHTS_CONFIG);
}

// ─── Core query ─────────────────────────────────────────────────────────────

/**
 * Compute related notes for a given note path.
 * Fetches graph data, runs Adamic-Adar, applies context scoring.
 */
export async function getRelatedNotes(
  notePath: string,
  options?: InsightQueryOptions,
): Promise<InsightResult> {
  const config = get(configInternal);
  const limit = options?.limit ?? config.defaultLimit;

  loadingInternal.set(true);
  errorInternal.set(null);

  try {
    const { getGraphData } = await import('@/features/graph');
    const graphData = await getGraphData();

    // Build adjacency from graph edges
    const adj = buildAdjacency(graphData.edges);

    // Check target exists
    if (!adj.has(notePath)) {
      const result: InsightResult = { status: 'error', results: [], message: `File not found in graph: ${notePath}` };
      errorInternal.set(result.message!);
      return result;
    }

    // Filter excluded folders
    const excluded = config.excludeFolders;
    const filteredEdges = excluded.length > 0
      ? graphData.edges.filter(e => !excluded.some(f => e.from.startsWith(f) || e.to.startsWith(f)))
      : graphData.edges;

    const filteredAdj = excluded.length > 0 ? buildAdjacency(filteredEdges) : adj;

    // Rank by Adamic-Adar
    const candidates = rankByAdamicAdar(filteredAdj, notePath, limit * 2);

    // Build label map
    const labels = new Map(graphData.nodes.map(n => [n.id, n.label]));

    // Build context for target
    const targetContext: NoteContext = { path: notePath, label: labels.get(notePath) ?? notePath };

    // Minimal context map (no metadata fetching for now — pure graph)
    const contextMap = new Map<string, NoteContext>();
    for (const c of candidates) {
      contextMap.set(c.nodeId, { path: c.nodeId, label: labels.get(c.nodeId) ?? c.nodeId });
    }

    const scored = scoreAndRank(candidates, targetContext, contextMap, config.weights, labels);
    const results = scored.slice(0, limit);

    resultsInternal.set(results);
    log.info('insightsStore: computed related notes', { path: notePath, count: results.length });

    return { status: 'success', results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorInternal.set(msg);
    log.error('insightsStore: query failed', new Error(msg));
    return { status: 'error', results: [], message: msg };
  } finally {
    loadingInternal.set(false);
  }
}

/**
 * Synchronous variant (returns cached results or empty).
 * For use by the window.AtomicInsights API.
 */
export function getRelatedNotesSync(): RelatedNote[] {
  return get(resultsInternal);
}

/**
 * Clear cached results.
 */
export function clearInsights(): void {
  resultsInternal.set([]);
  errorInternal.set(null);
}
