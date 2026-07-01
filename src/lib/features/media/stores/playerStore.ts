/**
 * Media player store — reactive state for the active media player.
 *
 * Manages current media source, playback state, transcript, and
 * pinning behavior. Provides actions for play/pause, seek, speed, etc.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { MediaSource, PlaybackState, Transcript, ScreenshotCapture } from '../types/player';
import { DEFAULT_PLAYBACK } from '../types/player';
import { parseMediaSource, parseTranscript } from '../services/playerService';

// ─── Stores ──────────────────────────────────────────────────────────────────

export const activeSource = writable<MediaSource | null>(null);
export const playbackState = writable<PlaybackState>({ ...DEFAULT_PLAYBACK });
export const activeTranscript = writable<Transcript | null>(null);
export const screenshots = writable<ScreenshotCapture[]>([]);

/** Whether a media source is loaded. */
export const hasMedia = derived(activeSource, ($s) => $s !== null);

/** Whether the player is pinned across notes. */
export const isPinned = derived(playbackState, ($p) => $p.pinned);

// ─── Source management ───────────────────────────────────────────────────────

/** Open a media file or URL in the player. */
export function openMedia(urlOrPath: string): void {
  const source = parseMediaSource(urlOrPath);
  if (!source) {
    log.warn('playerStore: unsupported media format', { url: urlOrPath });
    return;
  }
  activeSource.set(source);
  playbackState.set({
    ...DEFAULT_PLAYBACK,
    playing: source.autoplay ?? false,
  });
  activeTranscript.set(null);
  screenshots.set([]);
  log.info('playerStore: media opened', { title: source.title, type: source.type });
}

/** Close the current media. */
export function closeMedia(): void {
  const current = get(activeSource);
  if (current) log.info('playerStore: media closed', { title: current.title });
  activeSource.set(null);
  playbackState.set({ ...DEFAULT_PLAYBACK });
  activeTranscript.set(null);
  screenshots.set([]);
}

// ─── Playback controls ───────────────────────────────────────────────────────

export function togglePlay(): void {
  playbackState.update(s => ({ ...s, playing: !s.playing }));
}

export function pause(): void {
  playbackState.update(s => ({ ...s, playing: false }));
}

export function play(): void {
  playbackState.update(s => ({ ...s, playing: true }));
}

export function seekTo(seconds: number): void {
  playbackState.update(s => ({
    ...s,
    currentTime: Math.max(0, Math.min(seconds, s.duration)),
  }));
}

export function setSpeed(speed: number): void {
  playbackState.update(s => ({ ...s, speed }));
  log.debug('playerStore: speed changed', { speed });
}

export function setVolume(volume: number): void {
  playbackState.update(s => ({ ...s, volume: Math.max(0, Math.min(1, volume)) }));
}

export function toggleMute(): void {
  playbackState.update(s => ({ ...s, muted: !s.muted }));
}

export function togglePin(): void {
  playbackState.update(s => ({ ...s, pinned: !s.pinned }));
  const pinned = get(playbackState).pinned;
  log.info('playerStore: pin toggled', { pinned });
}

export function updateTime(currentTime: number): void {
  playbackState.update(s => ({ ...s, currentTime }));
}

export function updateDuration(duration: number): void {
  playbackState.update(s => ({ ...s, duration }));
}

export function setBuffering(buffering: boolean): void {
  playbackState.update(s => ({ ...s, buffering }));
}

// ─── Transcript ──────────────────────────────────────────────────────────────

export function loadTranscript(content: string, sourcePath: string): void {
  const transcript = parseTranscript(content, sourcePath);
  activeTranscript.set(transcript);
  log.info('playerStore: transcript loaded', { cues: transcript.cues.length, format: transcript.format });
}

export function clearTranscript(): void {
  activeTranscript.set(null);
}

// ─── Screenshots ─────────────────────────────────────────────────────────────

export function addScreenshot(capture: ScreenshotCapture): void {
  screenshots.update(list => [...list, capture]);
  log.debug('playerStore: screenshot added', { time: capture.captureTime });
}

export function clearScreenshots(): void {
  screenshots.set([]);
}
