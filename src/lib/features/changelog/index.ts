/**
 * Changelog feature module — tracks file changes in the vault.
 * Public API barrel.
 */

// Types
export type { ChangelogEntry } from './types';

// Stores
export {
  changelogEntries,
  changelogLoading,
  refreshChangelog,
  writeChangelogFile,
  updateChangelog,
  setupChangelogAutoUpdate,
  cleanupChangelogListeners,
} from './stores/changelog';

// Services
export { appendChangelog, getRecentChangelog } from './services/changelog';

// Logic helpers
export { groupByDate, getActionIcon, formatTime } from './services/changelogLogic';

// Components
export { default as ChangelogPanel } from './components/ChangelogPanel.svelte';
