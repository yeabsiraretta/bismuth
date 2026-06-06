<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { getBacklinksData, type BacklinksData, type Mention } from '@/services/graph/graph';
  import Icon from '@/components/icons/Icon.svelte';
  import BacklinkMentionItem from './BacklinkMentionItem.svelte';

  export let noteId: string;
  export const noteName: string = '';

  let backlinksData: BacklinksData = { linkedMentions: [], unlinkedMentions: [] };
  let loading = true;
  let error: string | null = null;

  // Settings
  let collapseResults = false;
  let showMoreContext = false;
  let sortOrder: 'name' | 'modified' | 'created' = 'name';
  let searchFilter = '';
  let showSearchFilter = false;

  // Load backlinks
  async function loadBacklinks() {
    try {
      loading = true;
      error = null;
      backlinksData = await getBacklinksData(noteId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load backlinks';
      console.error('Error loading backlinks:', err);
    } finally {
      loading = false;
    }
  }

  // Filter mentions based on search
  function filterMentions(mentions: Mention[]): Mention[] {
    if (!searchFilter) return mentions;
    const query = searchFilter.toLowerCase();
    return mentions.filter(
      (m) =>
        m.noteName.toLowerCase().includes(query) ||
        m.context.toLowerCase().includes(query) ||
        m.notePath.toLowerCase().includes(query)
    );
  }

  // Sort mentions
  function sortMentions(mentions: Mention[]): Mention[] {
    const sorted = [...mentions];
    sorted.sort((a, b) => {
      switch (sortOrder) {
        case 'name':
          return a.noteName.localeCompare(b.noteName);
        case 'modified':
        case 'created':
          // Would need timestamps from backend
          return a.noteName.localeCompare(b.noteName);
        default:
          return 0;
      }
    });
    return sorted;
  }

  // Get filtered and sorted mentions
  $: filteredLinkedMentions = sortMentions(filterMentions(backlinksData.linkedMentions));
  $: filteredUnlinkedMentions = sortMentions(filterMentions(backlinksData.unlinkedMentions));

  // Truncate context if needed
  function getDisplayContext(context: string): string {
    if (showMoreContext) return context;
    const lines = context.split('\n');
    return lines[0] + (lines.length > 1 ? '...' : '');
  }

  // Create link from unlinked mention
  async function createLink(mention: Mention) {
    try {
      await invoke('create_link_from_mention', {
        sourceNoteId: mention.noteId,
        targetNoteId: noteId,
        lineNumber: mention.lineNumber,
      });
      await loadBacklinks();
    } catch (err) {
      console.error('Failed to create link:', err);
    }
  }

  // Open note
  function openNote(mention: Mention) {
    window.dispatchEvent(
      new CustomEvent('open-note', {
        detail: { id: mention.noteId, line: mention.lineNumber },
      })
    );
  }

  onMount(() => {
    loadBacklinks();
  });

  // Reload when noteId changes
  $: if (noteId) loadBacklinks();
</script>

<div class="backlinks">
  <div class="backlinks-header">
    <h3>
      <Icon name="chevron-right" size={16} />
      <span>Backlinks</span>
    </h3>
    <div class="backlinks-controls">
      <button
        class="control-btn"
        on:click={() => (collapseResults = !collapseResults)}
        title={collapseResults ? 'Expand results' : 'Collapse results'}
      >
        <Icon name={collapseResults ? 'maximize' : 'minimize'} size={16} />
      </button>
      <button
        class="control-btn"
        on:click={() => (showMoreContext = !showMoreContext)}
        title={showMoreContext ? 'Show less context' : 'Show more context'}
      >
        <Icon name="file" size={16} />
      </button>
      <button
        class="control-btn"
        on:click={() => (showSearchFilter = !showSearchFilter)}
        title="Toggle search filter"
      >
        <Icon name="search" size={16} />
      </button>
      <select bind:value={sortOrder} class="sort-select">
        <option value="name">Sort by name</option>
        <option value="modified">Sort by modified</option>
        <option value="created">Sort by created</option>
      </select>
    </div>
  </div>

  {#if showSearchFilter}
    <div class="search-filter">
      <Icon name="search" size={16} />
      <input
        type="text"
        placeholder="Filter backlinks..."
        bind:value={searchFilter}
        class="search-input"
      />
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <Icon name="loader" size={24} />
      <span>Loading backlinks...</span>
    </div>
  {:else if error}
    <div class="error">
      <Icon name="alert-circle" size={24} />
      <span>{error}</span>
    </div>
  {:else}
    <!-- Linked Mentions -->
    <div class="mentions-section">
      <div class="section-header">
        <h4>
          Linked mentions
          <span class="count">({filteredLinkedMentions.length})</span>
        </h4>
      </div>
      {#if filteredLinkedMentions.length === 0}
        <div class="empty-state">No linked mentions found</div>
      {:else}
        <div class="mentions-list">
          {#each filteredLinkedMentions as mention}
            <BacklinkMentionItem
              noteName={mention.noteName}
              notePath={mention.notePath}
              context={getDisplayContext(mention.context)}
              collapsed={collapseResults}
              onOpen={() => openNote(mention)}
            />
          {/each}
        </div>
      {/if}
    </div>

    <!-- Unlinked Mentions -->
    <div class="mentions-section">
      <div class="section-header">
        <h4>
          Unlinked mentions
          <span class="count">({filteredUnlinkedMentions.length})</span>
        </h4>
      </div>
      {#if filteredUnlinkedMentions.length === 0}
        <div class="empty-state">No unlinked mentions found</div>
      {:else}
        <div class="mentions-list">
          {#each filteredUnlinkedMentions as mention}
            <BacklinkMentionItem
              noteName={mention.noteName}
              notePath={mention.notePath}
              context={getDisplayContext(mention.context)}
              collapsed={collapseResults}
              showCreateLink
              onOpen={() => openNote(mention)}
              onCreateLink={() => createLink(mention)}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .backlinks {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg);
    color: var(--color-text);
    overflow: hidden;
  }

  .backlinks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .backlinks-header h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .backlinks-controls {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .control-btn {
    padding: var(--space-1);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    color: var(--color-text);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .control-btn:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
  }

  .sort-select {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text);
    font-size: 0.75rem;
    cursor: pointer;
  }

  .search-filter {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .search-input {
    flex: 1;
    padding: var(--space-2);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-6);
    color: var(--color-text-muted);
  }

  .error {
    color: var(--color-error, #ef4444);
  }

  .mentions-section {
    border-bottom: 1px solid var(--color-border);
  }

  .section-header {
    padding: var(--space-3);
    background: var(--color-surface);
  }

  .section-header h4 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .count {
    font-weight: normal;
    color: var(--color-text-muted);
  }

  .empty-state {
    padding: var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .mentions-list {
    overflow-y: auto;
    max-height: 400px;
  }
</style>
