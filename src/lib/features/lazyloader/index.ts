/**
 * Lazy Loader feature module.
 * Priority-based deferred feature loading with profiling and batch control.
 */

// Types
export type {
  LoadPriority,
  FeatureLoadTiming,
  FeatureLoadProfile,
  LazyLoaderConfig,
  BatchAction,
  LoadQueueEntry,
} from './types/lazyloader';
export { PRIORITY_ORDER, DEFAULT_LAZY_LOADER_CONFIG } from './types/lazyloader';

// Services
export {
  loadProfiles,
  saveProfiles,
  recordTiming,
  resolveFeaturePriority,
  sortQueue,
  filterLoadable,
  createSchedulerState,
  processQueue,
  totalLoadTime,
  slowestFeatures,
  countByPriority,
} from './services/loadScheduler';

// Stores
export {
  lazyConfig,
  loadTimings,
  loadProfileStore,
  isLoading,
  isEnabled,
  totalLoadTimeMs,
  top5Slowest,
  loadedCount,
  failedCount,
  priorityCounts,
  toggleEnabled,
  setStaggerMs,
  setMaxConcurrent,
  toggleAutoPromote,
  toggleShowTiming,
  setFeaturePriority,
  clearFeaturePriority,
  executeBatch,
  runLazyLoader,
  getFeaturePriority,
  clearTimings,
  clearProfiles,
} from './stores/lazyloaderStore';
