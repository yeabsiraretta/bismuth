<script lang="ts">
  /**
   * TransportBar — play/pause/stop, BPM, time signature, playback position.
   *
   * Does NOT import audioContext.ts or Tone.js directly.
   * Reads/writes via musicStore; dispatches events upward for Phase 6 wiring.
   */
  import {
    activeMusicDoc,
    playbackState,
    playbackPosition,
    setPlaybackState,
    updateBpm,
  } from '../stores/musicStore';
  import { log } from '@/utils/logger';

  export let onPlay: (() => void) | undefined = undefined;
  export let onPause: (() => void) | undefined = undefined;
  export let onStop: (() => void) | undefined = undefined;
  export let onSetBpm: ((detail: { bpm: number }) => void) | undefined = undefined;

  $: doc = $activeMusicDoc;
  $: state = $playbackState;
  $: position = $playbackPosition;

  // ─── BPM ──────────────────────────────────────────────────────────────────

  let bpmInput: number = doc?.bpm ?? 120;

  $: if (doc) bpmInput = doc.bpm;

  function clampBpm(val: number): number {
    return Math.min(300, Math.max(20, Math.round(val)));
  }

  function onBpmChange(e: Event) {
    const val = clampBpm(Number((e.target as HTMLInputElement).value));
    bpmInput = val;
    applyBpm(val);
  }

  function stepBpm(delta: number, shift: boolean) {
    const step = shift ? 10 : 1;
    const val = clampBpm(bpmInput + delta * step);
    bpmInput = val;
    applyBpm(val);
  }

  function applyBpm(val: number) {
    if (!doc) return;
    updateBpm(val);
    onSetBpm?.({ bpm: val });
    log.info('[TransportBar] BPM changed', { bpm: val });
  }

  // ─── Transport ────────────────────────────────────────────────────────────

  function handlePlay() {
    if (state === 'playing') {
      setPlaybackState('paused');
      onPause?.();
    } else {
      setPlaybackState('playing');
      onPlay?.();
    }
  }

  function handleStop() {
    setPlaybackState('stopped');
    onStop?.();
  }

  // ─── Position display ─────────────────────────────────────────────────────

  $: bars = Math.floor(position) + 1;
  $: beats = Math.floor((position % 1) * (doc?.timeSignatureNumerator ?? 4)) + 1;
  $: posDisplay = `${String(bars).padStart(2, '0')}:${String(beats).padStart(2, '0')}`;
</script>

<div class="transport-bar" role="toolbar" aria-label="Transport controls">
  <!-- Play / Pause -->
  <button
    class="transport-btn"
    class:active={state === 'playing'}
    on:click={handlePlay}
    aria-label={state === 'playing' ? 'Pause' : 'Play'}
    title={state === 'playing' ? 'Pause' : 'Play'}
    disabled={!doc}
  >
    {#if state === 'playing'}
      <span class="icon">&#9646;&#9646;</span>
    {:else}
      <span class="icon">&#9654;</span>
    {/if}
  </button>

  <!-- Stop -->
  <button
    class="transport-btn"
    on:click={handleStop}
    aria-label="Stop"
    title="Stop"
    disabled={!doc}
  >
    <span class="icon">&#9632;</span>
  </button>

  <div class="separator" aria-hidden="true"></div>

  <!-- BPM -->
  <div class="bpm-control" aria-label="BPM">
    <button
      class="step-btn"
      on:click={(e) => stepBpm(-1, e.shiftKey)}
      aria-label="Decrease BPM"
      title="Decrease BPM (Shift: -10)"
      disabled={!doc}>&#8722;</button
    >
    <label class="bpm-label" for="bpm-input">BPM</label>
    <input
      id="bpm-input"
      type="number"
      class="bpm-input"
      min="20"
      max="300"
      value={bpmInput}
      on:change={onBpmChange}
      disabled={!doc}
      aria-label="BPM value"
    />
    <button
      class="step-btn"
      on:click={(e) => stepBpm(1, e.shiftKey)}
      aria-label="Increase BPM"
      title="Increase BPM (Shift: +10)"
      disabled={!doc}>&#43;</button
    >
  </div>

  <div class="separator" aria-hidden="true"></div>

  <!-- Time signature -->
  {#if doc}
    <div class="time-sig" aria-label="Time signature">
      <span>{doc.timeSignatureNumerator}/{doc.timeSignatureDenominator}</span>
    </div>
  {/if}

  <div class="separator" aria-hidden="true"></div>

  <!-- Position -->
  <div class="position" aria-label="Playback position" aria-live="polite">
    <span class="pos-label">Bar:Beat</span>
    <span class="pos-value">{posDisplay}</span>
  </div>
</div>

<style>
  .transport-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    background: var(--background-secondary, #1e1e2e);
    border-bottom: 1px solid var(--background-modifier-border, #313244);
    height: 48px;
    flex-shrink: 0;
  }

  .transport-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
    padding: 0 var(--spacing-xs, 4px);
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.1s;
  }

  .transport-btn:hover:not(:disabled) {
    background: var(--background-modifier-active-hover, #45475a);
  }

  .transport-btn.active {
    background: var(--interactive-accent, #dc2626);
    color: #fff;
    border-color: var(--interactive-accent, #dc2626);
  }

  .transport-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .icon {
    font-style: normal;
    font-size: 16px;
    line-height: 1;
  }

  .separator {
    width: 1px;
    height: 24px;
    background: var(--background-modifier-border, #45475a);
    margin: 0 var(--spacing-xs, 4px);
  }

  .bpm-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
  }

  .bpm-label {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
    white-space: nowrap;
  }

  .step-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    line-height: 1;
  }

  .step-btn:hover:not(:disabled) {
    background: var(--background-modifier-active-hover, #45475a);
  }

  .step-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .bpm-input {
    width: 56px;
    text-align: center;
    background: var(--background-primary, #1e1e2e);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    font-size: var(--font-ui-small, 11px);
    padding: 2px 4px;
    height: 28px;
  }

  .bpm-input::-webkit-outer-spin-button,
  .bpm-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .time-sig {
    font-size: var(--font-ui-medium, 13px);
    color: var(--text-muted, #a6adc8);
    min-width: 36px;
    text-align: center;
  }

  .position {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
  }

  .pos-label {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
  }

  .pos-value {
    font-family: var(--font-mono, monospace);
    font-size: var(--font-ui-medium, 13px);
    color: var(--text-normal, #cdd6f4);
    min-width: 48px;
  }
</style>
