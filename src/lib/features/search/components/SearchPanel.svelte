<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import SearchInput from '@/components/ui/forms/SearchInput.svelte';
  import FilterChip from '@/components/ui/actions/FilterChip.svelte';
  import { notes } from '@/stores/vault/vault';  
  import { openNoteTab } from '@/stores/editor/tabs';
  import { getNote } from '@/services/vault/vault';
  import type { Note } from '@/types/data/vault';
  import {
    loadRecent,
    addToRecent as doAddRecent,
    saveRecent,
    performAdvancedSearch,
    getSnippet,
  } from './searchLogic';
  import { escapeHtml } from '@/utils/html';

  let query = '';
  let results: Note[] = [];
  let isSearching = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let activeFilters: string[] = [];
  const filterOptions = [
    { id: 'title-only', label: 'Title' },
    { id: 'tag', label: 'Tags' },
    { id: 'folder', label: 'Folder' },
  ];
  let recentSearches: string[] = loadRecent();

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!query.trim()) { results = []; isSearching = false; return; }
    isSearching = true;
    debounceTimer = setTimeout(async () => {
      results = await performAdvancedSearch(query, $notes, activeFilters);
      recentSearches = doAddRecent(query.trim(), recentSearches);
      isSearching = false;
    }, 250);
  }

  function toggleFilter(filter: string) {
    if (activeFilters.includes(filter)) activeFilters = activeFilters.filter(f => f !== filter);
    else activeFilters = [...activeFilters, filter];
    if (query.trim()) handleInput();
  }

  async function openResult(note: Note) {
    try { const fullNote = await getNote(note.path); openNoteTab(fullNote); }
    catch { openNoteTab(note); }
  }

  function clearSearch() { query = ''; results = []; isSearching = false; }
  function useRecent(term: string) { query = term; handleInput(); }
  function clearRecent() { recentSearches = []; saveRecent([]); }
  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && results.length > 0) openResult(results[0]); }
</script>

<div class="search-panel" role="tabpanel" aria-label="Search">
  <PanelHeader icon="search" title="Search" count={results.length || undefined}>
    <svelte:fragment slot="actions">
      {#if results.length > 0}
        <button class="icon-btn" on:click={clearSearch} title="Clear results">
          <Icon name="x-circle" size={14} />
        </button>
      {/if}
    </svelte:fragment>
  </PanelHeader>

  <div class="search-input-area">
    <SearchInput
      bind:value={query}
      placeholder="Search notes..."
      onInput={handleInput}
      onClear={() => { query = ''; results = []; }}
      on:keydown={handleKeydown}
    />

    <div class="filter-chips">
      {#each filterOptions as filter}
        <FilterChip
          label={filter.label}
          active={activeFilters.includes(filter.id)}
          on:click={() => toggleFilter(filter.id)}
        />
      {/each}
    </div>
  </div>

  <div class="search-results">
    {#if isSearching}
      <div class="search-status">Searching...</div>
    {:else if query && results.length === 0}
      <div class="empty-state">
        <Icon name="search" size={24} />
        <p class="empty-state-title">No results found</p>
        <p class="empty-state-description">Try different keywords or remove filters</p>
      </div>
    {:else if query && results.length > 0}
      <div class="results-count">{results.length} result{results.length === 1 ? '' : 's'}</div>
      {#each results as note (note.path)}
        <button class="result-item" on:click={() => openResult(note)} title="Open {note.title}">
          <div class="result-title">
            <Icon name="file-text" size={14} />
            <span>{note.title}</span>
          </div>
          {#if note.content && query}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content escaped via escapeHtml before mark wrapping -->
            <p class="result-snippet">{@html escapeHtml(getSnippet(note.content, query)).replace(
              new RegExp(`(${escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
              '<mark>$1</mark>'
            )}</p>
          {/if}
          <span class="result-path">{note.path}</span>
        </button>
      {/each}
    {:else if !query && recentSearches.length > 0}
      <div class="recent-section">
        <div class="recent-header">
          <span class="recent-title">Recent</span>
          <button class="clear-recent" on:click={clearRecent} title="Clear recent searches">Clear</button>
        </div>
        {#each recentSearches as term}
          <button class="recent-item" on:click={() => useRecent(term)} title="Search for '{term}'">
            <Icon name="clock" size={12} />
            <span>{term}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <Icon name="search" size={32} />
        <p class="empty-state-title">Search your vault</p>
        <p class="empty-state-description">Find notes by title or content</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .search-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .search-input-area { padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
  .filter-chips { display: flex; gap: var(--spacing-xs); margin-top: var(--spacing-xs); flex-wrap: wrap; }
  .search-results { flex: 1; overflow-y: auto; padding: var(--spacing-s); }
  .search-status { padding: var(--spacing-s); font-size: var(--font-smallest); color: var(--text-muted); text-align: center; }
  .results-count { font-size: var(--font-smallest); color: var(--text-muted); padding: 0 var(--spacing-xs) var(--spacing-xs); }
  .result-item { display: block; width: 100%; text-align: left; min-height: 22px; padding: 0 var(--spacing-l); border: none; background: none; border-radius: var(--radius-s); cursor: pointer; transition: background 0.1s ease; }
  .result-item:hover { background: var(--background-modifier-hover); }
  .result-title { display: flex; align-items: center; gap: var(--spacing-xs); font-size: var(--font-ui-small); font-weight: 500; color: var(--text-normal); }
  .result-snippet { margin: var(--spacing-xs) 0 0; font-size: var(--font-smallest); color: var(--text-muted); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .result-snippet :global(mark) { background: rgba(127, 109, 242, 0.2); color: var(--text-accent); border-radius: 2px; padding: 0 1px; }
  .result-path { display: block; margin-top: 2px; font-size: 10px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-section { padding: var(--spacing-xs); }
  .recent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs); }
  .recent-title { font-size: var(--font-smallest); font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .clear-recent { border: none; background: none; font-size: var(--font-smallest); color: var(--text-faint); cursor: pointer; }
  .clear-recent:hover { color: var(--text-normal); }
  .recent-item { display: flex; align-items: center; gap: var(--spacing-xs); width: 100%; padding: var(--spacing-xs) var(--spacing-s); border: none; background: none; border-radius: var(--radius-s); font-size: var(--font-ui-small); color: var(--text-muted); cursor: pointer; text-align: left; }
  .recent-item:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl) var(--spacing-m); text-align: center; gap: var(--spacing-xs); color: var(--text-faint); }
  .empty-state-title { font-size: var(--font-ui-small); font-weight: 500; color: var(--text-muted); margin: 0; }
  .empty-state-description { font-size: var(--font-smallest); color: var(--text-faint); margin: 0; }
</style>
