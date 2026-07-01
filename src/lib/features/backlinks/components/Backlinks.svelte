<script lang="ts">
  import { onMount } from 'svelte';
  import { getBacklinksData, createLinkFromMention, type BacklinksData, type Mention } from '@/features/graph';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import SearchInput from '@/components/ui/forms/SearchInput.svelte';
  import BacklinkMentionItem from './BacklinkMentionItem.svelte';
  import { log } from '@/utils/logger';
  import { openNote as navOpenNote } from '@/appNavigation';
  import { notes } from '@/stores/vault/vault';

  export let noteId: string;
  export const noteName: string = '';

  function getDisplayName(mention: Mention): string {
    const note = $notes.find(n => n.path === mention.notePath || n.path === mention.noteId);
    if (note?.title) return note.title;
    return mention.noteName;
  }

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
      log.error('Error loading backlinks', err);
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
  $: totalMentions = backlinksData.linkedMentions.length + backlinksData.unlinkedMentions.length;

  // Truncate context if needed
  function getDisplayContext(context: string): string {
    if (showMoreContext) return context;
    const lines = context.split('\n');
    return lines[0] + (lines.length > 1 ? '...' : '');
  }

  // Create link from unlinked mention
  async function createLink(mention: Mention) {
    try {
      await createLinkFromMention(mention.noteId, noteId, mention.lineNumber);
      await loadBacklinks();
    } catch (err) {
      log.error('Failed to create link', err);
    }
  }

  // Open note
  function openNote(mention: Mention) {
    navOpenNote(mention.noteId);
  }

  onMount(() => {
    loadBacklinks();
  });

  // Reload when noteId changes
  $: if (noteId) loadBacklinks();
</script>

<div class="backlinks" role="tabpanel" aria-label="Backlinks">
  <PanelHeader icon="link" title="Backlinks" count={totalMentions || undefined}>
    <svelte:fragment slot="actions">
      <button class="icon-btn" on:click={() => (collapseResults = !collapseResults)} title={collapseResults ? 'Expand results' : 'Collapse results'}>
        <Icon name={collapseResults ? 'maximize' : 'minimize'} size={14} />
      </button>
      <button class="icon-btn" on:click={() => (showSearchFilter = !showSearchFilter)} title="Filter">
        <Icon name="search" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  {#if showSearchFilter}
    <div class="search-filter-area">
      <SearchInput bind:value={searchFilter} placeholder="Filter backlinks..." />
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
              noteName={getDisplayName(mention)}
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
              noteName={getDisplayName(mention)}
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

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .search-filter-area {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
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
