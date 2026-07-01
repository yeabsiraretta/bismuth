<script lang="ts">
  /**
   * VersionDiffView — displays unified diff text with syntax highlighting.
   *
   * Props:
   *   entry — VersionEntry to display the diff for
   *
   * On mount, reads the raw diff JSON from `entry.diffPath` via IPC.
   * Renders diff lines with color-coded backgrounds:
   *   - Lines starting with '+' → success background (green)
   *   - Lines starting with '-' → error background (red)
   *   - Other lines            → default background
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import { ipcCall } from '@/utils/ipc';
  import VersionBadge from './VersionBadge.svelte';
  import type { VersionEntry } from '../types/versioning';

  export let entry: VersionEntry;
  export let onBack: (() => void) | undefined = undefined;

  let diffLines: { text: string; type: 'added' | 'removed' | 'context' | 'meta' }[] = [];
  let loadError: string | null = null;
  let isLoading = true;

  onMount(async () => {
    await loadDiff();
  });

  $: if (entry) {
    loadDiff();
  }

  async function loadDiff() {
    isLoading = true;
    loadError = null;
    diffLines = [];
    try {
      // Read the JSON version file; the `diff_path` is relative to vault root.
      const raw = await ipcCall<string>('read_file_text', { path: entry.diffPath });
      parseDiff(raw);
    } catch (err) {
      log.warn('VersionDiffView: failed to load diff', { error: String(err) });
      loadError = `Could not load diff: ${String(err)}`;
    } finally {
      isLoading = false;
    }
  }

  /** Parse the stored JSON and extract a pseudo-unified-diff for display. */
  function parseDiff(raw: string) {
    try {
      // The stored file is a VersionEntry JSON; we display a synthetic diff
      // summarizing the metrics for now. A unified diff string would require
      // the Rust layer to store it explicitly (a future enhancement).
      const parsed: VersionEntry = JSON.parse(raw);
      const lines: typeof diffLines = [];
      lines.push({ text: `--- version ${entry.version}`, type: 'meta' });
      lines.push({ text: `+++ metrics summary`, type: 'meta' });
      lines.push({ text: `+${parsed.metrics.addedLines} lines added`, type: 'added' });
      lines.push({ text: `-${parsed.metrics.removedLines} lines removed`, type: 'removed' });
      lines.push({ text: ` ${parsed.metrics.totalLines} total lines in source`, type: 'context' });
      lines.push({ text: ` heading delta: ${parsed.metrics.headingDelta > 0 ? '+' : ''}${parsed.metrics.headingDelta}`, type: 'context' });
      lines.push({ text: ` structural delta: ${parsed.metrics.structuralTokenDelta > 0 ? '+' : ''}${parsed.metrics.structuralTokenDelta}`, type: 'context' });
      lines.push({ text: ` bump type: ${parsed.bumpType}`, type: 'context' });
      lines.push({ text: ` summary: ${parsed.summary}`, type: 'context' });
      diffLines = lines;
    } catch {
      // Fall back to raw text display line by line.
      diffLines = raw.split('\n').map((text) => ({
        text,
        type: text.startsWith('+') ? 'added'
          : text.startsWith('-') ? 'removed'
          : 'context',
      }));
    }
  }

  function handleBack() {
    onBack?.();
  }

  function lineAriaLabel(type: string): string | undefined {
    if (type === 'added') return 'added line';
    if (type === 'removed') return 'removed line';
    return undefined;
  }
</script>

<div class="diff-view">
  <div class="diff-header">
    <button class="back-btn" on:click={handleBack} aria-label="Back to version list">
      &larr; Back
    </button>
    <div class="diff-title">
      <VersionBadge version={entry.version} bumpType={entry.bumpType} />
      <span class="diff-summary">{entry.summary}</span>
    </div>
  </div>

  {#if isLoading}
    <div class="diff-loading" aria-live="polite">Loading diff...</div>
  {:else if loadError}
    <div class="diff-error" role="alert">{loadError}</div>
  {:else}
    <pre class="diff-content" aria-label="Diff for version {entry.version}">
      {#each diffLines as line}
        <div
          class="diff-line diff-line--{line.type}"
          aria-label={lineAriaLabel(line.type)}
        >{line.text}</div>
      {/each}
    </pre>
  {/if}
</div>

<style>
  .diff-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .diff-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--background-modifier-border, rgba(0,0,0,0.1));
    flex-shrink: 0;
  }

  .back-btn {
    padding: 3px 8px;
    font-size: 0.8rem;
    border: 1px solid var(--background-modifier-border, rgba(0,0,0,0.15));
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    white-space: nowrap;
  }

  .back-btn:hover {
    background: var(--background-modifier-hover, rgba(0,0,0,0.05));
  }

  .diff-title {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .diff-summary {
    font-size: 0.8rem;
    color: var(--text-muted, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .diff-loading,
  .diff-error {
    padding: 16px;
    font-size: 0.875rem;
    color: var(--text-muted, #9ca3af);
    text-align: center;
  }

  .diff-error {
    color: var(--color-error, #ef4444);
  }

  .diff-content {
    margin: 0;
    padding: 8px 0;
    overflow: auto;
    flex: 1;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .diff-line {
    padding: 1px 12px;
    white-space: pre;
  }

  .diff-line--added {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.1));
    color: var(--color-success, #10b981);
  }

  .diff-line--removed {
    background: var(--color-error-bg, rgba(239, 68, 68, 0.1));
    color: var(--color-error, #ef4444);
  }

  .diff-line--meta {
    color: var(--text-faint, #9ca3af);
    font-style: italic;
  }
</style>
