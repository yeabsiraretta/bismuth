/**
 * NAS feature module — public barrel export.
 * External consumers MUST import only from this path (@/features/nas).
 */

// Types
export type {
  NasConfig,
  SyncStatus,
  ConflictRecord,
  ChangeJournalEntry,
  NasConnectionResult,
  SyncSummary,
  RemoteEntryDto,
} from './types/nas';
export { isNasConfig, isConflictRecord, isChangeJournalEntry } from './types/nas';

// Store — public state and actions
export {
  nasConfig,
  syncStatus,
  lastSyncAt,
  pendingCount,
  conflicts,
  lastSyncResult,
  pendingSizeWarning,
  nasEnabled,
  loadNasConfig,
  connectNas,
  syncNow,
  resolveConflict,
  disconnectNas,
  updateConfig,
} from './stores/nasStore';

// Services (for advanced consumers)
export {
  connectWebDav,
  listRemote,
  syncVault,
  applyChange,
  cancelSync,
  onSyncProgress,
  onSizeWarning,
  readNasConfig,
  writeNasConfig,
} from './services/nas';

// Components
export { default as NasConfigPanel } from './components/NasConfigPanel.svelte';
export { default as NasSyncStatus } from './components/NasSyncStatus.svelte';
export { default as NasConflictDialog } from './components/NasConflictDialog.svelte';
export { default as NasPanel } from './components/NasPanel.svelte';
