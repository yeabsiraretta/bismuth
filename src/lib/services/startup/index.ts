/**
 * Startup service — app bootstrap and startup metric recording.
 *
 * Re-exports the bootstrap entry points and startup telemetry so callers
 * import from `@/services/startup` rather than from the scattered `@/app`
 * and `@/stores/startup` directories.
 */

export {
  initializeApp,
  cleanupApp,
  handleNewNote,
  handlePublish,
  handleDailyNote,
  handlePublishMark,
} from '@/app/appBootstrap';

export type { AppCallbacks } from '@/app/AppCallbacks';

export { startupHistory, lastDuration, recordStartupDuration } from './startupMetrics';

export type { StartupEntry } from './startupMetrics';
