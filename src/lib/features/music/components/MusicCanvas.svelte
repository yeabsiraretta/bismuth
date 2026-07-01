<script lang="ts">
  /**
   * MusicCanvas — DAW arrangement view.
   *
   * Renders timeline ruler, track lanes, and clip blocks.
   * Reads from musicStore only — NO invoke() calls, NO Web Audio imports.
   * Export actions are delegated to MusicExportMenu.
   */
  import {
    activeMusicDoc,
    addTrack,
    selectClip,
    selectTrack,
    selectedTrackId,
    selectedClipId,
  } from '../stores/musicStore';
  import type { Track, AudioClip } from '../types/music';
  import MusicExportMenu from './MusicExportMenu.svelte';
  import { log } from '@/utils/logger';

  export let onOpenPianoRoll: ((detail: { clipId: string }) => void) | undefined = undefined;
  export let onOpenWaveform: ((detail: { clipId: string }) => void) | undefined = undefined;

  // ─── Layout constants ─────────────────────────────────────────────────────
  const BAR_WIDTH = 80;       // px per bar
  const LANE_HEIGHT = 56;     // px per track lane

  $: doc = $activeMusicDoc;
  $: tracks = doc?.tracks ?? [];
  $: totalBars = doc?.totalBars ?? 16;
  $: timelineWidth = totalBars * BAR_WIDTH;

  // ─── Bar ruler ────────────────────────────────────────────────────────────

  $: barNumbers = Array.from({ length: totalBars }, (_, i) => i + 1);

  // ─── Clip interactions ────────────────────────────────────────────────────

  function onClipClick(e: MouseEvent, clip: AudioClip) {
    e.stopPropagation();
    selectClip(clip.id, clip.trackId);
    if (clip.type === 'midi') {
      onOpenPianoRoll?.({ clipId: clip.id });
      log.info('[MusicCanvas] openPianoRoll', { clipId: clip.id });
    } else if (clip.type === 'audio') {
      onOpenWaveform?.({ clipId: clip.id });
      log.info('[MusicCanvas] openWaveform', { clipId: clip.id });
    }
  }

  function onLaneClick(track: Track) {
    selectTrack(track.id);
  }

  // ─── Add track ────────────────────────────────────────────────────────────

  function onAddTrack() {
    if (!doc) return;
    addTrack('audio');
    log.info('[MusicCanvas] addTrack');
  }

  // ─── Clip position helpers ────────────────────────────────────────────────

  function clipLeft(clip: AudioClip): string {
    return `${(clip.startBar - 1) * BAR_WIDTH}px`;
  }

  function clipWidth(clip: AudioClip): string {
    return `${clip.durationBars * BAR_WIDTH}px`;
  }

  function clipColor(track: Track): string {
    return track.color ?? '#6366f1';
  }
</script>

<div class="music-canvas" aria-label="Music arrangement">
  {#if !doc}
    <!-- Empty state -->
    <div class="empty-state">
      <p>No music document open.</p>
    </div>
  {:else}
    <!-- Header row: label column + ruler + export menu -->
    <div class="canvas-header">
      <div class="label-col label-col--header" aria-hidden="true">
        <span class="header-title">Tracks</span>
      </div>
      <div class="ruler-scroll">
        <div class="ruler" style="width:{timelineWidth}px" role="presentation">
          {#each barNumbers as bar}
            <div
              class="ruler-mark"
              style="width:{BAR_WIDTH}px"
              aria-label="Bar {bar}"
            >
              <span class="ruler-label">{bar}</span>
            </div>
          {/each}
        </div>
      </div>
      <div class="export-area">
        <MusicExportMenu />
      </div>
    </div>

    <!-- Track lanes -->
    <div class="lanes-container">
      {#each tracks as track (track.id)}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="track-row"
          class:selected={$selectedTrackId === track.id}
          aria-selected={$selectedTrackId === track.id}
          on:click={() => onLaneClick(track)}
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
        >
          <!-- Label -->
          <div
            class="label-col"
            style="border-left: 3px solid {clipColor(track)}"
          >
            <span class="track-type">{track.type}</span>
            <span class="track-name" title={track.name}>{track.name}</span>
          </div>

          <!-- Clip lane -->
          <div
            class="clip-lane"
            style="width:{timelineWidth}px; height:{LANE_HEIGHT}px"
            role="listitem"
            aria-label="Clips for {track.name}"
          >
            {#each track.clips as clip (clip.id)}
              <button
                class="clip-block"
                class:selected={$selectedClipId === clip.id}
                style="
                  left: {clipLeft(clip)};
                  width: {clipWidth(clip)};
                  background-color: {clipColor(track)};
                "
                on:click={(e) => onClipClick(e, clip)}
                aria-label="Clip: {clip.name} at bar {clip.startBar}"
                title={clip.name}
              >
                <span class="clip-name">{clip.name}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}

      <!-- Add track row -->
      <div class="add-track-row">
        <button
          class="add-track-btn"
          on:click={onAddTrack}
          aria-label="Add new track"
          title="Add audio track"
        >
          <span aria-hidden="true">&#43;</span>
          Add Track
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .music-canvas { display: flex; flex-direction: column; flex: 1 1 0; overflow: hidden; background: var(--background-primary, #181825); font-size: var(--font-ui-small, 11px); }
  .empty-state { display: flex; align-items: center; justify-content: center; flex: 1; color: var(--text-muted, #a6adc8); font-size: var(--font-ui-medium, 13px); }
  .canvas-header { display: flex; flex-direction: row; flex-shrink: 0; border-bottom: 1px solid var(--background-modifier-border, #313244); background: var(--background-secondary, #1e1e2e); }
  .label-col--header { display: flex; align-items: center; padding: 0 var(--spacing-s); font-weight: 600; color: var(--text-muted); }
  .header-title { font-size: var(--font-ui-small); text-transform: uppercase; letter-spacing: 0.06em; }
  .ruler-scroll { flex: 1; overflow-x: auto; overflow-y: hidden; }
  .ruler { display: flex; flex-direction: row; height: 28px; position: relative; }
  .ruler-mark { flex-shrink: 0; display: flex; align-items: center; border-right: 1px solid var(--background-modifier-border); padding: 0 var(--spacing-xs); }
  .ruler-label { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .export-area { flex-shrink: 0; display: flex; align-items: center; padding: 0 var(--spacing-xs, 4px); border-left: 1px solid var(--background-modifier-border, #313244); }
  .lanes-container { flex: 1; overflow: auto; }
  .track-row { display: flex; flex-direction: row; height: 56px; border-bottom: 1px solid var(--background-modifier-border); cursor: pointer; transition: background 0.1s; }
  .track-row:hover { background: var(--background-modifier-hover); }
  .track-row.selected { background: var(--background-modifier-active-hover); }
  .label-col { flex-shrink: 0; width: 120px; display: flex; flex-direction: column; justify-content: center; padding: 0 var(--spacing-s); border-right: 1px solid var(--background-modifier-border); background: var(--background-secondary); overflow: hidden; gap: 2px; }
  .track-type { font-size: 9px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; }
  .track-name { font-size: var(--font-ui-small, 11px); color: var(--text-normal, #cdd6f4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .clip-lane { position: relative; flex: 1; overflow: visible; }
  .clip-block { position: absolute; top: 4px; height: calc(100% - 8px); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-s, 4px); padding: 2px 4px; cursor: pointer; overflow: hidden; display: flex; align-items: flex-start; background-color: var(--interactive-accent, #6366f1); transition: filter 0.1s; }
  .clip-block:hover { filter: brightness(1.15); }
  .clip-block.selected { outline: 2px solid #fff; outline-offset: 1px; }
  .clip-name { font-size: 10px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
  .add-track-row { display: flex; align-items: center; padding: var(--spacing-xs, 4px) var(--spacing-s, 8px); border-bottom: 1px solid var(--background-modifier-border, #313244); }
  .add-track-btn { display: flex; align-items: center; gap: var(--spacing-xs, 4px); background: none; border: 1px dashed var(--background-modifier-border, #45475a); border-radius: var(--radius-s, 4px); color: var(--text-muted, #a6adc8); cursor: pointer; font-size: var(--font-ui-small, 11px); padding: 4px 12px; transition: color 0.1s, border-color 0.1s; }
  .add-track-btn:hover { color: var(--text-normal, #cdd6f4); border-color: var(--text-muted, #a6adc8); }
</style>
