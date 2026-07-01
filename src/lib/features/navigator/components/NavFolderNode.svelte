<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
    noteCount: number;
  }

  export let node: FolderNode;
  export let depth: number = 0;
  export let expandedFolders: Set<string>;
  export let selectedPath: string | null;
  export let onToggleExpand: (path: string) => void;
  export let onFolderClick: (folder: FolderNode) => void;
  export let handleKeydown: (e: KeyboardEvent, folder: FolderNode) => void;

  $: isExpanded = expandedFolders.has(node.path);
  $: hasChildren = node.children.length > 0;
  $: isSelected = selectedPath === node.path;
</script>

<div
  class="tree-item"
  role="treeitem"
  tabindex="0"
  aria-expanded={hasChildren ? isExpanded : undefined}
  aria-selected={isSelected}
  class:selected={isSelected}
  style="padding-left: {8 + depth * 16}px"
  on:click={() => onFolderClick(node)}
  on:keydown={(e) => handleKeydown(e, node)}
>
  {#if hasChildren}
    <button
      class="expand-btn"
      on:click|stopPropagation={() => onToggleExpand(node.path)}
      aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
    >
      <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
    </button>
  {:else}
    <span class="expand-spacer"></span>
  {/if}
  <Icon name={isExpanded ? 'folder-open' : 'folder'} size={14} />
  <span class="folder-name">{node.name}</span>
  <span class="folder-count">{node.noteCount}</span>
</div>

{#if isExpanded && hasChildren}
  {#each node.children as child (child.path)}
    <svelte:self
      node={child}
      depth={depth + 1}
      {expandedFolders}
      {selectedPath}
      {onToggleExpand}
      {onFolderClick}
      {handleKeydown}
    />
  {/each}
{/if}

<style>
  .tree-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal);
    user-select: none;
  }

  .tree-item:hover { background: var(--interactive-hover); }
  .tree-item.selected { background: var(--interactive-accent); color: var(--text-on-accent); }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }
  .expand-btn:hover { background: var(--background-modifier-hover); }

  .expand-spacer { width: 16px; flex-shrink: 0; }

  .folder-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .folder-count {
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
    min-width: 16px;
    text-align: right;
  }
  .selected .folder-count { color: var(--text-on-accent); opacity: 0.7; }
</style>
