<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { SidebarTab } from '@/types/layout';

  export let tab: SidebarTab;
  export let active: boolean = false;
  export let dragOver: boolean = false;
  export let onSelect: ((tabId: string) => void) | undefined = undefined;
  export let onKeydown: ((e: KeyboardEvent) => void) | undefined = undefined;
  export let onDragStart: ((e: DragEvent) => void) | undefined = undefined;
  export let onDragOver: ((e: DragEvent) => void) | undefined = undefined;
  export let onDragLeave: (() => void) | undefined = undefined;
  export let onDrop: ((e: DragEvent) => void) | undefined = undefined;
  export let onDragEnd: (() => void) | undefined = undefined;

  let isDragging = false;
  function handleDragStart(e: DragEvent) {
    isDragging = true;
    onDragStart?.(e);
  }
  function handleDragEnd() {
    isDragging = false;
    onDragEnd?.();
  }
</script>

<button
  class="tab-button"
  class:active
  class:drag-over={dragOver}
  class:dragging={isDragging}
  on:click={() => onSelect?.(tab.id)}
  on:keydown={onKeydown}
  draggable={!tab.pinned}
  on:dragstart={handleDragStart}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
  on:dragend={handleDragEnd}
  title={tab.tooltip}
  aria-label={tab.label}
  aria-selected={active}
  role="tab"
  tabindex={active ? 0 : -1}
>
  <Icon name={tab.icon} size={18} />
  {#if tab.badge && tab.badge > 0}
    <span class="tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
  {/if}
</button>

<style>
  .tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0 auto;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: grab;
    transition: all 0.15s ease;
    position: relative;
  }

  .tab-button:active {
    cursor: grabbing;
  }

  .tab-button:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tab-button.drag-over {
    outline: none;
    box-shadow: 0 -2px 0 0 var(--interactive-accent);
    background-color: color-mix(in srgb, var(--interactive-accent) 15%, transparent);
  }

  .tab-button.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .tab-button.dragging {
    cursor: grab;
    transform: scale(1.1);
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.2));
    outline: 2px dashed var(--interactive-accent);
    outline-offset: 1px;
  }

  .tab-button.dragging:active {
    cursor: grabbing;
    transform: scale(1.05);
  }

  .tab-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 7px;
    font-size: var(--font-ui-xs);
    font-weight: var(--font-bold);
    line-height: 14px;
    text-align: center;
  }
</style>
