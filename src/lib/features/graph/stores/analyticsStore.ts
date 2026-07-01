/**
 * Analytics store — manages advanced graph analysis state,
 * persists settings, triggers analysis runs.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { GraphAnalyticsResult, AnalyticsSettings } from '../types/analytics';
import { DEFAULT_ANALYTICS_SETTINGS } from '../types/analytics';
import type { GraphNode, GraphEdge } from '../types';
import { analyzeGraph } from '../services/graphAnalytics';

// ─── Storage ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'bismuth-graph-analytics-settings';

function loadSettings(): AnalyticsSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? { ...DEFAULT_ANALYTICS_SETTINGS, ...JSON.parse(s) } : DEFAULT_ANALYTICS_SETTINGS;
  } catch {
    return DEFAULT_ANALYTICS_SETTINGS;
  }
}

// ─── Core stores ─────────────────────────────────────────────────────────────

export const analyticsSettings = writable<AnalyticsSettings>(loadSettings());
export const analyticsResult = writable<GraphAnalyticsResult | null>(null);
export const analyticsLoading = writable(false);
export const selectedClusterId = writable<number | null>(null);
export const selectedGapIdx = writable<number | null>(null);
export const analyticsTab = writable<'topics' | 'gaps' | 'metrics'>('topics');
export const highlightedNodes = writable<Set<string>>(new Set());

// Persist settings
analyticsSettings.subscribe((v) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
});

// ─── Derived ─────────────────────────────────────────────────────────────────

export const clusters = derived(analyticsResult, ($r) => $r?.clusters ?? []);
export const gaps = derived(analyticsResult, ($r) => $r?.gaps ?? []);
export const topMetrics = derived(analyticsResult, ($r) => ($r?.metrics ?? []).slice(0, 20));
export const modularity = derived(analyticsResult, ($r) => $r?.modularity ?? 0);
export const bigrams = derived(analyticsResult, ($r) => ($r?.bigrams ?? []).slice(0, 20));

export const selectedCluster = derived([clusters, selectedClusterId], ([$clusters, $id]) =>
  $id !== null ? ($clusters.find((c) => c.id === $id) ?? null) : null
);

export const selectedGap = derived([gaps, selectedGapIdx], ([$gaps, $idx]) =>
  $idx !== null ? ($gaps[$idx] ?? null) : null
);

export const clusterNodeMap = derived(clusters, ($clusters) => {
  const map = new Map<string, number>();
  for (const c of $clusters) {
    for (const nId of c.nodeIds) map.set(nId, c.id);
  }
  return map;
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export function runAnalysis(nodes: GraphNode[], edges: GraphEdge[]): void {
  analyticsLoading.set(true);
  try {
    const settings = get(analyticsSettings);
    const result = analyzeGraph(nodes, edges, settings.maxClusters);
    analyticsResult.set(result);
    selectedClusterId.set(null);
    selectedGapIdx.set(null);
    log.info('Graph analytics completed', {
      nodes: result.nodeCount,
      edges: result.edgeCount,
      clusters: result.clusters.length,
      gaps: result.gaps.length,
      modularity: result.modularity.toFixed(3),
    });
  } catch (error) {
    log.error('Graph analytics failed', error as Error);
  } finally {
    analyticsLoading.set(false);
  }
}

export function selectCluster(id: number | null): void {
  selectedClusterId.set(id);
  if (id !== null) {
    const result = get(analyticsResult);
    const cluster = result?.clusters.find((c) => c.id === id);
    if (cluster) highlightedNodes.set(new Set(cluster.nodeIds));
    else highlightedNodes.set(new Set());
  } else {
    highlightedNodes.set(new Set());
  }
}

export function selectGap(idx: number | null): void {
  selectedGapIdx.set(idx);
  if (idx !== null) {
    const result = get(analyticsResult);
    const gap = result?.gaps[idx];
    if (gap) {
      const clusterA = result?.clusters.find((c) => c.id === gap.clusterA);
      const clusterB = result?.clusters.find((c) => c.id === gap.clusterB);
      const nodes = new Set([...(clusterA?.nodeIds ?? []), ...(clusterB?.nodeIds ?? [])]);
      highlightedNodes.set(nodes);
    }
  } else {
    highlightedNodes.set(new Set());
  }
}

export function setAnalyticsTab(tab: 'topics' | 'gaps' | 'metrics'): void {
  analyticsTab.set(tab);
}

export function updateAnalyticsSettings(updates: Partial<AnalyticsSettings>): void {
  analyticsSettings.update((s) => ({ ...s, ...updates }));
}

export function clearAnalytics(): void {
  analyticsResult.set(null);
  selectedClusterId.set(null);
  selectedGapIdx.set(null);
  highlightedNodes.set(new Set());
}
