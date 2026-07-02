/**
 * Writing lint feature module.
 * Public API barrel.
 */

// Types (re-exported from service)
export type { LintIssue } from './services/linting';

// Stores
export {
  lintIssues,
  lintLoading,
  lintImmediate,
  lintDebounced,
  clearLintIssues,
} from './stores/linting';

// Services
export { lintText } from './services/linting';

// Logic
export { groupBySeverity, severityLabel, severityIcon } from './components/writingLintLogic';

// Components
export { default as WritingLintPanel } from './components/WritingLintPanel.svelte';
