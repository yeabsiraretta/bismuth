<script lang="ts">
  import type { GraphNode } from '$lib/types/graph';
  import Icon from '@/components/icons/Icon.svelte';

  export let node: GraphNode | null = null;
  export let x = 0;
  export let y = 0;
  export let visible = false;
  export let onAction: ((detail: { action: string; node: GraphNode | null }) => void) | undefined =
    undefined;

  function handleAction(action: string) {
    if (node) {
      onAction?.({ action, node });
      visible = false;
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.context-menu')) {
      visible = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if visible && node}
  <div class="context-menu" style="left: {x}px; top: {y}px;">
    <div class="menu-header">
      <span class="node-label">{node.label}</span>
    </div>
    <div class="menu-divider"></div>
    <button class="menu-item" on:click={() => handleAction('open')}>
      <Icon name="file" size={16} />
      <span>Open</span>
    </button>
    <button class="menu-item" on:click={() => handleAction('open-new-pane')}>
      <Icon name="layout" size={16} />
      <span>Open in new pane</span>
    </button>
    <div class="menu-divider"></div>
    <button class="menu-item" on:click={() => handleAction('show-local-graph')}>
      <Icon name="search" size={16} />
      <span>Show local graph</span>
    </button>
    <button class="menu-item" on:click={() => handleAction('show-backlinks')}>
      <Icon name="chevron-right" size={16} />
      <span>Show backlinks</span>
    </button>
    <div class="menu-divider"></div>
    <button class="menu-item" on:click={() => handleAction('rename')}>
      <Icon name="edit" size={16} />
      <span>Rename</span>
    </button>
    <button class="menu-item danger" on:click={() => handleAction('delete')}>
      <Icon name="trash" size={16} />
      <span>Delete</span>
    </button>
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    min-width: 200px;
    z-index: 1000;
    padding: var(--space-2) 0;
  }

  .menu-header {
    padding: var(--space-2) var(--space-3);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .node-label {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-divider {
    height: 1px;
    background: var(--color-border);
    margin: var(--space-2) 0;
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
    text-align: left;
    transition: background 0.15s;
  }

  .menu-item:hover {
    background: var(--color-bg);
  }

  .menu-item.danger {
    color: var(--color-error, #ef4444);
  }

  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }
</style>
