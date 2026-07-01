<script lang="ts">
  /**
   * VersionTimeline — vertical list of version entries for the current note.
   *
   * Reads from `versionStore`. Dispatches `select-version` when an entry is clicked.
   * Renders empty state when no history is loaded.
   */
  import {
    activeVersionHistory,
    selectedEntry,
    isLoading,
    selectEntry,
  } from '../stores/versionStore';
  import VersionBadge from './VersionBadge.svelte';
  import type { VersionEntry } from '../types/versioning';

  export let onSelectVersion: ((entry: VersionEntry) => void) | undefined = undefined;

  function handleSelect(entry: VersionEntry) {
    selectEntry(entry);
    onSelectVersion?.(entry);
  }

  function formatRelativeDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      const now = Date.now();
      const diff = now - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  }

  $: entries = $activeVersionHistory?.entries ?? [];
  $: entryCount = entries.length;
</script>

<div class="version-timeline">
  {#if $isLoading}
    <div class="timeline-loading" aria-live="polite">Loading versions...</div>
  {:else if entryCount === 0}
    <div class="timeline-empty">
      <p class="empty-message">No versions yet.</p>
      <p class="empty-hint">Versions are saved automatically when you edit and save a note.</p>
    </div>
  {:else}
    <div class="timeline-header">
      <span class="entry-count">{entryCount} {entryCount === 1 ? 'version' : 'versions'}</span>
    </div>
    <ul class="timeline-list" role="list">
      {#each entries as entry (entry.version + entry.timestamp)}
        <li
          class="timeline-entry"
          class:selected={$selectedEntry?.version === entry.version &&
            $selectedEntry?.timestamp === entry.timestamp}
          role="listitem"
        >
          <div class="entry-header">
            <VersionBadge version={entry.version} bumpType={entry.bumpType} />
            <span class="bump-chip bump-chip--{entry.bumpType}">{entry.bumpType}</span>
            <time class="entry-time" datetime={entry.timestamp}>
              {formatRelativeDate(entry.timestamp)}
            </time>
          </div>
          {#if entry.summary}
            <p class="entry-summary">{entry.summary}</p>
          {/if}
          <button
            class="view-diff-btn"
            on:click={() => handleSelect(entry)}
            aria-label="View diff for version {entry.version}"
          >
            View diff
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .version-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 8px 0;
  }

  .timeline-loading {
    padding: 16px;
    color: var(--color-neutral, #6b7280);
    font-size: 0.875rem;
    text-align: center;
  }

  .timeline-empty {
    padding: 24px 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .empty-message {
    margin: 0;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-muted, #9ca3af);
  }

  .empty-hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-faint, #d1d5db);
  }

  .timeline-header {
    padding: 4px 12px 8px;
    display: flex;
    justify-content: flex-end;
  }

  .entry-count {
    font-size: 0.75rem;
    color: var(--text-muted, #9ca3af);
  }

  .timeline-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .timeline-entry {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.08));
    cursor: default;
    transition: background 0.1s;
  }

  .timeline-entry:hover {
    background: var(--background-modifier-hover, rgba(0, 0, 0, 0.04));
  }

  .timeline-entry.selected {
    background: var(--background-modifier-active-hover, rgba(0, 0, 0, 0.07));
  }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .bump-chip {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .bump-chip--patch {
    background: var(--color-neutral-muted, rgba(107, 114, 128, 0.15));
    color: var(--color-neutral, #6b7280);
  }

  .bump-chip--minor {
    background: var(--color-info-muted, rgba(59, 130, 246, 0.15));
    color: var(--color-info, #3b82f6);
  }

  .bump-chip--major {
    background: var(--color-warning-muted, rgba(245, 158, 11, 0.15));
    color: var(--color-warning, #f59e0b);
  }

  .entry-time {
    font-size: 0.75rem;
    color: var(--text-muted, #9ca3af);
    margin-left: auto;
  }

  .entry-summary {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-normal, #374151);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .view-diff-btn {
    align-self: flex-start;
    margin-top: 2px;
    padding: 3px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--background-modifier-border, rgba(0, 0, 0, 0.15));
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .view-diff-btn:hover {
    background: var(--interactive-accent, #dc2626);
    color: #fff;
    border-color: var(--interactive-accent, #dc2626);
  }
</style>
