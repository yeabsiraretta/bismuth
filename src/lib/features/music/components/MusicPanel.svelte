<script lang="ts">
  /**
   * MusicPanel — top-level music feature panel.
   *
   * TransportBar at top, MusicCanvas in center, collapsible MixerPanel at bottom.
   * Wires TransportBar events to audioEngine store actions (T34).
   * "New Music Doc" empty state when no document is active.
   */
  import TransportBar from './TransportBar.svelte';
  import MusicCanvas from './MusicCanvas.svelte';
  import MixerPanel from './MixerPanel.svelte';
  import {
    activeMusicDoc,
    createMusicDocument,
    setPlaybackState,
    updateBpm,
  } from '../stores/musicStore';
  import { log } from '@/utils/logger';

  $: doc = $activeMusicDoc;

  let mixerCollapsed = false;

  function toggleMixer() {
    mixerCollapsed = !mixerCollapsed;
    log.debug('[MusicPanel] toggleMixer', { mixerCollapsed });
  }

  function handleNewDoc() {
    createMusicDocument('Untitled Music');
    log.info('[MusicPanel] new music document created');
  }

  // ─── TransportBar event handlers (T34) ──────────────────────────────────

  function handlePlay() {
    setPlaybackState('playing');
    log.info('[MusicPanel] play');
  }

  function handlePause() {
    setPlaybackState('paused');
    log.info('[MusicPanel] pause');
  }

  function handleStop() {
    setPlaybackState('stopped');
    log.info('[MusicPanel] stop');
  }

  function handleSetBpm(detail: { bpm: number }) {
    if (!doc) return;
    updateBpm(detail.bpm);
    log.info('[MusicPanel] bpm changed', { bpm: detail.bpm });
  }
</script>

<div class="music-panel">
  {#if doc}
    <!-- Transport -->
    <TransportBar
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onSetBpm={handleSetBpm}
    />

    <!-- Arrangement canvas -->
    <div class="canvas-area">
      <MusicCanvas />
    </div>

    <!-- Mixer (collapsible) -->
    <div class="mixer-section">
      <button
        class="mixer-toggle"
        on:click={toggleMixer}
        aria-expanded={!mixerCollapsed}
        aria-controls="mixer-content"
      >
        <span class="toggle-icon" class:rotated={mixerCollapsed}>&#9660;</span>
        Mixer
      </button>
      {#if !mixerCollapsed}
        <div id="mixer-content">
          <MixerPanel />
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty state -->
    <div class="empty-panel">
      <div class="empty-card">
        <div class="empty-icon" aria-hidden="true">&#9835;</div>
        <p class="empty-title">No music document</p>
        <p class="empty-desc">Create a new music document to start composing.</p>
        <button class="new-doc-btn" on:click={handleNewDoc}> New Music Doc </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .music-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-primary, #181825);
  }

  .canvas-area {
    flex: 1 1 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .mixer-section {
    flex-shrink: 0;
    border-top: 1px solid var(--background-modifier-border, #313244);
  }

  .mixer-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    width: 100%;
    background: var(--background-secondary, #1e1e2e);
    border: none;
    border-bottom: 1px solid var(--background-modifier-border, #313244);
    color: var(--text-muted, #a6adc8);
    font-size: var(--font-ui-small, 11px);
    padding: 4px var(--spacing-s, 8px);
    cursor: pointer;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: color 0.1s;
  }

  .mixer-toggle:hover {
    color: var(--text-normal, #cdd6f4);
  }

  .toggle-icon {
    display: inline-block;
    transition: transform 0.15s;
    font-size: 10px;
  }

  .toggle-icon.rotated {
    transform: rotate(-90deg);
  }

  /* Empty state */
  .empty-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: var(--spacing-l, 24px);
  }

  .empty-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s, 8px);
    text-align: center;
    max-width: 280px;
  }

  .empty-icon {
    font-size: 40px;
    color: var(--text-muted, #a6adc8);
    line-height: 1;
  }

  .empty-title {
    font-size: var(--font-ui-medium, 13px);
    font-weight: 600;
    color: var(--text-normal, #cdd6f4);
    margin: 0;
  }

  .empty-desc {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
    margin: 0;
  }

  .new-doc-btn {
    margin-top: var(--spacing-xs, 4px);
    padding: var(--spacing-xs, 6px) var(--spacing-m, 16px);
    background: var(--interactive-accent, #dc2626);
    color: #fff;
    border: none;
    border-radius: var(--radius-m, 6px);
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.1s;
  }

  .new-doc-btn:hover {
    filter: brightness(1.1);
  }
</style>
