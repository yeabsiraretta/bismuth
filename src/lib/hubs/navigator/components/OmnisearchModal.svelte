<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { fileName, openNote } from '@/ui/panel-actions';
  import {
    closeOmnisearch,
    getInFileResults,
    getLastQuery,
    getOmnisearchResults,
    getSearchMode,
    isOmnisearchOpen,
    isOmnisearching,
    performSearch,
    setSearchMode,
  } from '@/hubs/navigator/stores/omnisearch-store.svelte';

  let inputEl: HTMLInputElement | undefined = $state();
  let selectedIdx = $state(0);
  let query = $state('');

  let open = $derived(isOmnisearchOpen());
  let mode = $derived(getSearchMode());
  let results = $derived(getOmnisearchResults());
  let inFileResults = $derived(getInFileResults());
  let searching = $derived(isOmnisearching());
  let resultCount = $derived(mode === 'infile' ? inFileResults.length : results.length);

  let debounce: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      performSearch(query);
      selectedIdx = 0;
    }, 80);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOmnisearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, resultCount - 1);
      scrollToSelected();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      scrollToSelected();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'vault' && results[selectedIdx]) {
        openResult(results[selectedIdx].path);
      } else if (mode === 'infile' && inFileResults[selectedIdx]) {
        openInFileResult(inFileResults[selectedIdx].lineNumber);
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setSearchMode(mode === 'vault' ? 'infile' : 'vault');
      return;
    }
  }

  function scrollToSelected() {
    const el = document.querySelector('.omnisearch-item.selected');
    el?.scrollIntoView({ block: 'nearest' });
  }

  function openResult(path: string) {
    openNote(path);
    closeOmnisearch();
  }

  function openInFileResult(lineNumber: number) {
    window.dispatchEvent(new CustomEvent('editor:goto-line', { detail: { line: lineNumber } }));
    closeOmnisearch();
  }

  function insertLink(path: string, e: Event) {
    e.stopPropagation();
    const title = fileName(path, true);
    window.dispatchEvent(
      new CustomEvent('editor:insert-text', { detail: { text: `[[${title}]]` } })
    );
    closeOmnisearch();
  }

  function handleBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('omnisearch-backdrop')) {
      closeOmnisearch();
    }
  }

  $effect(() => {
    if (open && inputEl) {
      query = getLastQuery();
      selectedIdx = 0;
      requestAnimationFrame(() => inputEl?.focus());
    }
  });
</script>

{#if open}
  <div
    class="omnisearch-backdrop"
    onclick={handleBackdrop}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="Omnisearch"
    tabindex="-1"
  >
    <div class="omnisearch-modal">
      <div class="omnisearch-header">
        <div class="search-input-row">
          <BIcon name="search" size={18} class="search-icon" />
          <input
            bind:this={inputEl}
            type="text"
            class="omnisearch-input"
            placeholder={mode === 'vault' ? 'Search vault...' : 'Search in file...'}
            aria-label={mode === 'vault' ? 'Search vault' : 'Search in file'}
            role="combobox"
            aria-expanded={resultCount > 0}
            aria-controls="omnisearch-results"
            autocomplete="off"
            bind:value={query}
            oninput={handleInput}
          />
          <span class="result-count">{searching ? '...' : resultCount}</span>
        </div>
        <div class="mode-tabs">
          <button
            class="mode-tab"
            class:active={mode === 'vault'}
            onclick={() => setSearchMode('vault')}>Vault</button
          >
          <button
            class="mode-tab"
            class:active={mode === 'infile'}
            onclick={() => setSearchMode('infile')}>In File</button
          >
          <span class="mode-hint">Tab to switch</span>
        </div>
      </div>

      <div class="omnisearch-results" id="omnisearch-results">
        {#if !query}
          <div class="empty-state">Type to search across your vault</div>
        {:else if resultCount === 0 && !searching}
          <div class="empty-state">No results for "{query}"</div>
        {:else if mode === 'vault'}
          {#each results as result, i (result.path)}
            <button
              class="omnisearch-item"
              class:selected={i === selectedIdx}
              onclick={() => openResult(result.path)}
              onmouseenter={() => {
                selectedIdx = i;
              }}
            >
              <BIcon name="document" size={14} class="item-icon" />
              <div class="item-body">
                <div class="item-title">{result.title}</div>
                <div class="item-path">{result.folder ? result.folder + '/' : ''}</div>
                {#if result.matches.length > 0}
                  <div class="item-snippet">{result.matches[0].snippet}</div>
                {/if}
              </div>
              <div class="item-actions">
                <span class="item-score">{Math.round(result.score)}</span>
                <span
                  class="insert-link-btn"
                  onclick={(e) => insertLink(result.path, e)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink(result.path, e);
                    }
                  }}
                  role="button"
                  tabindex="-1"
                  title="Insert [[link]]">[[]]</span
                >
              </div>
            </button>
          {/each}
        {:else}
          {#each inFileResults as match, i (match.lineNumber)}
            <button
              class="omnisearch-item infile"
              class:selected={i === selectedIdx}
              onclick={() => openInFileResult(match.lineNumber)}
              onmouseenter={() => {
                selectedIdx = i;
              }}
            >
              <span class="line-num">L{match.lineNumber}</span>
              <span class="line-content">{match.lineContent}</span>
            </button>
          {/each}
        {/if}
      </div>

      <div class="omnisearch-footer">
        <span class="shortcut"><kbd>↑↓</kbd> Navigate</span>
        <span class="shortcut"><kbd>↵</kbd> Open</span>
        <span class="shortcut"><kbd>Esc</kbd> Close</span>
        <span class="shortcut"><kbd>Tab</kbd> Switch mode</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .omnisearch-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.5);
    z-index: var(--z-modal);
    display: flex;
    justify-content: center;
    padding-top: 15vh;
  }
  .omnisearch-modal {
    width: min(640px, 90vw);
    max-height: 60vh;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .omnisearch-header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .search-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .search-input-row :global(.search-icon) {
    width: 18px;
    height: 18px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
  .omnisearch-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    padding: 4px 0;
  }
  .result-count {
    font-size: 0.7rem;
    color: var(--color-text-subtle);
    min-width: 20px;
    text-align: right;
  }
  .mode-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
  }
  .mode-tab {
    padding: 2px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.65rem;
    cursor: pointer;
    font-family: inherit;
  }
  .mode-tab.active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .mode-hint {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    margin-left: auto;
  }
  .omnisearch-results {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: 0.8rem;
  }
  .omnisearch-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    text-align: left;
    font-family: inherit;
    color: var(--color-text);
  }
  .omnisearch-item:hover,
  .omnisearch-item.selected {
    background: var(--color-surface-hover);
  }
  .omnisearch-item.selected {
    outline: 1px solid var(--color-accent);
  }
  .omnisearch-item :global(.item-icon) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  .item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .item-title {
    font-size: 0.8rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-path {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-snippet {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }
  .item-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .item-score {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    opacity: 0.6;
  }
  .insert-link-btn {
    padding: 2px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.6rem;
    cursor: pointer;
    font-family: var(--font-mono);
    opacity: 0;
    transition: opacity var(--transition-base);
  }
  .omnisearch-item:hover .insert-link-btn,
  .omnisearch-item.selected .insert-link-btn {
    opacity: 1;
  }
  .insert-link-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }
  .omnisearch-item.infile {
    gap: 12px;
    padding: 6px 12px;
  }
  .line-num {
    font-size: 0.7rem;
    color: var(--color-accent);
    font-family: var(--font-mono);
    min-width: 40px;
    flex-shrink: 0;
  }
  .line-content {
    font-size: 0.75rem;
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text);
  }
  .omnisearch-footer {
    display: flex;
    gap: 16px;
    padding: 6px 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .shortcut {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  kbd {
    padding: 1px 4px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-background);
    font-size: 0.6rem;
    font-family: var(--font-mono);
  }
</style>
