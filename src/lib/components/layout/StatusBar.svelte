<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    statusItemsLeft,
    statusItemsCenter,
    statusItemsRight,
    reorderStatusItems,
  } from '@/stores/status/status';
  import type { StatusItem } from '@/types/layout';

  let draggedId: string | null = null;
  let dropTargetId: string | null = null;

  function handleDragStart(e: DragEvent, itemId: string) {
    if (!e.dataTransfer) return;
    draggedId = itemId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  }

  function handleDragOver(e: DragEvent, itemId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === itemId) return;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dropTargetId = itemId;
  }

  function handleDragLeave() {
    dropTargetId = null;
  }

  function handleDrop(e: DragEvent, items: StatusItem[], position: 'left' | 'center' | 'right') {
    e.preventDefault();
    if (!draggedId) return;
    const fromIdx = items.findIndex((i) => i.id === draggedId);
    const toIdx = items.findIndex((i) => i.id === dropTargetId);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const reordered = [...items];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      reorderStatusItems(
        position,
        reordered.map((i) => i.id)
      );
    }
    draggedId = null;
    dropTargetId = null;
  }

  function handleDragEnd() {
    draggedId = null;
    dropTargetId = null;
  }
</script>

<footer class="status-bar">
  <div class="status-left">
    {#each $statusItemsLeft as item (item.id)}
      {#if item.onClick}
        <button
          class="status-item clickable"
          class:drag-over={dropTargetId === item.id}
          title={item.tooltip || ''}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, item.id)}
          on:dragover={(e) => handleDragOver(e, item.id)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, $statusItemsLeft, 'left')}
          on:dragend={handleDragEnd}
          on:click={item.onClick}
        >
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </button>
      {:else}
        <span
          class="status-item"
          class:drag-over={dropTargetId === item.id}
          title={item.tooltip || ''}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, item.id)}
          on:dragover={(e) => handleDragOver(e, item.id)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, $statusItemsLeft, 'left')}
          on:dragend={handleDragEnd}
          role="none"
        >
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </span>
      {/if}
    {/each}
  </div>

  <div class="status-center">
    {#each $statusItemsCenter as item (item.id)}
      {#if item.onClick}
        <button class="status-item clickable" title={item.tooltip || ''} on:click={item.onClick}>
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </button>
      {:else}
        <span class="status-item" title={item.tooltip || ''}>
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </span>
      {/if}
    {/each}
  </div>

  <div class="status-right">
    {#each $statusItemsRight as item (item.id)}
      {#if item.onClick}
        <button
          class="status-item clickable"
          class:drag-over={dropTargetId === item.id}
          title={item.tooltip || ''}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, item.id)}
          on:dragover={(e) => handleDragOver(e, item.id)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, $statusItemsRight, 'right')}
          on:dragend={handleDragEnd}
          on:click={item.onClick}
        >
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </button>
      {:else}
        <span
          class="status-item"
          class:drag-over={dropTargetId === item.id}
          title={item.tooltip || ''}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, item.id)}
          on:dragover={(e) => handleDragOver(e, item.id)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, $statusItemsRight, 'right')}
          on:dragend={handleDragEnd}
          role="none"
        >
          {#if item.icon}<Icon name={item.icon} size={12} />{/if}
          {item.label}
        </span>
      {/if}
    {/each}
  </div>
</footer>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 12px;
    background-color: var(--background-secondary);
    border-top: 1px solid var(--border-color);
    font-size: var(--status-bar-font);
    color: var(--text-muted);
    flex-shrink: 0;
    user-select: none;
  }

  .status-left,
  .status-center,
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  button.status-item {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .status-item.clickable {
    cursor: pointer;
    border-radius: 2px;
    padding: 1px 4px;
    margin: -1px -4px;
  }

  .status-item.clickable:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .status-item.drag-over {
    outline: 1px dashed var(--interactive-accent);
    outline-offset: -1px;
  }
</style>
