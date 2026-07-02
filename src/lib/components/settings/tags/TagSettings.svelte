<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { onMount } from 'svelte';
  import {
    loadTags,
    loadTagStats,
    handleRename,
    handleMerge,
    handleCreatePage,
    filterTags,
  } from './tagSettingsLogic';
  import type { TagInfo, TagStats } from './tagSettingsLogic';

  let tags: TagInfo[] = [];
  let stats: TagStats | null = null;
  let loading = true;
  let filter = '';
  let editingTag: string | null = null;
  let editValue = '';
  let showStats = false;

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  onMount(async () => {
    [tags, stats] = await Promise.all([loadTags(), loadTagStats()]);
    loading = false;
  });

  $: statsSorted = stats ? [...stats.tags].sort((a, b) => b.count - a.count) : [];

  $: filteredTags = filterTags(tags, filter);

  function startRename(tag: string) {
    editingTag = tag;
    editValue = tag;
  }

  async function confirmRename(oldName: string) {
    if (editValue && editValue !== oldName) {
      const ok = await handleRename(oldName, editValue);
      if (ok) tags = await loadTags();
    }
    editingTag = null;
  }

  async function doMerge(source: string) {
    const target = prompt(`Merge "${source}" into which tag?`);
    if (target) {
      const ok = await handleMerge(source, target);
      if (ok) tags = await loadTags();
    }
  }

  async function doCreatePage(tag: string) {
    await handleCreatePage(tag);
  }
</script>

<div class="tag-settings">
  <div class="tag-header">
    <h3>Tag Management</h3>
    <span class="tag-count">{tags.length} tags</span>
  </div>

  <div class="search-bar">
    <Icon name="search" size={14} />
    <input type="text" bind:value={filter} placeholder="Filter tags..." />
  </div>

  {#if loading}
    <p class="loading">Loading tags...</p>
  {:else if filteredTags.length === 0}
    <EmptyState
      icon="tag"
      title="No tags found"
      description="Tags from your notes will appear here."
    />
  {:else}
    <div class="tag-list">
      {#each filteredTags as tag}
        <div class="tag-row">
          {#if editingTag === tag.name}
            <input
              class="rename-input"
              type="text"
              bind:value={editValue}
              on:keydown={(e) => {
                if (e.key === 'Enter') confirmRename(tag.name);
                if (e.key === 'Escape') editingTag = null;
              }}
              use:focusOnMount
            />
          {:else}
            <span class="tag-name">#{tag.name}</span>
          {/if}
          <span class="tag-usage">{tag.count} notes</span>
          <div class="tag-actions">
            <button title="Rename" on:click={() => startRename(tag.name)}>
              <Icon name="edit-2" size={12} />
            </button>
            <button title="Merge" on:click={() => doMerge(tag.name)}>
              <Icon name="git-merge" size={12} />
            </button>
            <button title="Create page" on:click={() => doCreatePage(tag.name)}>
              <Icon name="file-plus" size={12} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !loading && stats}
    <div class="stats-section">
      <button class="stats-toggle" on:click={() => (showStats = !showStats)}>
        <Icon name={showStats ? 'chevron-down' : 'chevron-right'} size={12} />
        <span>Stats</span>
        <span class="stats-summary">{stats.total_tags} tags · {stats.total_tagged_notes} notes</span
        >
      </button>

      {#if showStats}
        {#if statsSorted.length === 0}
          <EmptyState icon="bar-chart-2" title="No stats available" />
        {:else}
          <div class="stats-list">
            {#each statsSorted as item}
              <div class="stats-row" class:orphaned={item.count === 0}>
                <span class="stats-name">#{item.name}</span>
                <span class="stats-count">{item.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .tag-settings {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .tag-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tag-header h3 {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0;
  }
  .tag-count {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
  }

  .search-bar input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .loading {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
    font-style: italic;
  }

  .tag-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 400px;
    overflow-y: auto;
  }

  .tag-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    transition: background 0.1s;
  }

  .tag-row:hover {
    background: var(--background-modifier-hover);
  }

  .tag-name {
    flex: 1;
    font-size: var(--font-ui-menu);
    color: var(--text-normal);
  }

  .rename-input {
    flex: 1;
    font-size: var(--font-ui-menu);
    padding: 2px 6px;
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    outline: none;
  }

  .tag-usage {
    font-size: var(--font-ui-badge);
    color: var(--text-faint);
    min-width: 50px;
    text-align: right;
  }

  .tag-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .tag-row:hover .tag-actions {
    opacity: 1;
  }

  .tag-actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .tag-actions button:hover {
    background: var(--background-secondary);
    color: var(--text-normal);
  }

  .stats-section {
    border-top: 1px solid var(--border-color);
    padding-top: var(--spacing-s);
  }

  .stats-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    background: none;
    border: none;
    padding: var(--spacing-xs) 0;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    text-align: left;
  }

  .stats-toggle:hover {
    color: var(--text-normal);
  }

  .stats-summary {
    margin-left: auto;
    font-size: var(--font-ui-badge);
    color: var(--text-faint);
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 200px;
    overflow-y: auto;
    margin-top: var(--spacing-xs);
  }

  .stats-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px var(--spacing-s);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-smaller);
  }

  .stats-row:hover {
    background: var(--background-modifier-hover);
  }

  .stats-name {
    color: var(--text-normal);
  }
  .stats-count {
    font-size: var(--font-ui-badge);
    color: var(--text-faint);
    min-width: 24px;
    text-align: right;
  }

  .stats-row.orphaned .stats-name {
    color: var(--text-faint);
  }
  .stats-row.orphaned .stats-count {
    opacity: 0.5;
  }
</style>
