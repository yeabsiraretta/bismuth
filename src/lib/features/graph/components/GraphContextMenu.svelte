<script lang="ts">
  import type { GraphNode } from '../types';
  import { ContextMenu, MenuItem, MenuDivider } from '@/components/ui/menu';

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

  function handleClose() {
    visible = false;
  }
</script>

{#if node}
  <ContextMenu {x} {y} show={visible} onClose={handleClose}>
    <div class="menu-header">
      <span class="node-label">{node.label}</span>
    </div>
    <MenuDivider />
    <MenuItem icon="file" label="Open" on:click={() => handleAction('open')} />
    <MenuItem
      icon="layout"
      label="Open in new pane"
      on:click={() => handleAction('open-new-pane')}
    />
    <MenuDivider />
    <MenuItem
      icon="search"
      label="Show local graph"
      on:click={() => handleAction('show-local-graph')}
    />
    <MenuItem
      icon="chevron-right"
      label="Show backlinks"
      on:click={() => handleAction('show-backlinks')}
    />
    <MenuDivider />
    <MenuItem icon="edit" label="Rename" on:click={() => handleAction('rename')} />
    <MenuItem icon="trash" label="Delete" destructive on:click={() => handleAction('delete')} />
  </ContextMenu>
{/if}

<style>
  .menu-header {
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .node-label {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
