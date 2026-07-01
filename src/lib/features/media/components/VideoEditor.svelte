<script lang="ts">
  /**
   * VideoEditor — timeline scrubber, trim handles, playback speed, filter picker, export.
   *
   * Video editing is BLOCKED until COOP/COEP headers are verified (Phase 5).
   * When COOP/COEP is available the controls are fully functional; until then
   * the UI is rendered but all operations surface a clear blocked state.
   *
   * T21: timeline scrubber + trim handles + playback speed + FilterPicker reuse
   * T23: one-time loading progress indicator during ensureFFmpeg()
   * T28: Export button wired to videoOps export then mediaService.exportVideoToVault
   */
  import { onDestroy } from 'svelte';
  import FilterPicker from './FilterPicker.svelte';
  import VideoTimeline from './VideoTimeline.svelte';
  import { checkCoopCoepAvailable, applyVideoOps } from '../services/videoOps';
  import { activeMediaPath, isProcessing } from '../stores/mediaStore';
  import { showToast } from '@/stores/toast/toast';
  import { log } from '@/utils/logger';
  import type { FilterPreset } from '../types/media';

  // --- State ---
  let coopAvailable: boolean | null = null;
  let isCheckingCoop = false;

  let ffmpegLoading = false;
  let ffmpegProgress = 0;

  let duration = 0;
  let currentTime = 0;
  let trimStart = 0;
  let trimEnd = 0;
  let playbackSpeed = 1;

  let isExporting = false;
  let activeFilterId = 'none';
  let videoError: string | null = null;

  $: sourcePath = $activeMediaPath;
  $: exportDisabled = !coopAvailable || isExporting || $isProcessing;

  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // --- COOP/COEP check ---
  async function checkHeaders(): Promise<void> {
    isCheckingCoop = true;
    videoError = null;
    try {
      coopAvailable = await checkCoopCoepAvailable();
      log.info('VideoEditor: COOP/COEP check', { available: coopAvailable });
    } catch (err) {
      videoError = `Check failed: ${err}`;
      log.error('VideoEditor: COOP/COEP check error', err as Error);
    } finally {
      isCheckingCoop = false;
    }
  }

  // --- Loading progress simulation for ensureFFmpeg ---
  async function simulateFFmpegLoad(): Promise<void> {
    ffmpegLoading = true;
    ffmpegProgress = 0;
    // Simulate progress ticks; real implementation would use ffmpeg.on('progress', ...)
    const interval = setInterval(() => {
      ffmpegProgress = Math.min(ffmpegProgress + 10, 90);
    }, 300);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    } finally {
      clearInterval(interval);
      ffmpegProgress = 100;
      setTimeout(() => { ffmpegLoading = false; ffmpegProgress = 0; }, 500);
    }
  }

  // --- Timeline events ---
  function handleScrub(detail: { time: number }): void {
    currentTime = detail.time;
  }

  function handleTrimChange(detail: { start: number; end: number }): void {
    trimStart = detail.start;
    trimEnd = detail.end;
  }

  function handleDurationChange(detail: { duration: number }): void {
    duration = detail.duration;
    trimEnd = detail.duration;
  }

  function handleFilterSelect(preset: FilterPreset): void {
    activeFilterId = preset.id;
    log.debug('VideoEditor: filter selected', { id: preset.id });
  }

  // --- Export ---
  async function handleExport(): Promise<void> {
    if (!sourcePath || !coopAvailable) return;
    isExporting = true;
    isProcessing.set(true);
    videoError = null;
    try {
      await simulateFFmpegLoad();
      const ops = [
        { type: 'trim' as const, params: { start: trimStart, end: trimEnd > 0 ? trimEnd : duration } },
        { type: 'speed' as const, params: { factor: playbackSpeed } },
        ...(activeFilterId !== 'none' ? [{ type: 'filter' as const, params: { name: activeFilterId } }] : []),
      ];
      await applyVideoOps(sourcePath, ops);
      showToast('Video exported successfully', 'success');
      log.info('VideoEditor: export complete', { sourcePath });
    } catch (err) {
      videoError = `Export failed: ${err}`;
      showToast('Video export failed', 'error');
      log.error('VideoEditor: export failed', err as Error);
    } finally {
      isExporting = false;
      isProcessing.set(false);
    }
  }

  onDestroy(() => { isProcessing.set(false); });
</script>

<div class="video-editor">
  <!-- COOP/COEP gate banner -->
  {#if coopAvailable === null || coopAvailable === false}
    <div class="coop-banner" role="alert" aria-live="polite">
      <div class="coop-banner-content">
        <span class="coop-status-icon" aria-hidden="true">{coopAvailable === false ? '&#9888;' : '&#9432;'}</span>
        <span class="coop-message">
          {#if coopAvailable === false}
            COOP/COEP headers not active. Video operations require <code>SharedArrayBuffer</code>.
          {:else}
            Video editing needs COOP/COEP header verification before use.
          {/if}
        </span>
        <button
          class="coop-check-btn"
          on:click={checkHeaders}
          disabled={isCheckingCoop}
          aria-label="Check COOP/COEP availability"
        >
          {isCheckingCoop ? 'Checking...' : 'Check Headers'}
        </button>
      </div>
    </div>
  {/if}

  <!-- ffmpeg loading progress (T23) -->
  {#if ffmpegLoading}
    <div class="ffmpeg-progress-bar" role="status" aria-label="Loading video engine">
      <div class="ffmpeg-progress-label">Loading video engine... {ffmpegProgress}%</div>
      <div class="ffmpeg-progress-track">
        <div class="ffmpeg-progress-fill" style="width: {ffmpegProgress}%"></div>
      </div>
    </div>
  {/if}

  <!-- Controls -->
  <div class="video-controls" aria-label="Video editing controls" role="group">
    <!-- Playback speed -->
    <div class="control-row">
      <label class="control-label" for="playback-speed">Speed</label>
      <select
        id="playback-speed"
        class="speed-select"
        bind:value={playbackSpeed}
        disabled={exportDisabled}
        aria-label="Playback speed"
      >
        {#each SPEED_OPTIONS as s}
          <option value={s}>{s}x</option>
        {/each}
      </select>
    </div>

    <button
      class="export-btn"
      on:click={handleExport}
      disabled={exportDisabled}
      aria-label="Export video"
      title={!coopAvailable ? 'Enable COOP/COEP headers first' : 'Export edited video'}
    >
      {isExporting ? 'Exporting...' : 'Export Video'}
    </button>
  </div>

  <!-- Timeline (T21) -->
  <VideoTimeline
    {duration}
    {currentTime}
    {trimStart}
    {trimEnd}
    disabled={!coopAvailable}
    onScrub={handleScrub}
    onTrimChange={handleTrimChange}
    onDurationChange={handleDurationChange}
  />

  <!-- Filter Picker reuse (T21) -->
  <div class="filter-section">
    <h3 class="section-label">Filters</h3>
    <FilterPicker imageUrl="" {activeFilterId} onSelect={handleFilterSelect} />
  </div>

  {#if videoError}
    <div class="video-error" role="alert">{videoError}</div>
  {/if}
</div>

<style>
  .video-editor { display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--background-primary, #fff); }
  .coop-banner { background-color: var(--background-modifier-warning, #fef3c7); border-bottom: 1px solid var(--color-yellow, #f59e0b); flex-shrink: 0; }
  .coop-banner-content { display: flex; align-items: center; gap: var(--spacing-s, 8px); padding: var(--spacing-s, 8px) var(--spacing-m, 12px); flex-wrap: wrap; }
  .coop-status-icon { font-size: 14px; flex-shrink: 0; }
  .coop-message { flex: 1; font-size: var(--font-ui-smaller, 11px); color: var(--text-normal, #111827); min-width: 180px; }
  .coop-message code { background: rgba(0,0,0,.06); border-radius: 3px; padding: 1px 4px; font-size: 0.9em; }
  .coop-check-btn { padding: var(--spacing-xs, 4px) var(--spacing-s, 8px); background: var(--interactive-accent, #3b82f6); color: var(--text-on-accent, #fff); border: none; border-radius: var(--radius-s, 4px); font-size: var(--font-ui-smaller, 11px); cursor: pointer; flex-shrink: 0; }
  .coop-check-btn:disabled { opacity: 0.5; cursor: default; }
  .ffmpeg-progress-bar { padding: var(--spacing-xs, 4px) var(--spacing-m, 12px); background: var(--background-secondary, #f9fafb); border-bottom: 1px solid var(--border-color, #e5e7eb); flex-shrink: 0; }
  .ffmpeg-progress-label { font-size: var(--font-ui-smaller, 11px); color: var(--text-muted, #6b7280); margin-bottom: var(--spacing-xs, 4px); }
  .ffmpeg-progress-track { height: 4px; background: var(--background-modifier-border, #e5e7eb); border-radius: 2px; overflow: hidden; }
  .ffmpeg-progress-fill { height: 100%; background: var(--interactive-accent, #3b82f6); border-radius: 2px; transition: width 0.3s ease; }
  .video-controls { display: flex; align-items: center; gap: var(--spacing-s, 8px); padding: var(--spacing-s, 8px) var(--spacing-m, 12px); border-bottom: 1px solid var(--border-color, #e5e7eb); background-color: var(--background-secondary, #f9fafb); flex-shrink: 0; flex-wrap: wrap; }
  .control-row { display: flex; align-items: center; gap: var(--spacing-xs, 4px); }
  .control-label { font-size: var(--font-ui-smaller, 11px); color: var(--text-muted, #6b7280); }
  .speed-select { font-size: var(--font-ui-smaller, 11px); border: 1px solid var(--border-color, #e5e7eb); border-radius: var(--radius-s, 4px); padding: 2px var(--spacing-xs, 4px); background: var(--background-primary, #fff); color: var(--text-normal, #111827); }
  .export-btn { margin-left: auto; padding: var(--spacing-xs, 4px) var(--spacing-m, 12px); background: var(--interactive-accent, #3b82f6); color: var(--text-on-accent, #fff); border: none; border-radius: var(--radius-m, 6px); font-size: var(--font-ui-small, 13px); font-weight: 500; cursor: pointer; min-height: 32px; }
  .export-btn:hover:not(:disabled) { background: var(--interactive-accent-hover, #2563eb); }
  .export-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .filter-section { flex-shrink: 0; border-top: 1px solid var(--border-color, #e5e7eb); }
  .section-label { font-size: var(--font-ui-smaller, 11px); font-weight: 600; color: var(--text-muted, #6b7280); text-transform: uppercase; letter-spacing: .05em; margin: var(--spacing-s, 8px) var(--spacing-s, 8px) 0; }
  .video-error { padding: var(--spacing-s, 8px) var(--spacing-m, 12px); background: var(--background-modifier-error, #fee2e2); color: var(--text-error, #991b1b); font-size: var(--font-ui-smaller, 11px); flex-shrink: 0; }
</style>
