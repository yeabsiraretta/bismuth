<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import {
    getVaultStats,
    formatBytes,
    formatNumber,
    type VaultStats,
  } from '@/hubs/knowledge/services/vault-statistics';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  const EMPTY_STATS: VaultStats = {
    notes: 0,
    folders: 0,
    attachments: 0,
    totalFiles: 0,
    totalWords: 0,
    totalChars: 0,
    totalSize: 0,
    totalLinks: 0,
    orphanNotes: 0,
    avgWordsPerNote: 0,
    avgLinksPerNote: 0,
    tags: [],
    fileTypes: [],
    longestNote: null,
    shortestNote: null,
    newestNote: null,
    oldestNote: null,
    lastModified: null,
  };

  let allNotes = $derived(getNotes());
  let stats = $state<VaultStats>(EMPTY_STATS);

  $effect(() => {
    let cancelled = false;
    const _notes = allNotes; // reactive dependency
    void _notes;

    getVaultStats().then((s) => {
      if (!cancelled) stats = s;
    });
    return () => {
      cancelled = true;
    };
  });

  let showAllTags = $state(false);
  let showAllTypes = $state(false);
  let visibleTags = $derived(showAllTags ? stats.tags : stats.tags.slice(0, 8));
  let visibleTypes = $derived(showAllTypes ? stats.fileTypes : stats.fileTypes.slice(0, 5));

  function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<Panel title="Vault Statistics">
  {#if stats.notes === 0}
    <div class="panel-empty">No notes in vault</div>
  {:else}
    <div class="vs-grid">
      <div class="vs-stat">
        <span class="vs-num">{formatNumber(stats.notes)}</span>
        <span class="vs-label">notes</span>
      </div>
      <div class="vs-stat">
        <span class="vs-num">{formatNumber(stats.folders)}</span>
        <span class="vs-label">folders</span>
      </div>
      <div class="vs-stat">
        <span class="vs-num">{formatNumber(stats.attachments)}</span>
        <span class="vs-label">attachments</span>
      </div>
      <div class="vs-stat">
        <span class="vs-num">{formatBytes(stats.totalSize)}</span>
        <span class="vs-label">vault size</span>
      </div>
    </div>

    <div class="vs-section">
      <h4 class="vs-section-title">Content</h4>
      <div class="vs-row">
        <span class="vs-row-label">Total words</span>
        <span class="vs-row-value">{formatNumber(stats.totalWords)}</span>
      </div>
      <div class="vs-row">
        <span class="vs-row-label">Total characters</span>
        <span class="vs-row-value">{formatNumber(stats.totalChars)}</span>
      </div>
      <div class="vs-row">
        <span class="vs-row-label">Avg words / note</span>
        <span class="vs-row-value">{formatNumber(stats.avgWordsPerNote)}</span>
      </div>
      {#if stats.longestNote}
        <div class="vs-row">
          <span class="vs-row-label">Longest note</span>
          <button
            class="vs-link"
            onclick={() => openNote(stats.longestNote!.path)}
            title={stats.longestNote.title}
          >
            {stats.longestNote.title} ({formatNumber(stats.longestNote.value)}w)
          </button>
        </div>
      {/if}
      {#if stats.shortestNote}
        <div class="vs-row">
          <span class="vs-row-label">Shortest note</span>
          <button
            class="vs-link"
            onclick={() => openNote(stats.shortestNote!.path)}
            title={stats.shortestNote.title}
          >
            {stats.shortestNote.title} ({formatNumber(stats.shortestNote.value)}w)
          </button>
        </div>
      {/if}
    </div>

    <div class="vs-section">
      <h4 class="vs-section-title">Links</h4>
      <div class="vs-row">
        <span class="vs-row-label">Total links</span>
        <span class="vs-row-value">{formatNumber(stats.totalLinks)}</span>
      </div>
      <div class="vs-row">
        <span class="vs-row-label">Orphan notes</span>
        <span class="vs-row-value" class:vs-warn={stats.orphanNotes > 0}>{stats.orphanNotes}</span>
      </div>
      <div class="vs-row">
        <span class="vs-row-label">Link density</span>
        <span class="vs-row-value">{stats.avgLinksPerNote} / note</span>
      </div>
    </div>

    {#if stats.tags.length > 0}
      <div class="vs-section">
        <h4 class="vs-section-title">Tags ({stats.tags.length})</h4>
        <div class="vs-tag-list">
          {#each visibleTags as t (t.tag)}
            <span class="vs-tag">#{t.tag} <span class="vs-tag-count">{t.count}</span></span>
          {/each}
        </div>
        {#if stats.tags.length > 8}
          <button class="vs-toggle" onclick={() => (showAllTags = !showAllTags)}>
            {showAllTags ? 'Show less' : `Show all ${stats.tags.length}`}
          </button>
        {/if}
      </div>
    {/if}

    {#if stats.fileTypes.length > 0}
      <div class="vs-section">
        <h4 class="vs-section-title">File Types</h4>
        {#each visibleTypes as ft (ft.ext)}
          <div class="vs-row">
            <span class="vs-row-label">.{ft.ext}</span>
            <span class="vs-row-value">{ft.count} ({formatBytes(ft.size)})</span>
          </div>
        {/each}
        {#if stats.fileTypes.length > 5}
          <button class="vs-toggle" onclick={() => (showAllTypes = !showAllTypes)}>
            {showAllTypes ? 'Show less' : `Show all ${stats.fileTypes.length}`}
          </button>
        {/if}
      </div>
    {/if}

    <div class="vs-section">
      <h4 class="vs-section-title">Activity</h4>
      {#if stats.newestNote}
        <div class="vs-row">
          <span class="vs-row-label">Newest</span>
          <button
            class="vs-link"
            onclick={() => openNote(stats.newestNote!.path)}
            title={stats.newestNote.title}
          >
            {stats.newestNote.title}
          </button>
        </div>
        <div class="vs-row vs-sub">
          <span class="vs-row-label"></span>
          <span class="vs-row-value vs-muted">{fmtDate(stats.newestNote.value)}</span>
        </div>
      {/if}
      {#if stats.oldestNote}
        <div class="vs-row">
          <span class="vs-row-label">Oldest</span>
          <button
            class="vs-link"
            onclick={() => openNote(stats.oldestNote!.path)}
            title={stats.oldestNote.title}
          >
            {stats.oldestNote.title}
          </button>
        </div>
        <div class="vs-row vs-sub">
          <span class="vs-row-label"></span>
          <span class="vs-row-value vs-muted">{fmtDate(stats.oldestNote.value)}</span>
        </div>
      {/if}
      {#if stats.lastModified}
        <div class="vs-row">
          <span class="vs-row-label">Last modified</span>
          <button
            class="vs-link"
            onclick={() => openNote(stats.lastModified!.path)}
            title={stats.lastModified.title}
          >
            {stats.lastModified.title}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</Panel>

<style>
  .vs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }
  .vs-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .vs-num {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .vs-label {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  .vs-section {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
    margin-top: 8px;
  }
  .vs-section-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0 0 6px;
  }
  .vs-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;
    font-size: 0.7rem;
    min-width: 0;
  }
  .vs-sub {
    padding-top: 0;
    margin-top: -2px;
  }
  .vs-row-label {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .vs-row-value {
    color: var(--color-text);
    font-weight: 500;
  }
  .vs-muted {
    color: var(--color-text-subtle);
    font-weight: 400;
    font-size: 0.6rem;
  }
  .vs-warn {
    color: var(--color-warning);
  }
  .vs-link {
    background: none;
    border: none;
    color: var(--color-accent);
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }
  .vs-link:hover {
    text-decoration: underline;
  }
  .vs-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .vs-tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6rem;
    padding: 2px 6px;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    color: var(--color-accent);
  }
  .vs-tag-count {
    color: var(--color-text-subtle);
    font-size: 0.55rem;
  }
  .vs-toggle {
    display: block;
    margin-top: 6px;
    background: none;
    border: none;
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    cursor: pointer;
    padding: 0;
  }
  .vs-toggle:hover {
    color: var(--color-accent);
  }
</style>
