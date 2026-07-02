/**
 * Media feature module — public barrel export.
 * External consumers MUST import only from this path.
 * Internal paths (e.g., @/features/media/stores/mediaStore) are prohibited externally.
 */

// Types — media editing
export type {
  PhotoOpType,
  VideoOpType,
  FilterName,
  PhotoOperation,
  VideoOperation,
  MediaEditChain,
  FilterPreset,
  ImageFormat,
  ResizeMode,
  FlipDirection,
  BatchTarget,
  ConversionConfig,
  RenameConfig,
} from './types/media';
export {
  FILTER_PRESETS,
  FILTER_PRESET_MAP,
  DEFAULT_CONVERSION,
  DEFAULT_RENAME,
  RENAME_VARIABLES,
  FORMAT_MIME_MAP,
  FORMAT_EXT_MAP,
} from './types/media';

// Types — media player
export type {
  MediaType,
  MediaSource,
  PlaybackState,
  TimestampLink,
  TranscriptCue,
  Transcript,
  ScreenshotCapture,
} from './types/player';
export {
  DEFAULT_PLAYBACK,
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  SPEED_PRESETS,
} from './types/player';

// Store — media editing
export {
  activeMediaPath,
  editChain,
  previewDataUrl,
  isProcessing,
  isDirty,
  loadMediaFile,
  addOperation,
  removeOperation,
  undoOperation,
  redoOperation,
  clearChain,
  resetChain,
} from './stores/mediaStore';

// Store — media player
export {
  activeSource,
  playbackState,
  activeTranscript,
  screenshots,
  hasMedia,
  isPinned,
  openMedia,
  closeMedia,
  togglePlay,
  pause,
  play,
  seekTo,
  setSpeed,
  setVolume,
  toggleMute,
  togglePin,
  updateTime,
  updateDuration,
  setBuffering,
  loadTranscript,
  clearTranscript,
  addScreenshot,
  clearScreenshots,
} from './stores/playerStore';

// Services — media editing
export { applyChainToDataUrl, exportToBlob } from './services/photoOps';
export { checkCoopCoepAvailable } from './services/videoOps';
export { writeMediaExport, promptSavePath, blobToUint8Array } from './services/mediaService';
export {
  convertImage,
  convertImageToDataUrl,
  convertBlob,
  getImageDimensions,
  estimateOutputSize,
  computeResizeDimensions,
} from './services/imageConverter';
export {
  applyRenamePattern,
  buildOutputPath,
  extractBaseName,
  extractDir,
} from './services/imageRename';
export {
  hasImageData,
  getImageFiles,
  processDroppedImage,
  processDroppedImageWithConfig,
  loadPasteConfig,
  savePasteConfig,
  type PasteImageConfig,
} from './services/pasteImageHandler';

// Services — media player
export {
  formatTimestamp,
  parseTimestamp,
  detectMediaType,
  parseMediaSource,
  parseTimeFragment,
  parseSrt,
  parseVtt,
  parseTranscript,
  createTimestampLink,
  parseTimestampLink,
  captureVideoFrame,
} from './services/playerService';

// Extensions
export { timestampLinkExtension } from './extensions/timestampLinkExtension';

// Components
export { default as MediaPanel } from './components/MediaPanel.svelte';
export { default as PhotoEditor } from './components/PhotoEditor.svelte';
export { default as MediaToolbar } from './components/MediaToolbar.svelte';
export { default as FilterPicker } from './components/FilterPicker.svelte';
export { default as VideoEditor } from './components/VideoEditor.svelte';
export { default as VideoTimeline } from './components/VideoTimeline.svelte';
export { default as MediaHistoryPanel } from './components/MediaHistoryPanel.svelte';
export { default as MediaFileOpener } from './components/MediaFileOpener.svelte';
export { default as ConvertPanel } from './components/convert/ConvertPanel.svelte';
export { default as MediaPlayer } from './components/player/MediaPlayer.svelte';
export { default as TranscriptPanel } from './components/player/TranscriptPanel.svelte';
