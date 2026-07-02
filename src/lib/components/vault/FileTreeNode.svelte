<script lang="ts">
  import type { Note } from '@/types/data/vault';
  import Icon from '@/components/icons/Icon.svelte';
  import { deepFileCount, type TreeNode } from './fileTreeLogic';

  function stripEmoji(text: string): string {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  }

  export let node: TreeNode;
  export let dropTargetPath: string | null;
  export let activeNotePath: string | undefined;
  export let onToggleFolder: (path: string) => void;
  export let onNoteClick: (note: Note, event?: MouseEvent) => void;
  export let selectedNotes: Set<string> = new Set();
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
    on:dragover|preventDefault={(e) => onDragOverFolder(e, node.path)}
    on:dragleave={onDragLeave}
    on:drop={(e) => onDropOnFolder(e, node.path)}
  >
    <button
      class="folder-button"
      on:click={() => onToggleFolder(node.path)}
      on:keydown={(e) => onKeydown(e, node)}
    >
      <Icon name="chevron-right" size={14} />
      <span class="node-name">{stripEmoji(node.name)}</span>
      <span class="folder-count">{deepFileCount(node)}</span>
    </button>
  </li>
{:else if node.note}
  <li
    class="note-item"
    class:active={activeNotePath === node.note.path}
    class:selected={selectedNotes.has(node.note.path)}
    draggable="true"
    on:dragstart={(e) => onDragStart(e, node.note!)}
    on:dragend={onDragEnd}
    role="treeitem"
  >
    <button
      class="note-button"
      on:click={(e) => onNoteClick(node.note!, e)}
      on:contextmenu={(e) => onContextMenu(e, node.note!)}
      on:keydown={(e) => onKeydown(e, node)}
    >
      <span class="note-title">{stripEmoji(node.note.title || node.name)}</span>
    </button>
  </li>
{/if}

<style>
  .folder-item {
    list-style: none;
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
    min-height: 26px;
    padding: 2px var(--spacing-s) 2px var(--spacing-m);
    background: none;
    border: none;
    color: var(--text-normal);
    cursor: pointer;
    text-align: left;
    font-weight: var(--font-medium);
    font-size: var(--sidebar-item-font);
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
    font-size: var(--sidebar-item-font-secondary);
    color: var(--text-faint);
    font-weight: var(--font-normal);
  }

  .node-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .note-item {
    list-style: none;
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
    min-height: 26px;
    padding: 2px var(--spacing-s) 2px var(--spacing-m);
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
    font-size: var(--sidebar-item-font);
  }

  .note-item.selected .note-button {
    background: var(--interactive-accent-hover, rgba(14, 165, 233, 0.15));
    color: var(--interactive-accent);
  }
</style>
