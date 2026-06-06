<script lang="ts">
  import type { Note } from '@/types/vault';
  import Icon from '@/components/icons/Icon.svelte';
  import type { TreeNode } from './fileTreeLogic';

  export let node: TreeNode;
  export let expandedFolders: Set<string>;
  export let dropTargetPath: string | null;
  export let activeNotePath: string | undefined;
  export let onToggleFolder: (path: string) => void;
  export let onNoteClick: (note: Note) => void;
  export let onContextMenu: (event: MouseEvent, note: Note) => void;
  export let onDragStart: (event: DragEvent, note: Note) => void;
  export let onDragEnd: () => void;
  export let onDragOverFolder: (event: DragEvent, path: string) => void;
  export let onDragLeave: () => void;
  export let onDropOnFolder: (event: DragEvent, path: string) => void;
  export let onKeydown: (e: KeyboardEvent, node: TreeNode) => void;
</script>

{#if node.type === 'folder'}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <li
    class="folder-item"
    class:drop-target={dropTargetPath === node.path}
    role="treeitem"
    aria-expanded={expandedFolders.has(node.path)}
    on:dragover|preventDefault={(e) => onDragOverFolder(e, node.path)}
    on:dragleave={onDragLeave}
    on:drop={(e) => onDropOnFolder(e, node.path)}
  >
    <button
      class="folder-button"
      on:click={() => onToggleFolder(node.path)}
      on:keydown={(e) => onKeydown(e, node)}
    >
      <Icon name={expandedFolders.has(node.path) ? 'chevron-down' : 'chevron-right'} size={14} />
      <Icon name={expandedFolders.has(node.path) ? 'folder-open' : 'folder'} size={16} />
      <span class="node-name">{node.name}</span>
      <span class="folder-count">{node.children.filter(c => c.type === 'file').length}</span>
    </button>
    {#if expandedFolders.has(node.path)}
      <ul class="node-list nested" role="group">
        {#each node.children as child (child.path)}
          <svelte:self
            node={child}
            {expandedFolders}
            {dropTargetPath}
            {activeNotePath}
            {onToggleFolder}
            {onNoteClick}
            {onContextMenu}
            {onDragStart}
            {onDragEnd}
            {onDragOverFolder}
            {onDragLeave}
            {onDropOnFolder}
            {onKeydown}
          />
        {/each}
      </ul>
    {/if}
  </li>
{:else if node.note}
  <li
    class="note-item"
    class:active={activeNotePath === node.note.path}
    draggable="true"
    on:dragstart={(e) => onDragStart(e, node.note!)}
    on:dragend={onDragEnd}
    role="treeitem"
  >
    <button
      class="note-button"
      on:click={() => onNoteClick(node.note!)}
      on:contextmenu={(e) => onContextMenu(e, node.note!)}
      on:keydown={(e) => onKeydown(e, node)}
    >
      <Icon name="file" size={16} />
      <span class="note-title">{node.note.title || node.name}</span>
    </button>
  </li>
{/if}

<style>
  .folder-item {
    transition: background-color var(--transition-fast);
  }

  .folder-item.drop-target {
    background: var(--interactive-accent-hover, rgba(14, 165, 233, 0.1));
  }

  .folder-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-height: 32px;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    font-weight: var(--font-medium);
    font-size: var(--font-ui-small);
    transition: all var(--transition-fast);
    user-select: none;
  }

  .folder-button:hover {
    background: var(--background-modifier-hover);
  }

  .folder-button:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .folder-count {
    margin-left: auto;
    font-size: var(--font-smallest);
    color: var(--text-faint);
    font-weight: var(--font-normal);
  }

  .node-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .node-list.nested {
    padding-left: var(--spacing-m);
  }

  .note-item {
    transition: background-color var(--transition-fast);
  }

  .note-item.active {
    background: var(--interactive-hover);
  }

  .note-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    min-height: 32px;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-fast);
    user-select: none;
  }

  .note-button:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .note-button:hover {
    background: var(--background-modifier-hover);
  }

  .note-item.active .note-button {
    background: var(--interactive-hover);
    font-weight: var(--font-medium);
    color: var(--text-accent);
  }

  .note-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-small);
  }
</style>
