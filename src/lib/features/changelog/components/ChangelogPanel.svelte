<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { changelogEntries, changelogLoading, refreshChangelog, writeChangelogFile } from '../stores/changelog';
  import { openNote } from '@/appNavigation';
  import { onMount } from 'svelte';
  import { groupByDate, getActionIcon, formatTime } from '../services/changelogLogic';

  onMount(() => {
    refreshChangelog();
  });

  $: grouped = groupByDate($changelogEntries);
</script>

<div class="changelog-panel">
  <PanelHeader icon="history" title="Changelog" count={$changelogEntries.length || undefined}>
    <svelte:fragment slot="actions">
      <button class="icon-btn" on:click={() => writeChangelogFile()} title="Write changelog to file">
        <Icon name="file-output" size={14} />
      </button>
      <button class="icon-btn" on:click={() => refreshChangelog()} title="Refresh">
        <Icon name="refresh-cw" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if $changelogLoading}
      <div class="empty-state">Loading...</div>
    {:else if $changelogEntries.length === 0}
      <div class="empty-state">
        <Icon name="history" size={28} />
        <p class="empty-title">No changes yet</p>
        <p class="empty-desc">File changes will appear here</p>
      </div>
    {:else}
      {#each Object.entries(grouped) as [date, entries]}
        <div class="date-group">
          <div class="date-label">{date}</div>
          {#each entries as entry}
            <button
              class="changelog-item"
              on:click={() => openNote(entry.path)}
              title={entry.path}
            >
              <Icon name={getActionIcon(entry.action)} size={12} />
              <span class="entry-path">{entry.path.split('/').pop()}</span>
              <span class="entry-time">{formatTime(entry.timestamp)}</span>
              {#if entry.words_delta !== 0}
                <span class="entry-delta" class:positive={entry.words_delta > 0}>
                  {entry.words_delta > 0 ? '+' : ''}{entry.words_delta}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .changelog-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--spacing-sm, 8px);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-lg, 24px);
    color: var(--text-muted);
    font-size: var(--font-size-sm, 12px);
  }

  .empty-title { margin: 0; font-weight: 600; }
  .empty-desc { margin: 0; opacity: 0.7; }

  .date-group {
    margin-bottom: var(--spacing-sm, 8px);
  }

  .date-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: var(--spacing-xs, 4px) 0;
  }

  .changelog-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    min-height: 22px;
    padding: 0 var(--spacing-l);
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    border-radius: var(--radius-s);
    text-align: left;
  }

  .changelog-item:hover {
    background: var(--bg-hover, #f3f4f6);
  }

  .entry-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-time {
    font-size: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .entry-delta {
    font-size: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .entry-delta.positive {
    color: var(--text-success, #22c55e);
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
    border-radius: var(--radius-sm, 4px);
  }

  .icon-btn:hover {
    background: var(--bg-hover, #f3f4f6);
    color: var(--text-primary);
  }
</style>
