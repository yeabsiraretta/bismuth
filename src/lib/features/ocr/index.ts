/**
 * OCR feature module — public API barrel.
 * External consumers MUST import only from this path.
 */

// Types
export type {
  OcrWord,
  OcrResult,
  OcrJobStatus,
  OcrJob,
  CorrectionSource,
  CorrectionEntry,
} from './types/ocr';

// Services
export {
  importImage,
  cleanupOcrTemp,
  appendCorrection,
  getCorrections,
  applyLlmCorrection,
} from './services/ocr';

// Stores
export {
  activeJobs,
  activeJobId,
  ocrEnabled,
  addJob,
  updateJob,
  removeJob,
  clearCompleted,
} from './stores/ocrStore';

export { ocrSettings } from './stores/ocrSettings';
export type { OcrSettingsSlice } from './stores/ocrSettings';

// Components
export { default as OcrImportDialog } from './components/OcrImportDialog.svelte';
export { default as OcrReviewPanel } from './components/OcrReviewPanel.svelte';
export { default as OcrBatchProgress } from './components/OcrBatchProgress.svelte';
export { default as OcrCorrectionHighlight } from './components/OcrCorrectionHighlight.svelte';
