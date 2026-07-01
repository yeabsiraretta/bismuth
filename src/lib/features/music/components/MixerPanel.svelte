<script lang="ts">
  /**
   * MixerPanel — per-track volume, pan, mute, solo, color, and name editing.
   *
   * Wires Web Audio gain/pan/mute via audioContext.ts service functions.
   * Track data state (volume, pan, muted values) stays in musicStore.
   * Does NOT import 'tone'.
   */
  import { activeMusicDoc, updateTrack } from '../stores/musicStore';
  import {
    connectTrackToOutput,
    setTrackPan,
    muteTrack,
  } from '../services/audioContext';
  import type { Track } from '../types/music';
  import { log } from '@/utils/logger';

  export let onVolumeChange: ((detail: { trackId: string; volume: number }) => void) | undefined = undefined;
  export let onPanChange: ((detail: { trackId: string; pan: number }) => void) | undefined = undefined;
  export let onMuteChange: ((detail: { trackId: string; muted: boolean }) => void) | undefined = undefined;
  export let onSoloChange: ((detail: { trackId: string; soloed: boolean }) => void) | undefined = undefined;

  $: tracks = $activeMusicDoc?.tracks ?? [];

  // ─── Track name editing ───────────────────────────────────────────────────

  let editingId: string | null = null;
  let editingName: string = '';

  function startEdit(track: Track) {
    editingId = track.id;
    editingName = track.name;
  }

  function commitEdit(track: Track) {
    if (editingId === track.id && editingName.trim()) {
      updateTrack(track.id, { name: editingName.trim() });
    }
    editingId = null;
  }

  function onNameKeydown(e: KeyboardEvent, track: Track) {
    if (e.key === 'Enter') commitEdit(track);
    if (e.key === 'Escape') editingId = null;
  }

  // ─── Volume ───────────────────────────────────────────────────────────────

  function handleVolumeInput(track: Track, e: Event) {
    const raw = Number((e.target as HTMLInputElement).value);
    const volume = Math.max(0, Math.min(100, raw)) / 100;
    updateTrack(track.id, { volume });
    connectTrackToOutput(track.id, volume);
    onVolumeChange?.({ trackId: track.id, volume });
    log.debug('[MixerPanel] volumeChange', { trackId: track.id, volume });
  }

  // ─── Pan ──────────────────────────────────────────────────────────────────

  function handlePanInput(track: Track, e: Event) {
    const raw = Number((e.target as HTMLInputElement).value);
    const pan = Math.max(-100, Math.min(100, raw)) / 100;
    updateTrack(track.id, { pan });
    setTrackPan(track.id, pan);
    onPanChange?.({ trackId: track.id, pan });
    log.debug('[MixerPanel] panChange', { trackId: track.id, pan });
  }

  // ─── Mute / Solo ──────────────────────────────────────────────────────────

  function toggleMute(track: Track) {
    const muted = !track.muted;
    updateTrack(track.id, { muted });
    muteTrack(track.id, muted, track.volume);
    onMuteChange?.({ trackId: track.id, muted });
    log.debug('[MixerPanel] muteChange', { trackId: track.id, muted });
  }

  function toggleSolo(track: Track) {
    const soloed = !track.soloed;
    updateTrack(track.id, { soloed });
    onSoloChange?.({ trackId: track.id, soloed });
    log.debug('[MixerPanel] soloChange', { trackId: track.id, soloed });
  }

  // ─── Color ────────────────────────────────────────────────────────────────

  function onColorChange(track: Track, e: Event) {
    const color = (e.target as HTMLInputElement).value;
    updateTrack(track.id, { color });
  }
</script>

<div class="mixer-panel" role="region" aria-label="Mixer">
  {#if tracks.length === 0}
    <div class="mixer-empty">
      <span>No tracks. Add a track in the arrangement view.</span>
    </div>
  {:else}
    <div class="mixer-scroll">
      {#each tracks as track (track.id)}
        <div
          class="track-channel"
          class:muted={track.muted}
          class:soloed={track.soloed}
          aria-label="Track channel: {track.name}"
        >
          <!-- Color swatch -->
          <div class="color-row">
            <input
              type="color"
              class="color-swatch"
              value={track.color}
              on:input={(e) => onColorChange(track, e)}
              aria-label="Track color for {track.name}"
              title="Track color"
            />
          </div>

          <!-- Track name -->
          <div class="name-row">
            {#if editingId === track.id}
              <!-- svelte-ignore a11y_autofocus -->
              <input
                class="name-input"
                type="text"
                bind:value={editingName}
                on:blur={() => commitEdit(track)}
                on:keydown={(e) => onNameKeydown(e, track)}
                aria-label="Edit track name"
                autofocus
              />
            {:else}
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <span
                class="name-label"
                on:dblclick={() => startEdit(track)}
                title="Double-click to rename"
              >{track.name}</span>
            {/if}
          </div>

          <!-- Volume fader (vertical) -->
          <div class="fader-row" aria-label="Volume">
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <input
              type="range"
              class="volume-fader"
              style="writing-mode: vertical-lr; direction: rtl;"
              min="0"
              max="100"
              value={Math.round(track.volume * 100)}
              on:input={(e) => handleVolumeInput(track, e)}
              aria-label="Volume for {track.name}"
              aria-valuenow={Math.round(track.volume * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            <span class="fader-value">{Math.round(track.volume * 100)}</span>
          </div>

          <!-- Pan -->
          <div class="pan-row" aria-label="Pan">
            <label class="pan-label" for="pan-{track.id}">Pan</label>
            <input
              id="pan-{track.id}"
              type="range"
              class="pan-knob"
              min="-100"
              max="100"
              value={Math.round(track.pan * 100)}
              on:input={(e) => handlePanInput(track, e)}
              aria-label="Pan for {track.name}"
              aria-valuenow={Math.round(track.pan * 100)}
            />
            <span class="pan-value">{Math.round(track.pan * 100)}</span>
          </div>

          <!-- Mute / Solo -->
          <div class="ms-row">
            <button
              class="ms-btn mute-btn"
              class:active={track.muted}
              on:click={() => toggleMute(track)}
              aria-pressed={track.muted}
              aria-label="Mute {track.name}"
              title="Mute"
            >M</button>
            <button
              class="ms-btn solo-btn"
              class:active={track.soloed}
              on:click={() => toggleSolo(track)}
              aria-pressed={track.soloed}
              aria-label="Solo {track.name}"
              title="Solo"
            >S</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mixer-panel {
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
    overflow: hidden;
    min-height: 160px;
    max-height: 220px;
  }
  .mixer-empty {
    display: flex; align-items: center; justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    padding: var(--spacing-m);
  }
  .mixer-scroll {
    display: flex; flex-direction: row; align-items: stretch;
    gap: 1px; height: 100%;
    overflow-x: auto; overflow-y: hidden;
    padding: var(--spacing-xs);
  }
  .track-channel {
    display: flex; flex-direction: column; align-items: center;
    gap: var(--spacing-xs);
    min-width: 72px; max-width: 80px;
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border-radius: var(--radius-s);
    border: 1px solid var(--background-modifier-border);
    transition: opacity 0.15s;
  }
  .track-channel.muted { opacity: 0.45; }
  .track-channel.soloed { border-color: var(--interactive-accent); }
  .color-row { display: flex; justify-content: center; }
  .color-swatch { width: 24px; height: 16px; border: none; border-radius: 2px; padding: 0; cursor: pointer; background: none; }
  .name-row { width: 100%; text-align: center; overflow: hidden; }
  .name-label {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    cursor: text; user-select: none;
  }
  .name-input {
    width: 100%; font-size: var(--font-ui-small);
    background: var(--background-modifier-hover);
    border: 1px solid var(--interactive-accent);
    border-radius: 2px; color: var(--text-normal);
    padding: 1px 4px; text-align: center;
  }
  .fader-row { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
  .volume-fader {
    appearance: slider-vertical; -webkit-appearance: slider-vertical;
    width: 20px; height: 80px; cursor: pointer;
    accent-color: var(--interactive-accent);
  }
  .fader-value { font-size: 10px; color: var(--text-muted); }
  .pan-row { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .pan-label { font-size: 10px; color: var(--text-muted); }
  .pan-knob { width: 60px; cursor: pointer; accent-color: var(--interactive-accent); }
  .pan-value { font-size: 10px; color: var(--text-muted); min-width: 28px; text-align: center; }
  .ms-row { display: flex; gap: 4px; }
  .ms-btn {
    width: 24px; height: 24px; font-size: 11px; font-weight: 700;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s); cursor: pointer;
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    transition: background 0.1s, color 0.1s;
    padding: 0; line-height: 1;
  }
  .ms-btn:hover { background: var(--background-modifier-active-hover); color: var(--text-normal); }
  .mute-btn.active { background: #f59e0b; color: #000; border-color: #f59e0b; }
  .solo-btn.active { background: var(--interactive-accent); color: #fff; border-color: var(--interactive-accent); }
</style>
