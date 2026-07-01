/**
 * ProgressBar — renders ```progressbar fenced code blocks
 * as visual progress bars based on time or manual values.
 */

// Types
export type {
  ProgressBarKind, ProgressBarConfig, ProgressBarData, ProgressBarBlock,
} from './types/progressbar';
export { DEFAULT_PROGRESSBAR_CONFIG } from './types/progressbar';

// Services — Parser
export {
  parseProgressBarYaml, computeTimeProgress, daysBetween,
  resolveNameTemplate, defaultNameForKind, computeProgressBar,
  findProgressBarBlocks, sampleProgressBarBlock,
} from './services/progressbarParser';

// Services — Widget & Extension
export { ProgressBarWidget } from './services/progressbarWidget';
export { progressBarExtension } from './services/progressbarExtension';
