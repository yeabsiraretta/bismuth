<script context="module" lang="ts">
  export type { SettingsTab } from './settingsTabRouter';
</script>

<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { SettingsTab } from './settingsTabRouter';
  import { SIDEBAR_TABS } from './settingsTabRouter';
  import { searchSettings, groupByTab } from './settingsSearchIndex';

  export let activeTab: SettingsTab;
  export let onTabChange: (tab: SettingsTab) => void;
  export let searchQuery: string = '';

  $: results = searchQuery.trim() ? searchSettings(searchQuery) : [];
  $: grouped = groupByTab(results);
  $: isSearching = searchQuery.trim().length > 0;

  $: mainTabs = SIDEBAR_TABS.filter((t) => !t.bottom);
  $: bottomTabs = SIDEBAR_TABS.filter((t) => t.bottom);

  function matchCount(tab: SettingsTab): number { return grouped.get(tab)?.length ?? 0; }
  function isVisible(tab: SettingsTab): boolean { return !isSearching || matchCount(tab) > 0; }

  let inputEl: HTMLInputElement;

  function handleClear() { searchQuery = ''; inputEl?.focus(); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && searchQuery) { e.stopPropagation(); searchQuery = ''; }
  }
</script>

<div class="settings-sidebar col-span-3">
  <div class="search-box">
    <Icon name="search" size={14} />
    <input
      bind:this={inputEl}
      bind:value={searchQuery}
      on:keydown={handleKeydown}
      type="text"
      placeholder="Search settings..."
      class="search-input"
      aria-label="Search settings"
    />
    {#if searchQuery}
      <button class="search-clear" on:click={handleClear} title="Clear search" aria-label="Clear search">
        <Icon name="x" size={12} />
      </button>
    {/if}
  </div>

  {#if isSearching && results.length === 0}
    <div class="search-empty">No matches</div>
  {/if}

  {#each mainTabs as tab (tab.id)}
    {#if tab.section && !isSearching}
      <div class="section-label">{tab.section}</div>
    {/if}
    <button
      class="tab-btn"
      class:active={activeTab === tab.id}
      class:hidden={!isVisible(tab.id)}
      on:click={() => onTabChange(tab.id)}
    >
      <Icon name={tab.icon} size={16} />
      {tab.label}
      {#if isSearching && matchCount(tab.id) > 0}
        <span class="match-badge">{matchCount(tab.id)}</span>
      {/if}
    </button>
  {/each}

  <div class="spacer"></div>

  {#each bottomTabs as tab (tab.id)}
    <button
      class="tab-btn"
      class:active={activeTab === tab.id}
      on:click={() => onTabChange(tab.id)}
    >
      <Icon name={tab.icon} size={16} />
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .settings-sidebar {
    background-color: var(--background-secondary);
    border-right: 1px solid var(--border-color);
    padding: var(--spacing-s) var(--spacing-xs);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs, 2px);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .tab-btn :global(svg) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tab-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .tab-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .tab-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .spacer {
    flex: 1;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    margin-bottom: var(--spacing-xs);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    transition: border-color 0.15s ease;
  }

  .search-box:focus-within {
    border-color: var(--interactive-accent);
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    min-width: 0;
  }

  .search-input::placeholder {
    color: var(--text-faint);
  }

  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
  }

  .search-clear:hover {
    color: var(--text-normal);
  }

  .search-empty {
    text-align: center;
    padding: var(--spacing-m) var(--spacing-s);
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  .tab-btn.hidden {
    display: none;
  }

  .match-badge {
    margin-left: auto;
    font-size: 10px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    padding: 0 5px;
    border-radius: var(--radius-full, 9999px);
    line-height: 16px;
    min-width: 16px;
    text-align: center;
  }

  .tab-btn.active .match-badge {
    background: rgba(255, 255, 255, 0.3);
    color: var(--text-on-accent);
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-faint);
    padding: var(--spacing-xs) var(--spacing-s);
    margin-top: var(--spacing-xs);
  }

  .section-label:first-of-type {
    margin-top: 0;
  }
</style>
