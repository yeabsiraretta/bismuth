/**
 * Timekeep — time tracking feature module.
 * Public API barrel.
 */

// Types
export type {
  TimekeepEntry,
  TimekeepData,
  Timekeep,
  TimekeepExportFormat,
  TimekeepExportOptions,
  TimekeepSettings,
  DurationParts,
} from './types/timekeep';
export { DEFAULT_EXPORT_OPTIONS, DEFAULT_TIMEKEEP_SETTINGS } from './types/timekeep';

// Services
export {
  generateTimekeepId,
  loadTimekeeps,
  saveTimekeeps,
  createEntry,
  startEntry,
  stopEntry,
  isRunning,
  isCompleted,
  isNotStarted,
  getEntryDurationMs,
  getEntryDurationWithSubs,
  getTotalDuration,
  parseDuration,
  formatDuration,
  formatDurationShort,
  formatTimestamp,
  addSubEntry,
  removeSubEntry,
  toggleCollapsed,
  createTimekeep,
  hasRunningEntry,
  getRunningEntries,
  parseTimekeepJson,
  serializeTimekeepJson,
} from './services/timekeepService';

export {
  exportAsMarkdown,
  exportAsCsv,
  exportAsJson,
  exportTimekeep,
} from './services/timekeepExport';

// Stores
export {
  timekeepSettings,
  timekeeps,
  activeTimers,
  hasActiveTimers,
  addTimekeep,
  removeTimekeep,
  renameTimekeep,
  addEntry,
  removeEntry,
  startEntryTimer,
  stopEntryTimer,
  editEntryName,
  editEntryTimes,
  toggleEntryCollapsed,
  addSubEntryAction,
  removeSubEntryAction,
  startSubEntryTimer,
  stopSubEntryTimer,
  stopAllTimers,
} from './stores/timekeepStore';

// Components
export { default as TimekeepPanel } from './components/TimekeepPanel.svelte';
