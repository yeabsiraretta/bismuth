<script lang="ts">
  /**
   * OcrBatchProgress — batch folder import with per-file status.
   *
   * Reads from ocrStore only — no direct service calls.
   * Folder picker uses Tauri dialog API.
   */
  import { pickImportFile } from '@/services/system/dialog';
  import {
    activeJobs, activeJobId, clearCompleted,
  } from '../stores/ocrStore';
  import { log } from '@/utils/logger';
  import type { OcrJob, OcrJobStatus } from '../types/ocr';

  // ─── State ────────────────────────────────────────────────────────────────

  $: jobs = $activeJobs;
  $: total = jobs.length;
  $: completed = jobs.filter((j) => j.status === 'complete' || j.status === 'error').length;
  $: running = jobs.filter((j) => j.status === 'running').length;
  $: progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  $: isBatchActive = running > 0;

  // ─── Status helpers ───────────────────────────────────────────────────────

  const STATUS_LABEL: Record<OcrJobStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    complete: 'Complete',
    error: 'Error',
  };

  function fileName(job: OcrJob): string {
    return job.imagePath.split('/').pop() ?? job.imagePath;
  }

  // ─── Folder picker ────────────────────────────────────────────────────────

  let folderPath: string | null = null;
  let discovering = false;

  async function pickFolder() {
    discovering = true;
    try {
      const selected = await pickImportFile({
        directory: true,
        multiple: false,
      });
      if (selected) {
        folderPath = String(selected);
        log.info('[OcrBatchProgress] folder selected', { folderPath });
        // Full batch enqueue logic is wired in Phase 8 (T57)
        // Stub: just log the selected path
        log.info('[OcrBatchProgress] batch import stub — Phase 8 wires full enqueue');
      }
    } catch (err) {
      log.error('[OcrBatchProgress] pickFolder failed', err as Error);
    } finally {
      discovering = false;
    }
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  function handleCancel() {
    clearCompleted();
    log.info('[OcrBatchProgress] cancelled batch');
  }

  // ─── Review a job ─────────────────────────────────────────────────────────

  function openJob(job: OcrJob) {
    if (job.status === 'complete') {
      activeJobId.set(job.id);
    }
  }
</script>

<div class="batch-panel">
  <h3 class="panel-title">Batch OCR Import</h3>

  <!-- Folder picker -->
  <div class="row">
    <button
      class="btn btn--secondary"
      on:click={pickFolder}
      disabled={discovering}
      aria-busy={discovering}
    >
      {discovering ? 'Opening…' : 'Select Folder'}
    </button>
    {#if folderPath}
      <span class="folder-path" title={folderPath}>
        {folderPath.split('/').pop() ?? folderPath}
      </span>
    {/if}
  </div>

  <!-- Overall progress bar -->
  {#if total > 0}
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">{completed} / {total} files</span>
        <span class="progress-pct">{progressPct}%</span>
      </div>
      <div class="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div class="progress-fill" style="width:{progressPct}%"></div>
      </div>
    </div>

    <!-- Per-file list -->
    <ul class="job-list" aria-label="Batch job list">
      {#each jobs as job (job.id)}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          class="job-row job-row--{job.status}"
          on:click={() => openJob(job)}
          title={job.status === 'complete' ? 'Click to review' : undefined}
        >
          <span class="job-icon" aria-label={STATUS_LABEL[job.status]}>
            {#if job.status === 'queued'}
              <span class="icon-clock" aria-hidden="true">&#9202;</span>
            {:else if job.status === 'running'}
              <span class="spinner" aria-hidden="true"></span>
            {:else if job.status === 'complete'}
              <span class="icon-check" aria-hidden="true">&#10003;</span>
            {:else}
              <span class="icon-error" aria-hidden="true">&#9888;</span>
            {/if}
          </span>
          <span class="job-name">{fileName(job)}</span>
          <span class="job-status">{STATUS_LABEL[job.status]}</span>
          {#if job.error}
            <span class="job-error" title={job.error}>!</span>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Cancel button -->
    <button
      class="btn btn--danger"
      on:click={handleCancel}
      disabled={!isBatchActive}
    >
      Cancel All
    </button>
  {:else}
    <p class="empty-hint">Select a folder to discover image files for batch OCR.</p>
  {/if}
</div>

<style>
  .batch-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px);
  }

  .panel-title {
    font-size: var(--font-ui-medium, 14px);
    font-weight: 600;
    color: var(--text-normal, #cdd6f4);
    margin: 0;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
  }

  .folder-path {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-normal, #cdd6f4);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160px;
  }

  .progress-section { display: flex; flex-direction: column; gap: 4px; }

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
  }

  .progress-bar {
    height: 6px;
    background: var(--background-modifier-hover, #313244);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--interactive-accent, #6366f1);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .job-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 240px;
    overflow-y: auto;
  }

  .job-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    font-size: var(--font-ui-small, 11px);
    padding: 3px 4px;
    border-radius: var(--radius-xs, 2px);
    cursor: default;
  }

  .job-row--complete { cursor: pointer; }
  .job-row--complete:hover { background: var(--background-modifier-hover, #313244); }

  .job-icon { width: 16px; text-align: center; flex-shrink: 0; }

  .icon-check { color: var(--text-success, #a6e3a1); }
  .icon-error { color: var(--text-warning, #f9e2af); }
  .icon-clock { color: var(--text-faint, #6c7086); }

  .spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--interactive-accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .job-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-normal, #cdd6f4);
  }

  .job-status { flex-shrink: 0; color: var(--text-muted, #a6adc8); }
  .job-error { color: var(--text-error, #f38ba8); font-weight: 700; cursor: help; }

  .empty-hint { font-size: var(--font-ui-small, 11px); color: var(--text-faint, #6c7086); margin: 0; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    border: none;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    padding: 5px 12px;
    transition: filter 0.1s;
    align-self: flex-start;
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn:not(:disabled):hover { filter: brightness(1.1); }

  .btn--secondary {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-normal, #cdd6f4);
  }

  .btn--danger {
    background: var(--background-modifier-error, #45182a);
    color: var(--text-error, #f38ba8);
    border: 1px solid var(--border-error, #f38ba8);
  }
</style>
