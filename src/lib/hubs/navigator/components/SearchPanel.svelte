<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import {
    clearRecentSearches,
    getOmnisearchResults,
    getRecentSearches,
    indexVault,
    isOmnisearchIndexed,
    isOmnisearching,
    openOmnisearch,
    performSearch,
    removeRecentSearch,
  } from '@/hubs/navigator/stores/omnisearch-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { onMount } from 'svelte';

  const searchPlaceholder = 'Search vault… ("phrases" -exclude .md)';
  let query = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    if (!isOmnisearchIndexed()) indexVault();
  });

  let results = $derived(getOmnisearchResults());
  let searching = $derived(isOmnisearching());
  let recent = $derived(getRecentSearches());

  function useRecent(q: string) {
    query = q;
    performSearch(q);
  }

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (query.length < 2) {
      performSearch('');
      return;
    }
    debounceTimer = setTimeout(() => performSearch(query), 100);
  }

  let ctxPath: string | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, path: string) {
    e.preventDefault();
    ctxPath = path;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxPath = null;
  }
</script>

<Panel title="Search">
  <div class="search-filter">
    <div class="search-input-wrap">
      <BIcon name="search" size={16} class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder={searchPlaceholder}
        aria-label="Search notes"
        bind:value={query}
        oninput={handleInput}
      />
      <button class="expand-btn" onclick={() => openOmnisearch()} title="Open Omnisearch (⌘⇧O)"
        >⊞</button
      >
    </div>
    {#if query}
      <span class="search-count">
        {#if searching}searching...{:else}{results.length} result{results.length !== 1
            ? 's'
            : ''}{/if}
      </span>
    {/if}
  </div>
  <div class="search-body">
    {#if !query}
      {#if recent.length > 0}
        <div class="recent-header">
          <span class="recent-label">Recent</span>
          <button class="recent-clear" onclick={() => clearRecentSearches()}>Clear</button>
        </div>
        <ul class="recent-list">
          {#each recent as term (term)}
            <li>
              <button class="recent-item" onclick={() => useRecent(term)} title="Search for {term}">
                <BIcon name="clock" size={12} class="recent-icon" />
                <span class="recent-text">{term}</span>
              </button>
              <button
                class="recent-remove"
                onclick={() => removeRecentSearch(term)}
                title="Remove"
                aria-label="Remove {term}"
              >
                <BIcon name="close" size={10} />
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="panel-empty">Type to search notes</div>
      {/if}
    {:else if searching}
      <div class="panel-empty">Searching...</div>
    {:else if results.length === 0}
      <div class="panel-empty">No notes match "{query}"</div>
    {:else}
      <ul class="search-results">
        {#each results as result (result.path)}
          <li>
            <button
              class="search-result"
              onclick={() => openNote(result.path)}
              oncontextmenu={(e) => handleContext(e, result.path)}
              title={result.path}
            >
              <BIcon name="document" size={14} class="result-icon" />
              <div class="result-info">
                <span class="result-title">{result.title}</span>
                <span class="result-path">{result.folder ? result.folder + '/' : ''}</span>
                {#if result.matches.length > 0}
                  <span class="result-match">{result.matches[0].snippet}</span>
                {/if}
              </div>
              <span class="result-score">{Math.round(result.score)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxPath} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      openNote(ctxPath!);
      closeCtx();
    }}
    role="menuitem">Open</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxPath) navigator.clipboard.writeText(ctxPath);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
</ContextMenu>

<style>
  .search-filter {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
  }
  .search-input-wrap:focus-within {
    border-color: var(--color-accent);
  }
  .search-input-wrap :global(.search-icon) {
    width: 14px;
    height: 14px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.75rem;
    font-family: inherit;
    outline: none;
    padding: 0;
  }
  .search-count {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    padding: 0 4px;
  }
  .search-results {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .search-result {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    text-align: left;
    font-family: inherit;
    color: var(--color-text);
  }
  .search-result:hover {
    background: var(--color-surface-hover);
  }
  .search-result :global(.result-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  .result-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .result-title {
    font-size: 0.75rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result-path {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result-match {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-style: italic;
  }
  .result-score {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
    opacity: 0.6;
    margin-left: auto;
  }
  .expand-btn {
    padding: 2px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.7rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .expand-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }
  .recent-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px 2px;
  }
  .recent-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-subtle);
  }
  .recent-clear {
    font-size: 0.6rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
    padding: 1px 4px;
    border-radius: var(--radius-s);
  }
  .recent-clear:hover {
    color: var(--color-accent);
  }
  .recent-list {
    list-style: none;
    padding: 2px 4px;
    margin: 0;
  }
  .recent-list li {
    display: flex;
    align-items: center;
  }
  .recent-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-family: inherit;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    text-align: left;
    min-width: 0;
  }
  .recent-item:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .recent-item :global(.recent-icon) {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    opacity: 0.5;
  }
  .recent-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .recent-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
    flex-shrink: 0;
    opacity: 0;
  }
  .recent-list li:hover .recent-remove {
    opacity: 1;
  }
  .recent-remove:hover {
    background: var(--color-surface-hover);
    color: var(--color-error);
  }
</style>
