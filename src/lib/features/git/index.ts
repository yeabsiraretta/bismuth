/**
 * Git integration feature module.
 * Public API barrel.
 */

// Types (re-exported from service)
export type { FileStatus } from './services/git';

// Stores
export {
  gitState,
  modifiedCount,
  refreshGitStatus,
} from './stores/git';

// Services
export {
  getCurrentBranch,
  getGitStatus,
} from './services/git';

// Components
export { default as GitPanel } from './components/GitPanel.svelte';
export { default as GitFileList } from './components/GitFileList.svelte';
