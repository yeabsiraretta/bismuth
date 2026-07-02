/**
 * Publishing feature module — digital garden publishing.
 * Public API barrel.
 */

// Types
export type {
  DeployTarget,
  PublishConfig,
  PublishableNote,
  PublishResult,
  PublishStatus,
  PublishHistoryEntry,
  SiteSettings,
} from './types';

// Stores
export {
  publishableNotes,
  publishLoading,
  lastPublishResult,
  publishHistory,
  siteSettings,
  deployTarget,
  deployStatus,
  publishStats,
  refreshPublishableNotes,
  triggerPublish,
  togglePublishFlag,
  updateSiteSettings,
} from './stores/publishing';

// Services
export {
  scanPublishableNotes,
  publishSite,
  getPublishConfig,
  savePublishConfig,
} from './services/publishing';

// Components
export { default as PublicationDashboard } from './components/PublicationDashboard.svelte';
export { default as PublishingPanel } from './components/PublishingPanel.svelte';
export { default as DeploySettings } from './components/DeploySettings.svelte';
