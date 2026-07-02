/**
 * Media player types — playback, timestamps, transcripts, and media sources.
 *
 * Inspired by Obsidian Media Extended plugin.
 * Supports local files, remote URLs, and fragment-based timestamps (#t=).
 */

// ─── Media source ────────────────────────────────────────────────────────────

export type MediaType = 'audio' | 'video';

export interface MediaSource {
  /** Original URL or file path */
  url: string;
  /** Resolved playable URL (file:// for local, https:// for remote) */
  playableUrl: string;
  /** Type of media */
  type: MediaType;
  /** Display title */
  title: string;
  /** Start time fragment in seconds (from #t=) */
  startTime?: number;
  /** End time fragment in seconds (from #t=,end) */
  endTime?: number;
  /** Whether to loop playback */
  loop?: boolean;
  /** Whether to auto-play */
  autoplay?: boolean;
}

// ─── Playback state ──────────────────────────────────────────────────────────

export interface PlaybackState {
  /** Whether media is currently playing */
  playing: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Playback speed multiplier */
  speed: number;
  /** Volume (0-1) */
  volume: number;
  /** Whether audio is muted */
  muted: boolean;
  /** Whether player is pinned (stays visible across notes) */
  pinned: boolean;
  /** Whether media is buffering */
  buffering: boolean;
}

export const DEFAULT_PLAYBACK: PlaybackState = {
  playing: false,
  currentTime: 0,
  duration: 0,
  speed: 1,
  volume: 1,
  muted: false,
  pinned: false,
  buffering: false,
};

// ─── Timestamp links ─────────────────────────────────────────────────────────

/** A timestamp link embedded in a note: `![[file.mp4#t=01:23]]` */
export interface TimestampLink {
  /** Source media path or URL */
  source: string;
  /** Timestamp in seconds */
  time: number;
  /** Display text (formatted time) */
  display: string;
  /** Optional end time for range */
  endTime?: number;
  /** Optional label text */
  label?: string;
}

// ─── Transcript ──────────────────────────────────────────────────────────────

export interface TranscriptCue {
  /** Cue index (1-based) */
  index: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Cue text content */
  text: string;
}

export interface Transcript {
  /** Cues in order */
  cues: TranscriptCue[];
  /** Format of the original file */
  format: 'srt' | 'vtt';
  /** Source file path */
  sourcePath: string;
}

// ─── Screenshot ──────────────────────────────────────────────────────────────

export interface ScreenshotCapture {
  /** Data URL of the captured frame */
  dataUrl: string;
  /** Timestamp when captured */
  captureTime: number;
  /** Source media path */
  sourceMedia: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

// ─── Supported formats ───────────────────────────────────────────────────────

export const AUDIO_EXTENSIONS = [
  'mp3',
  'ogg',
  'wav',
  'flac',
  'aac',
  'm4a',
  'opus',
  'weba',
] as const;
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi'] as const;
export const SUBTITLE_EXTENSIONS = ['srt', 'vtt'] as const;

export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3] as const;
