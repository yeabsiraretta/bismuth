<script lang="ts">
  import type { ComponentDefinition } from '@/features/canvas/types';
  import Icon from '@/components/icons/Icon.svelte';
  import type { IconName } from '@/assets/icons';

  export let category: string;
  export let components: ComponentDefinition[];
  export let collapsed = false;

  let draggedId: string | null = null;

  function toggle() {
    collapsed = !collapsed;
  }

  function handleDragStart(e: DragEvent, comp: ComponentDefinition) {
    draggedId = comp.id;
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/x-bismuth-component', comp.id);
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  function handleDragEnd() {
    draggedId = null;
  }
</script>

<div class="category-group">
  <button class="category-header" on:click={toggle} aria-expanded={!collapsed}>
    <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={12} />
    <span class="category-name">{category}</span>
    <span class="category-count">{components.length}</span>
  </button>

  {#if !collapsed}
    <div class="category-grid">
      {#each components as comp (comp.id)}
        <button
          class="builtin-card"
          class:dragging={draggedId === comp.id}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, comp)}
          on:dragend={handleDragEnd}
          title={comp.name}
          aria-label={comp.name}
        >
          <div class="card-icon">
            <Icon name={(comp.icon || 'box') as IconName} size={18} />
            <svg
              class="lock-icon"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              aria-hidden="true"
            >
              <title>Built-in component (read only)</title>
              <path d="M7.5 4.5H7V3a2 2 0 0 0-4 0v1.5H2.5A.5.5 0 0 0 2 5v3.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5zM4 3a1 1 0 0 1 2 0v1.5H4V3z"/>
            </svg>
          </div>
          <span class="card-label">{comp.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .category-group {
    border-bottom: 1px solid var(--border-color);
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--text-normal);
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    transition: background var(--transition-fast);
  }

  .category-header:hover {
    background: var(--background-modifier-hover);
  }

  .category-name {
    flex: 1;
  }

  .category-count {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    font-weight: normal;
  }

  .category-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
  }

  .builtin-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: grab;
    transition: border-color 0.15s, box-shadow 0.15s;
    text-align: center;
  }

  .builtin-card:hover {
    border-color: var(--interactive-accent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .builtin-card.dragging {
    opacity: 0.5;
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-s);
    background: var(--background-primary-alt);
    color: var(--interactive-accent);
  }

  .lock-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    color: var(--text-faint);
    opacity: 0.6;
    pointer-events: none;
  }

  .card-label {
    font-size: 10px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
</style>
