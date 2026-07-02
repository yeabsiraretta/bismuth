/**
 * Knowledge versioning feature — public API barrel.
 *
 * This is the ONLY import path for external consumers.
 * Never import internal paths directly (e.g., `@/features/versioning/stores/versionStore`).
 *
 * @example
 *   import { VersionTimeline, versionStore, type VersionEntry } from '@/features/versioning';
 */

// Types (public API surface)
export type { BumpType, DiffMetrics, VersionEntry, VersionHistory } from './types/versioning';

// Store (actions and reactive state)
export {
  activeVersionHistory,
  selectedEntry,
  isLoading,
  currentVersion,
  loadVersionHistory,
  selectEntry,
  clearHistory,
} from './stores/versionStore';

// Components
export { default as VersionTimeline } from './components/VersionTimeline.svelte';
export { default as VersionDiffView } from './components/VersionDiffView.svelte';
export { default as VersionBadge } from './components/VersionBadge.svelte';
export { default as VersioningPanel } from './components/VersioningPanel.svelte';

// Services — exported for use in save hooks (not for direct component use)
export {
  computeDiffMetrics,
  bumpVersion,
  saveDiff,
  listVersions,
  getNoteDiff,
} from './services/versioning';
