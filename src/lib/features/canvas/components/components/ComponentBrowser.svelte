<script lang="ts">
  import {
    filteredComponents,
    searchQuery,
    categoryFilter,
    categories,
    isLoading,
    loadLibrary,
    setSearchQuery,
    setCategoryFilter,
    clearFilters,
  } from '@/features/canvas/stores';
  import BuiltinLibraryPanel from './BuiltinLibraryPanel.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    loadLibrary();
  });

  let draggedComponentId: string | null = null;

  const SAFE_THUMBNAIL_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]{1,524288}$/;
  function safeThumbnail(value: string | undefined): string | null {
    if (!value) return null;
    return SAFE_THUMBNAIL_RE.test(value) ? value : null;
  }

  function handleDragStart(e: DragEvent, componentId: string) {
    draggedComponentId = componentId;
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/x-bismuth-component', componentId);
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  function handleDragEnd() {
    draggedComponentId = null;
  }
</script>

<div class="component-browser">
  <div class="browser-header">
    <span class="browser-title">Components</span>
  </div>

  <div class="browser-search">
    <input
      type="text"
      placeholder="Search components..."
      value={$searchQuery}
      on:input={(e) => setSearchQuery(e.currentTarget.value)}
      class="search-input"
    />
  </div>

  {#if $categories.length > 0}
    <div class="category-filter">
      <button
        class="category-chip"
        class:active={$categoryFilter === null}
        on:click={() => setCategoryFilter(null)}
      >
        All
      </button>
      {#each $categories as cat}
        <button
          class="category-chip"
          class:active={$categoryFilter === cat}
          on:click={() => setCategoryFilter(cat)}
        >
          {cat}
        </button>
      {/each}
    </div>
  {/if}

  <BuiltinLibraryPanel searchQuery={$searchQuery} />

  <div class="component-list">
    {#if $isLoading}
      <div class="empty-msg">Loading...</div>
    {:else if $filteredComponents.length === 0}
      <div class="empty-msg">
        {#if $searchQuery || $categoryFilter}
          <p>No matching components</p>
          <button class="clear-btn" on:click={clearFilters}>Clear filters</button>
        {:else}
          <p>No components yet</p>
          <p class="hint">Select elements and right-click to create one</p>
        {/if}
      </div>
    {:else}
      {#each $filteredComponents as comp (comp.id)}
        <button
          class="component-card"
          class:dragging={draggedComponentId === comp.id}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, comp.id)}
          on:dragend={handleDragEnd}
        >
          <div class="card-preview">
            {#if safeThumbnail(comp.thumbnail)}
              <img src={safeThumbnail(comp.thumbnail)} alt={comp.name} class="card-thumb" />
            {:else}
              <div class="card-placeholder">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 2L22 12L12 22L2 12Z" />
                </svg>
              </div>
            {/if}
          </div>
          <div class="card-info">
            <span class="card-name">{comp.name}</span>
            {#if comp.category}
              <span class="card-category">{comp.category}</span>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .component-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .browser-header {
    display: flex;
    align-items: center;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .browser-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .browser-search {
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 12px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .category-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .category-chip {
    padding: 2px 8px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .category-chip.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .component-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xs);
    align-content: start;
  }

  .empty-msg {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--spacing-l);
    color: var(--text-muted);
    font-size: 12px;
  }

  .empty-msg .hint {
    font-size: 11px;
    color: var(--text-faint);
    margin-top: var(--spacing-xs);
  }

  .clear-btn {
    margin-top: var(--spacing-s);
    padding: 4px 12px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 11px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .clear-btn:hover {
    background: var(--background-modifier-hover);
  }

  .component-card {
    display: flex;
    flex-direction: column;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    overflow: hidden;
    cursor: grab;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    text-align: left;
    padding: 0;
  }

  .component-card:hover {
    border-color: var(--interactive-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .component-card.dragging {
    opacity: 0.5;
  }

  .card-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    background: var(--background-primary-alt);
    border-bottom: 1px solid var(--border-color);
  }

  .card-thumb {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .card-placeholder {
    color: var(--text-faint);
  }

  .card-info {
    padding: 6px 8px;
  }

  .card-name {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-category {
    display: block;
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 2px;
  }
</style>
