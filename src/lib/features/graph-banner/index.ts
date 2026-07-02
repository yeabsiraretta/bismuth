/**
 * Graph Banner feature module — togglable local graph embed in note header.
 * Public API barrel.
 */

// Types & config
export type { GraphBannerConfig } from './stores/graphBannerStore';
export { DEFAULT_BANNER_CONFIG } from './stores/graphBannerStore';

// Stores
export {
  graphBannerConfig,
  graphBannerEnabled,
  toggleGraphBanner,
  updateGraphBannerConfig,
  resetGraphBannerConfig,
  getGraphBannerConfig,
  setGraphBannerHeight,
  setGraphBannerDepth,
} from './stores/graphBannerStore';

// Components
export { default as GraphBanner } from './components/GraphBanner.svelte';
