<script lang="ts">
  import {
    filteredComponents,
    searchQuery,
    categoryFilter,
    categories,
    isLoading,
    createComponentFromSelection,
    placeComponentInstance,
    setSearchQuery,
    setCategoryFilter,
  } from '@/features/canvas/stores';
  import { selectedElements } from '@/features/canvas/stores';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';

  let localSearch = '';

  $: setSearchQuery(localSearch);

  function handleInsert(componentId: string) {
    placeComponentInstance(componentId, 100, 100);
  }

  async function handleCreate() {
    await createComponentFromSelection('New Component');
  }
</script>

<div class="components-panel">
  <PanelHeader icon="box" title="Components" count={$filteredComponents.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton
        icon="plus"
        title="Create component from selection"
        on:click={handleCreate}
        disabled={$selectedElements.length === 0}
      />
    </svelte:fragment>
  </PanelHeader>

  <div class="search-bar">
    <input
      type="text"
      bind:value={localSearch}
      placeholder="Search components..."
      class="search-input"
    />
  </div>

  {#if $categories.length > 0}
    <div class="category-filter">
      <button class="cat-chip" class:active={$categoryFilter === null} on:click={() => setCategoryFilter(null)}>All</button>
      {#each $categories as cat}
        <button class="cat-chip" class:active={$categoryFilter === cat} on:click={() => setCategoryFilter(cat)}>{cat}</button>
      {/each}
    </div>
  {/if}

  <div class="components-list">
    {#if $isLoading}
      <div class="empty-state"><p>Loading...</p></div>
    {:else if $filteredComponents.length > 0}
      {#each $filteredComponents as comp (comp.id)}
        <div class="component-item">
          <div class="comp-preview">
            <Icon name="box" size={20} />
          </div>
          <div class="comp-info">
            <span class="comp-name">{comp.name}</span>
            <span class="comp-meta">{comp.elements.length} elements</span>
          </div>
          <button
            class="btn-insert"
            on:click={() => handleInsert(comp.id)}
            title="Insert instance"
            aria-label="Insert component instance"
          >
            <Icon name="plus-circle" size={14} />
          </button>
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <Icon name="box" size={32} color="var(--text-faint)" />
        <p>No components yet</p>
        <p class="hint">Select elements and click + to create</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .components-panel {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--border-color);
    max-height: 300px;
  }


  .search-bar {
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: var(--font-smaller);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .search-input:focus {
    border-color: var(--interactive-accent);
  }

  .components-list {
    flex: 1;
    overflow-y: auto;
  }

  .component-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    transition: background var(--transition-fast);
  }

  .component-item:hover {
    background: var(--background-modifier-hover);
  }

  .comp-preview {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-primary-alt);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--interactive-accent);
  }

  .comp-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .comp-name {
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comp-meta {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }

  .btn-insert {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xs);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all var(--transition-fast);
  }

  .component-item:hover .btn-insert {
    opacity: 1;
  }

  .btn-insert:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .empty-state {
    padding: var(--spacing-l) var(--spacing-m);
    text-align: center;
    color: var(--text-faint);
  }

  .empty-state p {
    margin: var(--spacing-xs) 0;
    font-size: var(--font-smaller);
  }

  .hint {
    font-size: var(--font-smallest);
  }

  .category-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .cat-chip {
    padding: 2px 8px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .cat-chip.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
</style>
