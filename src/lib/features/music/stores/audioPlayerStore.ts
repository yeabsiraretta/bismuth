/**
 * Audio Player Store — singleton vault-wide audio player.
 * One audio instance for the whole vault. Keeps playing even when switching tabs.
 * Bookmarks are persisted per file in localStorage.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { generatePrefixedId } from '@/utils/id';
import { getAudioContext, resumeAudioContext } from '../services/audioContext';
import type { AudioPlayerState, AudioBookmark } from '../types/audioPlayer';
import { INITIAL_PLAYER_STATE } from '../types/audioPlayer';

// ─── Singleton audio nodes ───────────────────────────────────────────────────

let _source: AudioBufferSourceNode | null = null;
let _gainNode: GainNode | null = null;
let _buffer: AudioBuffer | null = null;
let _startOffset = 0;
let _startTime = 0;
let _rafId = 0;

// ─── Store ───────────────────────────────────────────────────────────────────

const _store = writable<AudioPlayerState>({ ...INITIAL_PLAYER_STATE });
export const audioPlayerState = { subscribe: _store.subscribe };

export const playerStatus = derived(_store, (s) => s.status);
export const playerPosition = derived(_store, (s) => s.positionSec);
export const playerDuration = derived(_store, (s) => s.durationSec);
export const playerVolume = derived(_store, (s) => s.volume);
export const playerBookmarks = derived(_store, (s) => s.bookmarks);
export const playerFile = derived(_store, (s) => s.currentFile);
export const playerWaveform = derived(_store, (s) => s.waveformPeaks);

// ─── Bookmark persistence ────────────────────────────────────────────────────

const BM_KEY = 'bismuth:audio-bookmarks';

function loadBookmarks(filePath: string): AudioBookmark[] {
  try {
    const raw = localStorage.getItem(BM_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, AudioBookmark[]>;
    return all[filePath] ?? [];
  } catch {
    return [];
  }
}

function saveBookmarks(filePath: string, bookmarks: AudioBookmark[]): void {
  try {
    const raw = localStorage.getItem(BM_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AudioBookmark[]>) : {};
    all[filePath] = bookmarks;
    localStorage.setItem(BM_KEY, JSON.stringify(all));
  } catch (e) {
    log.warn('[audioPlayer] Failed to save bookmarks', { e });
  }
}

// ─── Waveform extraction ─────────────────────────────────────────────────────

function extractPeaks(buffer: AudioBuffer, barCount: number): number[] {
  const channel = buffer.getChannelData(0);
  const samplesPerBar = Math.floor(channel.length / barCount);
  const peaks: number[] = [];
  for (let i = 0; i < barCount; i++) {
    let max = 0;
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, channel.length);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channel[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }
  // Normalize
  const peakMax = Math.max(...peaks, 0.01);
  return peaks.map((p) => p / peakMax);
}

// ─── Position tracking ───────────────────────────────────────────────────────

function startPositionTracking(): void {
  stopPositionTracking();
  const tick = () => {
    const state = get(_store);
    if (state.status !== 'playing') return;
    const ctx = getAudioContext();
    const elapsed = ctx.currentTime - _startTime + _startOffset;
    const pos = Math.min(elapsed, state.durationSec);
    _store.update((s) => ({ ...s, positionSec: pos }));
    if (pos >= state.durationSec) {
      stopAudio();
      return;
    }
    _rafId = requestAnimationFrame(tick);
  };
  _rafId = requestAnimationFrame(tick);
}

function stopPositionTracking(): void {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = 0;
  }
}

// ─── Core actions ────────────────────────────────────────────────────────────

/** Load an audio file into the singleton player */
export async function loadAudio(filePath: string, audioUrl: string, barCount = 120): Promise<void> {
  stopAudio();
  _store.update((s) => ({ ...s, status: 'loading', currentFile: filePath, error: null }));

  try {
    const ctx = getAudioContext();
    await resumeAudioContext();
    const resp = await fetch(audioUrl);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const arrayBuf = await resp.arrayBuffer();
    _buffer = await ctx.decodeAudioData(arrayBuf);

    if (!_gainNode) {
      _gainNode = ctx.createGain();
      _gainNode.connect(ctx.destination);
    }

    const peaks = extractPeaks(_buffer, barCount);
    const bookmarks = loadBookmarks(filePath);
    _startOffset = 0;

    _store.update((s) => ({
      ...s,
      status: 'paused',
      durationSec: _buffer!.duration,
      positionSec: 0,
      waveformPeaks: peaks,
      bookmarks,
    }));

    log.info('[audioPlayer] loaded', { filePath, duration: _buffer.duration });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    _store.update((s) => ({ ...s, status: 'error', error: msg }));
    log.error('[audioPlayer] load error', { filePath, error: msg });
  }
}

/** Play or resume playback */
export function playAudio(): void {
  if (!_buffer || !_gainNode) return;
  const state = get(_store);
  if (state.status === 'playing') return;

  const ctx = getAudioContext();
  resumeAudioContext();

  _source = ctx.createBufferSource();
  _source.buffer = _buffer;
  _source.playbackRate.value = state.playbackRate;
  _source.connect(_gainNode);
  _gainNode.gain.value = state.volume;

  _startTime = ctx.currentTime;
  _source.start(0, _startOffset);
  _source.onended = () => {
    const cur = get(_store);
    if (cur.status === 'playing') stopAudio();
  };

  _store.update((s) => ({ ...s, status: 'playing' }));
  startPositionTracking();
  log.debug('[audioPlayer] play', { offset: _startOffset });
}

/** Pause playback (preserves position) */
export function pauseAudio(): void {
  const state = get(_store);
  if (state.status !== 'playing') return;

  const ctx = getAudioContext();
  _startOffset += ctx.currentTime - _startTime;
  _source?.stop();
  _source?.disconnect();
  _source = null;
  stopPositionTracking();

  _store.update((s) => ({ ...s, status: 'paused' }));
  log.debug('[audioPlayer] pause', { position: _startOffset });
}

/** Stop playback completely (resets position to 0) */
export function stopAudio(): void {
  _source?.stop();
  _source?.disconnect();
  _source = null;
  _startOffset = 0;
  stopPositionTracking();

  _store.update((s) => ({ ...s, status: s.currentFile ? 'paused' : 'idle', positionSec: 0 }));
  log.debug('[audioPlayer] stop');
}

/** Seek to a specific position in seconds */
export function seekAudio(sec: number): void {
  const state = get(_store);
  const clamped = Math.max(0, Math.min(sec, state.durationSec));
  const wasPlaying = state.status === 'playing';

  if (wasPlaying) {
    _source?.stop();
    _source?.disconnect();
    _source = null;
    stopPositionTracking();
  }

  _startOffset = clamped;
  _store.update((s) => ({ ...s, positionSec: clamped }));

  if (wasPlaying) playAudio();
  log.debug('[audioPlayer] seek', { sec: clamped });
}

/** Set volume (0–1) */
export function setPlayerVolume(vol: number): void {
  const v = Math.max(0, Math.min(1, vol));
  if (_gainNode) _gainNode.gain.value = v;
  _store.update((s) => ({ ...s, volume: v }));
}

/** Set playback rate (0.5–2) */
export function setPlaybackRate(rate: number): void {
  const r = Math.max(0.5, Math.min(2, rate));
  if (_source) _source.playbackRate.value = r;
  _store.update((s) => ({ ...s, playbackRate: r }));
}

/** Toggle play/pause */
export function togglePlayback(): void {
  const state = get(_store);
  if (state.status === 'playing') pauseAudio();
  else playAudio();
}

// ─── Bookmark actions ────────────────────────────────────────────────────────

/** Add a bookmark at a given time */
export function addBookmark(timeSec: number, label: string): void {
  const state = get(_store);
  if (!state.currentFile) return;
  const bm: AudioBookmark = { id: generatePrefixedId('bm'), timeSec, label };
  const updated = [...state.bookmarks, bm].sort((a, b) => a.timeSec - b.timeSec);
  _store.update((s) => ({ ...s, bookmarks: updated }));
  saveBookmarks(state.currentFile, updated);
  log.debug('[audioPlayer] addBookmark', { timeSec, label });
}

/** Remove a bookmark by ID */
export function removeBookmark(id: string): void {
  const state = get(_store);
  if (!state.currentFile) return;
  const updated = state.bookmarks.filter((b) => b.id !== id);
  _store.update((s) => ({ ...s, bookmarks: updated }));
  saveBookmarks(state.currentFile, updated);
}

/** Set bookmarks from parsed block text (merge with persisted) */
export function setBlockBookmarks(bookmarks: AudioBookmark[]): void {
  const state = get(_store);
  if (!state.currentFile) return;
  const persisted = loadBookmarks(state.currentFile);
  const ids = new Set(persisted.map((b) => b.id));
  const merged = [...persisted, ...bookmarks.filter((b) => !ids.has(b.id))].sort(
    (a, b) => a.timeSec - b.timeSec
  );
  _store.update((s) => ({ ...s, bookmarks: merged }));
  saveBookmarks(state.currentFile, merged);
}
