/**
 * Graph Banner store — toggle state, appearance settings, and persistence.
 */

import { writable, derived, get } from 'svelte/store';

const CONFIG_KEY = 'bismuth:graph-banner-config';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GraphBannerConfig {
  /** Whether the banner is visible */
  enabled: boolean;
  /** Banner height in pixels */
  height: number;
  /** Local graph depth (1–5) */
  depth: number;
  /** Whether to animate the graph simulation */
  animate: boolean;
  /** Show node labels */
  showLabels: boolean;
  /** Show tag nodes */
  showTags: boolean;
  /** Show attachment nodes */
  showAttachments: boolean;
  /** Node size multiplier */
  nodeSize: number;
  /** Link thickness */
  linkThickness: number;
}

export const DEFAULT_BANNER_CONFIG: GraphBannerConfig = {
  enabled: false,
  height: 200,
  depth: 1,
  animate: false,
  showLabels: true,
  showTags: false,
  showAttachments: false,
  nodeSize: 4,
  linkThickness: 1,
};

// ─── Store ─────────────────────────────────────────────────────────────────────

function loadConfig(): GraphBannerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_BANNER_CONFIG, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_BANNER_CONFIG };
}

function persistConfig(config: GraphBannerConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch { /* ignore */ }
}

const configStore = writable<GraphBannerConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const graphBannerConfig = derived(configStore, $c => $c);
export const graphBannerEnabled = derived(configStore, $c => $c.enabled);

export function toggleGraphBanner(): boolean {
  let enabled = false;
  configStore.update(c => {
    enabled = !c.enabled;
    return { ...c, enabled };
  });
  return enabled;
}

export function updateGraphBannerConfig(partial: Partial<GraphBannerConfig>): void {
  configStore.update(c => ({ ...c, ...partial }));
}

export function resetGraphBannerConfig(): void {
  configStore.set({ ...DEFAULT_BANNER_CONFIG });
}

export function getGraphBannerConfig(): GraphBannerConfig {
  return get(configStore);
}

export function setGraphBannerHeight(height: number): void {
  const clamped = Math.max(80, Math.min(400, height));
  configStore.update(c => ({ ...c, height: clamped }));
}

export function setGraphBannerDepth(depth: number): void {
  const clamped = Math.max(1, Math.min(5, depth));
  configStore.update(c => ({ ...c, depth: clamped }));
}
