/**
 * Voice recording feature module.
 * Public API barrel.
 */

// Types
export type { RecordingMetadata, RecordingState } from './types';

// Stores
export {
  recordingState,
  recordingDuration,
  recordings,
  voiceSupported,
  voiceLoading,
  isRecording,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  cancelRecording,
  loadRecordings,
  removeRecording,
  attachToNote,
} from './stores/voice';

// Services
export {
  isRecordingSupported,
  saveRecording,
  listRecordings,
  deleteRecording,
  attachRecordingToNote,
} from './services/voice';

// Components
export { default as VoicePanel } from './components/VoicePanel.svelte';
