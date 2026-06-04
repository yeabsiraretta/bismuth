<script lang="ts">
  import {
    currentCanvas,
    createComponentFromSelection,
    insertComponentInstance,
    selectedElements,
  } from '@/stores/canvas/canvasStore';
  import Icon from '@/components/icons/Icon.svelte';

  let searchQuery = '';

  $: components = ($currentCanvas?.components || []).filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  function handleInsert(componentId: string) {
    insertComponentInstance(componentId, 100, 100);
  }
</script>

<div class="components-panel">
  <div class="panel-header">
    <Icon name="box" size={14} />
    <span class="panel-title">Components</span>
    <button
      class="btn-add"
      on:click={createComponentFromSelection}
      disabled={$selectedElements.length === 0}
      title="Create component from selection"
      aria-label="Create component from selection"
    >
      <Icon name="plus" size={14} />
    </button>
  </div>

  {#if components.length > 0}
    <div class="search-bar">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search components..."
        class="search-input"
      />
    </div>
  {/if}

  <div class="components-list">
    {#if components.length > 0}
      {#each components as comp (comp.id)}
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

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
  }

  .panel-title {
    flex: 1;
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .btn-add {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-add:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: var(--border-color);
  }

  .btn-add:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
</style>
