<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    reviewConfig,
    reviewGroups,
    reviewRandomNote,
    reviewLoading,
    reviewTotalEntries,
    refreshRandomNote,
  } from '../stores/reviewStore';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;
  export let vaultNotes: Array<{ path: string; content: string }> = [];

  $: config = $reviewConfig;
  $: groups = $reviewGroups;
  $: randomNote = $reviewRandomNote;
  $: loading = $reviewLoading;
  $: totalEntries = $reviewTotalEntries;

  function handleOpenNote(path: string) {
    onOpenNote?.(path);
  }

  function handleRefreshRandom() {
    refreshRandomNote(vaultNotes);
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="review-panel" role="tabpanel" aria-label="Journal Review">
  <PanelHeader icon="history" title="On This Day">
    <svelte:fragment slot="actions">
      <ActionButton
        icon="refresh-cw"
        title="Refresh"
        on:click={() => window.dispatchEvent(new CustomEvent('journal-review-refresh'))}
      />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if loading}
      <div class="loading-state">
        <Icon name="loader" size={20} />
        <span>Scanning notes...</span>
      </div>
    {:else if totalEntries === 0 && !randomNote}
      <div class="empty-state">
        <Icon name="calendar-x" size={32} />
        <p>No notes from this day in history.</p>
        <span class="empty-hint">Notes will appear here on their anniversary dates.</span>
      </div>
    {:else}
      {#if config.showRandomNote && randomNote && config.randomNotePosition === 'top'}
        <div class="random-section">
          <div class="section-header">
            <Icon name="shuffle" size={14} />
            <span>Random Note</span>
            <button class="shuffle-btn" on:click={handleRefreshRandom} title="Shuffle">
              <Icon name="refresh-cw" size={12} />
            </button>
          </div>
          <button class="entry-card" on:click={() => handleOpenNote(randomNote.path)}>
            {#if config.display.showTitle}
              <span class="entry-title">{randomNote.title}</span>
            {/if}
            <span class="entry-date"
              >{formatDate(randomNote.createdDate)} - {randomNote.timeAgo}</span
            >
            {#if config.display.useCallouts}
              <div class="entry-preview callout">{randomNote.preview}</div>
            {:else if config.display.useQuotes}
              <blockquote class="entry-preview">{randomNote.preview}</blockquote>
            {:else}
              <p class="entry-preview">{randomNote.preview}</p>
            {/if}
            {#if config.display.showTags && randomNote.tags.length > 0}
              <div class="entry-tags">
                {#each randomNote.tags as tag}<span class="tag">#{tag}</span>{/each}
              </div>
            {/if}
          </button>
        </div>
      {/if}

      {#each groups as group (group.targetDate + group.label)}
        <div class="review-group">
          <div class="group-header">
            <span class="group-label">{group.label}</span>
            <span class="group-date">{formatDate(group.targetDate)}</span>
            <span class="group-count">{group.entries.length}</span>
          </div>

          {#each group.entries as entry (entry.path)}
            <button class="entry-card" on:click={() => handleOpenNote(entry.path)}>
              {#if config.display.showTitle}
                <span class="entry-title">{entry.title}</span>
              {/if}
              <span class="entry-date">{formatDate(entry.createdDate)}</span>
              {#if config.display.useCallouts}
                <div class="entry-preview callout">{entry.preview}</div>
              {:else if config.display.useQuotes}
                <blockquote class="entry-preview">{entry.preview}</blockquote>
              {:else}
                <p class="entry-preview">{entry.preview}</p>
              {/if}
              {#if config.display.showTags && entry.tags.length > 0}
                <div class="entry-tags">
                  {#each entry.tags as tag}<span class="tag">#{tag}</span>{/each}
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/each}

      {#if config.showRandomNote && randomNote && config.randomNotePosition === 'bottom'}
        <div class="random-section">
          <div class="section-header">
            <Icon name="shuffle" size={14} />
            <span>Random Note</span>
            <button class="shuffle-btn" on:click={handleRefreshRandom} title="Shuffle">
              <Icon name="refresh-cw" size={12} />
            </button>
          </div>
          <button class="entry-card" on:click={() => handleOpenNote(randomNote.path)}>
            {#if config.display.showTitle}
              <span class="entry-title">{randomNote.title}</span>
            {/if}
            <span class="entry-date"
              >{formatDate(randomNote.createdDate)} - {randomNote.timeAgo}</span
            >
            {#if config.display.useCallouts}
              <div class="entry-preview callout">{randomNote.preview}</div>
            {:else if config.display.useQuotes}
              <blockquote class="entry-preview">{randomNote.preview}</blockquote>
            {:else}
              <p class="entry-preview">{randomNote.preview}</p>
            {/if}
            {#if config.display.showTags && randomNote.tags.length > 0}
              <div class="entry-tags">
                {#each randomNote.tags as tag}<span class="tag">#{tag}</span>{/each}
              </div>
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .review-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .panel-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    flex: 1;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    color: var(--text-muted);
  }
  .empty-state p {
    font-size: 13px;
    margin: 0;
  }
  .empty-hint {
    font-size: 11px;
    color: var(--text-faint);
  }

  .review-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-color);
  }
  .group-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .group-date {
    font-size: 11px;
    color: var(--text-muted);
    flex: 1;
  }
  .group-count {
    font-size: 10px;
    background: var(--accent-color, #6366f1);
    color: white;
    border-radius: 10px;
    padding: 1px 7px;
    min-width: 18px;
    text-align: center;
  }

  .entry-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--background-secondary);
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition:
      border-color 0.12s,
      background 0.12s;
  }
  .entry-card:hover {
    border-color: var(--interactive-accent);
    background: var(--background-modifier-hover);
  }
  .entry-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .entry-date {
    font-size: 11px;
    color: var(--text-muted);
  }

  .entry-preview {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 4px 0 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
  }
  .entry-preview.callout {
    border-left: 3px solid var(--interactive-accent);
    padding-left: 10px;
    margin-left: 0;
    background: var(--background-primary);
    border-radius: 0 4px 4px 0;
    padding: 8px 10px;
  }
  blockquote.entry-preview {
    border-left: 3px solid var(--text-faint);
    padding-left: 10px;
    margin: 4px 0 0;
    font-style: italic;
  }

  .entry-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }
  .tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-muted);
  }

  .random-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    background: var(--background-primary);
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
  }
  .shuffle-btn {
    margin-left: auto;
    padding: 2px 6px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 4px;
  }
  .shuffle-btn:hover {
    background: var(--background-modifier-hover);
  }
</style>
