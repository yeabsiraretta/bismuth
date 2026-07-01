<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { toggleArrayItem, buildFilterState, getDefaultFilterState } from './graphFilterLogic';

  export let onFilter: (detail: {
    tags: string[];
    types: string[];
    folder: string;
    depth: number;
  }) => void = () => {};
  export let selectedTags: string[] = [];
  export let selectedTypes: string[] = [];
  export let folderFilter: string = '';
  export let linkDepth: number = 3;

  export let availableTags: string[] = [];
  export let availableTypes: string[] = [];

  let showTagDropdown = false;
  let showTypeDropdown = false;

  function emitFilter() {
    onFilter(buildFilterState(selectedTags, selectedTypes, folderFilter, linkDepth));
  }

  function toggleTag(tag: string) {
    selectedTags = toggleArrayItem(selectedTags, tag);
    emitFilter();
  }
  function toggleType(type: string) {
    selectedTypes = toggleArrayItem(selectedTypes, type);
    emitFilter();
  }
  function updateFolderFilter() {
    emitFilter();
  }
  function updateDepth() {
    emitFilter();
  }

  function clearFilters() {
    const d = getDefaultFilterState();
    selectedTags = d.tags;
    selectedTypes = d.types;
    folderFilter = d.folder;
    linkDepth = d.depth;
    onFilter(d);
  }
</script>

<div class="graph-filter">
  <div class="filter-header">
    <h3>Graph Filters</h3>
    <button class="clear-btn" on:click={clearFilters} title="Clear all filters">
      <Icon name="x" size={14} />
      Clear
    </button>
  </div>

  <div class="filter-section">
    <label for="folder-filter">Folder Path</label>
    <input
      id="folder-filter"
      type="text"
      placeholder="e.g., Projects/"
      bind:value={folderFilter}
      on:input={updateFolderFilter}
      class="filter-input"
    />
  </div>

  <div class="filter-section">
    <span class="filter-label">Tags</span>
    <button class="filter-dropdown-btn" on:click={() => (showTagDropdown = !showTagDropdown)}>
      <Icon name="tag" size={14} />
      {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Select tags'}
      <Icon name={showTagDropdown ? 'chevron-up' : 'chevron-down'} size={14} />
    </button>

    {#if showTagDropdown}
      <div class="filter-dropdown">
        {#if availableTags.length === 0}
          <div class="empty-hint">No tags found</div>
        {:else}
          {#each availableTags as tag}
            <label class="checkbox-item">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                on:change={() => toggleTag(tag)}
              />
              <span>{tag}</span>
            </label>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <div class="filter-section">
    <span class="filter-label">Entity Types</span>
    <button class="filter-dropdown-btn" on:click={() => (showTypeDropdown = !showTypeDropdown)}>
      <Icon name="box" size={14} />
      {selectedTypes.length > 0 ? `${selectedTypes.length} selected` : 'Select types'}
      <Icon name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={14} />
    </button>

    {#if showTypeDropdown}
      <div class="filter-dropdown">
        {#if availableTypes.length === 0}
          <div class="empty-hint">No types found</div>
        {:else}
          {#each availableTypes as type}
            <label class="checkbox-item">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                on:change={() => toggleType(type)}
              />
              <span>{type}</span>
            </label>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <div class="filter-section">
    <label for="depth-slider">
      Link Depth: {linkDepth}
    </label>
    <input
      id="depth-slider"
      type="range"
      min="1"
      max="5"
      bind:value={linkDepth}
      on:input={updateDepth}
      class="depth-slider"
    />
    <div class="depth-labels">
      <span>1</span>
      <span>2</span>
      <span>3</span>
      <span>4</span>
      <span>5</span>
    </div>
  </div>
</div>

<style>
  .graph-filter {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background-color: var(--background-secondary);
    border-radius: var(--radius-m);
  }

  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .filter-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .clear-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-section label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
  }

  .filter-input {
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 13px;
  }

  .filter-input:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .filter-dropdown-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .filter-dropdown-btn:hover {
    background-color: var(--interactive-hover);
  }

  .filter-dropdown {
    max-height: 200px;
    overflow-y: auto;
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    padding: 8px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .checkbox-item:hover {
    background-color: var(--interactive-hover);
  }

  .checkbox-item input[type='checkbox'] {
    cursor: pointer;
  }

  .checkbox-item span {
    font-size: 13px;
    color: var(--text-normal);
  }

  .empty-hint {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
  }

  .depth-slider {
    width: 100%;
    height: 4px;
    background: var(--background-modifier-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .depth-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--interactive-accent);
    border-radius: 50%;
    cursor: pointer;
  }

  .depth-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--interactive-accent);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .depth-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-faint);
    padding: 0 2px;
  }
</style>
