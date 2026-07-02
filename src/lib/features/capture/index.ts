/**
 * Capture feature module — quick capture, classification, batch processing.
 * Public API barrel.
 */

// Stores
export {
  capturedNotes,
  isCaptureLoading,
  selectedCaptures,
  quickCapture,
  setLifecycleState,
  batchClassify,
  toggleCaptureSelection,
  selectAllCaptures,
  clearCaptureSelection,
  setupCaptureListeners,
} from './stores/capture';

// Services
export { archiveNoteCmd, organizeNoteCmd, mergeNotesCmd } from './services/capture';

// Components
export { default as CaptureDashboard } from './components/CaptureDashboard.svelte';
export { default as MergeNotesModal } from './components/MergeNotesModal.svelte';
