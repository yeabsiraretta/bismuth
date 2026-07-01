<script lang="ts">
  /**
   * VideoTimeline — timeline scrubber with trim handles for VideoEditor.
   *
   * Emits:
   *   scrub       { time: number }         — playhead moved
   *   trimChange  { start, end: number }   — trim range changed
   *   durationChange { duration: number }  — duration updated by parent
   */
  export let duration: number = 0;
  export let currentTime: number = 0;
  export let trimStart: number = 0;
  export let trimEnd: number = 0;
  export let disabled: boolean = false;
  export let onScrub: ((detail: { time: number }) => void) | undefined = undefined;
  export let onTrimChange: ((detail: { start: number; end: number }) => void) | undefined = undefined;
  export let onDurationChange: ((detail: { duration: number }) => void) | undefined = undefined;

  let trackEl: HTMLDivElement | null = null;

  function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  function positionToTime(clientX: number): number {
    if (!trackEl || duration <= 0) return 0;
    const rect = trackEl.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return ratio * duration;
  }

  $: playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  $: trimStartPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  $: trimEndPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  $: trimWidthPct = trimEndPct - trimStartPct;

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function handleTrackClick(e: MouseEvent): void {
    if (disabled) return;
    const t = positionToTime(e.clientX);
    onScrub?.({ time: t });
  }

  function handleTrackKeydown(e: KeyboardEvent): void {
    if (disabled || duration <= 0) return;
    const step = duration * 0.02;
    if (e.key === 'ArrowLeft') { e.preventDefault(); onScrub?.({ time: clamp(currentTime - step, 0, duration) }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onScrub?.({ time: clamp(currentTime + step, 0, duration) }); }
  }

  function handleTrimStartInput(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    const clamped = clamp(v, 0, trimEnd - 0.1);
    onTrimChange?.({ start: clamped, end: trimEnd });
  }

  function handleTrimEndInput(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    const clamped = clamp(v, trimStart + 0.1, duration);
    onTrimChange?.({ start: trimStart, end: clamped });
  }
</script>

<div class="video-timeline" class:disabled>
  <!-- Timeline track -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="timeline-track"
    bind:this={trackEl}
    on:click={handleTrackClick}
    on:keydown={handleTrackKeydown}
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-label="Video timeline scrubber"
    aria-valuemin={0}
    aria-valuemax={Math.round(duration)}
    aria-valuenow={Math.round(currentTime)}
    aria-disabled={disabled}
  >
    <!-- Trim region highlight -->
    <div
      class="trim-region"
      style="left: {trimStartPct}%; width: {trimWidthPct}%"
    ></div>

    <!-- Playhead -->
    <div
      class="playhead"
      style="left: {playheadPct}%"
      aria-hidden="true"
    ></div>

    {#if duration <= 0}
      <div class="no-video-label" aria-live="polite">No video loaded</div>
    {/if}
  </div>

  <!-- Time stamps -->
  <div class="time-row" aria-hidden="true">
    <span class="time-label">{formatTime(currentTime)}</span>
    <span class="time-label time-label--end">{formatTime(duration)}</span>
  </div>

  <!-- Trim handles -->
  <div class="trim-controls" role="group" aria-label="Trim controls">
    <label class="trim-label">
      <span>Trim start</span>
      <input
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={trimStart}
        {disabled}
        on:input={handleTrimStartInput}
        aria-label="Trim start time"
      />
      <span class="trim-time">{formatTime(trimStart)}</span>
    </label>
    <label class="trim-label">
      <span>Trim end</span>
      <input
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={trimEnd}
        {disabled}
        on:input={handleTrimEndInput}
        aria-label="Trim end time"
      />
      <span class="trim-time">{formatTime(trimEnd)}</span>
    </label>
  </div>
</div>

<style>
  .video-timeline { display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); padding: var(--spacing-s, 8px) var(--spacing-m, 12px); border-bottom: 1px solid var(--border-color, #e5e7eb); background: var(--background-secondary, #f9fafb); flex-shrink: 0; }
  .video-timeline.disabled { opacity: 0.45; pointer-events: none; }
  .timeline-track { position: relative; height: 32px; background: var(--background-modifier-border, #e5e7eb); border-radius: var(--radius-s, 4px); cursor: pointer; overflow: hidden; }
  .timeline-track:focus-visible { outline: 2px solid var(--interactive-accent, #3b82f6); outline-offset: 2px; }
  .trim-region { position: absolute; top: 0; height: 100%; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); pointer-events: none; }
  .playhead { position: absolute; top: 0; width: 2px; height: 100%; background: var(--interactive-accent, #3b82f6); transform: translateX(-50%); pointer-events: none; }
  .no-video-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: var(--font-ui-smaller, 11px); color: var(--text-faint, #9ca3af); pointer-events: none; }
  .time-row { display: flex; justify-content: space-between; }
  .time-label { font-size: var(--font-ui-smaller, 10px); color: var(--text-faint, #9ca3af); font-variant-numeric: tabular-nums; }
  .time-label--end { text-align: right; }
  .trim-controls { display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); }
  .trim-label { display: flex; align-items: center; gap: var(--spacing-s, 8px); font-size: var(--font-ui-smaller, 11px); color: var(--text-muted, #6b7280); }
  .trim-label span:first-child { width: 60px; flex-shrink: 0; }
  .trim-label input[type='range'] { flex: 1; accent-color: var(--interactive-accent, #3b82f6); }
  .trim-time { width: 40px; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; color: var(--text-normal, #111827); }
</style>
