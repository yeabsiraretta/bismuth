<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { searchSettings, groupByTab, type SearchResult } from './settingsSearchIndex';
  import { tabLabel, type SettingsTab } from './settingsTabRouter';

  export let query: string = '';
  export let onNavigate: (tab: SettingsTab) => void;

  $: results = searchSettings(query);
  $: grouped = groupByTab(results);
  $: tabOrder = [...grouped.keys()];

  function highlightMatch(text: string, q: string): string {
    if (!q.trim()) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  function handleResultClick(result: SearchResult) {
    onNavigate(result.tab);
  }
</script>

<div class="search-results">
  {#if results.length === 0}
    <div class="no-results">
      <Icon name="search" size={32} />
      <p>No settings found for "{query}"</p>
    </div>
  {:else}
    <p class="result-count">{results.length} result{results.length === 1 ? '' : 's'}</p>
    {#each tabOrder as tab}
      {@const items = grouped.get(tab) ?? []}
      <div class="result-group">
        <button class="result-group-header" on:click={() => onNavigate(tab)}>
          <span class="group-label">{tabLabel(tab)}</span>
          <span class="group-count">{items.length}</span>
        </button>
        {#each items as item}
          <button class="result-item" on:click={() => handleResultClick(item)}>
            <div class="result-info">
              <span class="result-label">{@html highlightMatch(item.label, query)}</span>
              <span class="result-desc">{@html highlightMatch(item.description, query)}</span>
            </div>
            <span class="result-group-tag">{item.group}</span>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>

<style>
  .search-results {
    padding: var(--spacing-l);
    overflow-y: auto;
    height: 100%;
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-m);
    padding: var(--spacing-xl) 0;
    color: var(--text-muted);
  }

  .no-results p {
    font-size: var(--font-ui-small);
    margin: 0;
  }

  .result-count {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-faint);
    margin: 0 0 var(--spacing-m);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .result-group {
    margin-bottom: var(--spacing-m);
  }

  .result-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .result-group-header:hover {
    background: var(--background-modifier-hover);
  }

  .group-label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold, 600);
    color: var(--text-normal);
  }

  .group-count {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 1px 6px;
    border-radius: var(--radius-full, 9999px);
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-m);
    width: 100%;
    padding: var(--spacing-s) var(--spacing-s) var(--spacing-s) var(--spacing-l);
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s ease;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover {
    background: var(--background-modifier-hover);
  }

  .result-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .result-label {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
  }

  .result-desc {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-group-tag {
    font-size: 10px;
    color: var(--text-faint);
    background: var(--background-secondary);
    padding: 1px 6px;
    border-radius: var(--radius-s);
    white-space: nowrap;
    flex-shrink: 0;
  }

  :global(.search-results mark) {
    background: var(--text-highlight-bg, rgba(255, 208, 0, 0.35));
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
