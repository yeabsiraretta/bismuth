/**
 * Audio Player types — singleton vault-wide audio player with
 * waveform visualization and bookmarks.
 */

// ─── Bookmark ────────────────────────────────────────────────────────────────

export interface AudioBookmark {
  /** Unique identifier */
  id: string;
  /** Seconds from start */
  timeSec: number;
  /** User-provided label */
  label: string;
}

// ─── Player state ────────────────────────────────────────────────────────────

export type AudioPlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioPlayerState {
  /** Currently loaded audio file path (vault-relative) */
  currentFile: string | null;
  status: AudioPlayerStatus;
  /** Current playback position in seconds */
  positionSec: number;
  /** Total duration in seconds */
  durationSec: number;
  /** Volume 0–1 */
  volume: number;
  /** Playback rate (0.5–2) */
  playbackRate: number;
  /** Error message if status === 'error' */
  error: string | null;
  /** Waveform peaks (0–1) for visualization */
  waveformPeaks: number[];
  /** Bookmarks for the current file */
  bookmarks: AudioBookmark[];
}

export const INITIAL_PLAYER_STATE: AudioPlayerState = {
  currentFile: null,
  status: 'idle',
  positionSec: 0,
  durationSec: 0,
  volume: 1,
  playbackRate: 1,
  error: null,
  waveformPeaks: [],
  bookmarks: [],
};

// ─── Parsed block ────────────────────────────────────────────────────────────

export interface AudioPlayerBlock {
  /** Document offset of the code block start */
  from: number;
  /** Document offset of the code block end */
  to: number;
  /** Vault-relative file path (from wikilink or plain text) */
  filePath: string;
  /** Bookmarks defined in the block text */
  bookmarks: AudioBookmark[];
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface AudioPlayerConfig {
  /** Default volume 0–1 */
  defaultVolume: number;
  /** Number of waveform bars to render */
  waveformBars: number;
  /** Show bookmark labels on waveform */
  showBookmarkLabels: boolean;
  /** Auto-resume on tab switch */
  persistPlayback: boolean;
}

export const DEFAULT_AUDIO_PLAYER_CONFIG: AudioPlayerConfig = {
  defaultVolume: 1,
  waveformBars: 120,
  showBookmarkLabels: true,
  persistPlayback: true,
};
