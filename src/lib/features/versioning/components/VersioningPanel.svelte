<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import VersionTimeline from './VersionTimeline.svelte';
  import VersionDiffView from './VersionDiffView.svelte';
  import {
    activeVersionHistory,
    selectedEntry,
    isLoading,
    loadVersionHistory,
  } from '../stores/versionStore';
  import { log } from '@/utils/logger';

  export let vaultRoot: string = '';
  export let notePath: string = '';

  $: if (vaultRoot && notePath) {
    loadVersionHistory(vaultRoot, notePath).catch((err) => {
      log.error('VersioningPanel: failed to load versions', err as Error);
    });
  }

  $: history = $activeVersionHistory;
  $: entry = $selectedEntry;
  $: loading = $isLoading;
  $: versionCount = history?.entries?.length ?? 0;
</script>

<div class="versioning-panel">
  <PanelHeader icon="history" title="Version History" count={versionCount} />

  <div class="panel-body">
    {#if loading}
      <div class="loading-state">
        <span class="loading-text">Loading versions...</span>
      </div>
    {:else if !notePath}
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">&#128196;</div>
        <p class="empty-text">Open a note to view its version history.</p>
      </div>
    {:else if !history || versionCount === 0}
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">&#128197;</div>
        <p class="empty-text">No versions recorded yet.</p>
        <p class="empty-hint">Versions are saved automatically when notes change.</p>
      </div>
    {:else}
      <div class="timeline-wrapper">
        <VersionTimeline />
      </div>
      {#if entry}
        <div class="diff-wrapper">
          <VersionDiffView {entry} />
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .versioning-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--background-primary);
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .timeline-wrapper {
    flex: 1;
    overflow-y: auto;
  }

  .diff-wrapper {
    border-top: 1px solid var(--color-border, var(--border-color, #e4e4e7));
    max-height: 40%;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl, 32px);
    flex: 1;
  }

  .loading-text {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-muted, #6b7280);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s, 8px);
    padding: var(--spacing-xxl, 48px) var(--spacing-l, 24px);
    text-align: center;
    flex: 1;
  }

  .empty-icon { font-size: 40px; opacity: 0.35; }

  .empty-text {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-normal, #374151);
    margin: 0;
    font-weight: 500;
  }

  .empty-hint {
    font-size: var(--font-ui-small, 12px);
    color: var(--text-muted, #6b7280);
    margin: 0;
  }
</style>
