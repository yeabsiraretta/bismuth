<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import SearchResultItem from './SearchResultItem.svelte';
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';

  interface SearchResult {
    path: string;
    title: string;
    snippet: string;
    score: number;
  }

  export let isOpen = false;
  export let onClose: () => void;
  export let onSelectNote: (path: string) => void;

  let searchQuery = '';
  let results: SearchResult[] = [];
  let selectedIndex = 0;
  let isLoading = false;
  let searchMode: 'vault' | 'current' = 'vault';
  let debounceTimer: number;

  async function performSearch() {
    if (!searchQuery.trim()) {
      results = [];
      return;
    }

    isLoading = true;
    try {
      const searchResults = await invoke<SearchResult[]>('search_notes', {
        query: searchQuery,
        limit: 50,
      });
      results = searchResults;
      selectedIndex = 0;
    } catch (error) {
      console.error('Search failed:', error);
      results = [];
    } finally {
      isLoading = false;
    }
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 100);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        scrollToSelected();
        break;
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          onSelectNote(results[selectedIndex].path);
          onClose();
        }
        break;
    }
  }

  function scrollToSelected() {
    const element = document.querySelector(`[data-index="${selectedIndex}"]`);
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function selectResult(index: number) {
    selectedIndex = index;
    onSelectNote(results[index].path);
    onClose();
  }

  function toggleSearchMode() {
    searchMode = searchMode === 'vault' ? 'current' : 'vault';
    performSearch();
  }

  onMount(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  $: if (isOpen) {
    setTimeout(() => {
      const input = document.querySelector('.search-input') as HTMLInputElement;
      input?.focus();
    }, 50);
  }
</script>

{#if isOpen}
  <div class="search-overlay" on:click={onClose} role="presentation">
    <div
      class="search-panel"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-label="Search notes"
      tabindex="-1"
    >
      <div class="search-header">
        <div class="search-input-wrapper">
          <Icon name="search" size={18} />
          <input
            type="text"
            class="search-input"
            placeholder="Search notes..."
            bind:value={searchQuery}
            on:input={handleInput}
          />
          {#if isLoading}
            <span class="spinner"><Icon name="loader" size={16} /></span>
          {/if}
        </div>

        <div class="search-controls">
          <button
            class="mode-toggle"
            class:active={searchMode === 'current'}
            on:click={toggleSearchMode}
            title="Toggle search mode"
          >
            <Icon name={searchMode === 'vault' ? 'folder' : 'file-text'} size={14} />
            {searchMode === 'vault' ? 'Vault' : 'Current'}
          </button>
          <button class="close-btn" on:click={onClose} title="Close (Esc)" aria-label="Close search">
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>

      <div class="search-results">
        {#if results.length === 0 && searchQuery}
          <div class="empty-state">
            <Icon name="search" size={32} />
            <p>No results found</p>
            <span class="hint">Try different keywords or check your spelling</span>
          </div>
        {:else if results.length === 0}
          <div class="empty-state">
            <Icon name="search" size={32} />
            <p>Start typing to search</p>
            <span class="hint">Use ↑↓ or j/k to navigate, Enter to open</span>
          </div>
        {:else}
          {#each results as result, index}
            <SearchResultItem
              title={result.title}
              path={result.path}
              snippet={result.snippet}
              score={result.score}
              selected={index === selectedIndex}
              {index}
              onSelect={() => selectResult(index)}
            />
          {/each}
        {/if}
      </div>

      <div class="search-footer">
        <div class="shortcuts">
          <span class="shortcut"><kbd>↑↓</kbd> or <kbd>j/k</kbd> Navigate</span>
          <span class="shortcut"><kbd>Enter</kbd> Open</span>
          <span class="shortcut"><kbd>Esc</kbd> Close</span>
        </div>
        <div class="result-count">
          {results.length}
          {results.length === 1 ? 'result' : 'results'}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    z-index: 1000;
  }

  .search-panel {
    width: 90%;
    max-width: 600px;
    max-height: 70vh;
    background-color: var(--background-primary);
    border-radius: var(--radius-m);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--background-secondary);
    border-radius: var(--radius-s);
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    font-size: 16px;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-faint);
  }

  .search-controls {
    display: flex;
    gap: 8px;
  }

  .mode-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-toggle:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .mode-toggle.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .search-results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    gap: 12px;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }

  .hint {
    font-size: 13px;
    color: var(--text-faint);
  }

  .search-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--border-color);
    background-color: var(--background-secondary);
  }

  .shortcuts {
    display: flex;
    gap: 16px;
  }

  .shortcut {
    font-size: 11px;
    color: var(--text-muted);
  }

  .shortcut kbd {
    padding: 2px 6px;
    background-color: var(--background-modifier-border);
    border-radius: 3px;
    font-family: var(--font-monospace);
    font-size: 10px;
  }

  .result-count {
    font-size: 11px;
    color: var(--text-faint);
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
