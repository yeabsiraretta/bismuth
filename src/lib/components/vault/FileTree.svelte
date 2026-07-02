<script lang="ts">
  import { activeNote, currentVault } from '@/stores/vault/vault';
  import { filteredNotes } from '@/features/tag';
  import type { Note } from '@/types/data/vault';
  import Icon from '@/components/icons/Icon.svelte';
  import FileContextMenu from './FileContextMenu.svelte';
  import { MergeNotesModal } from '@/features/capture';
  import { log } from '@/utils/logger';
  import {
    type TreeNode,
    type SortKey,
    buildTree,
    createFolder,
    moveNoteToFolder,
    openNote,
  } from './fileTreeLogic';
  import FileTreeNode from './FileTreeNode.svelte';

  let sortBy: SortKey = 'name';
  let showSortMenu = false;
  let currentFolderPath: string | null = null;
  let selectedNotes: Set<string> = new Set();
  let mergeModalOpen = false;
  $: mergeSourcePaths = Array.from(selectedNotes);

  // Auto-navigate to the parent folder of the active note
  $: if ($activeNote && $currentVault) {
    const parentPath = $activeNote.path.substring(0, $activeNote.path.lastIndexOf('/'));
    currentFolderPath = parentPath.length > $currentVault.root_path.length ? parentPath : null;
  }

  $: tree = buildTree($filteredNotes, $currentVault?.root_path || '', sortBy);

  function findFolderNode(nodes: TreeNode[], path: string): TreeNode | null {
    for (const node of nodes) {
      if (node.type === 'folder' && node.path === path) return node;
      if (node.type === 'folder') {
        const found = findFolderNode(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  $: visibleNodes = currentFolderPath
    ? (findFolderNode(tree, currentFolderPath)?.children ?? tree)
    : tree;
  $: currentFolderName = currentFolderPath?.split('/').pop() || 'Notes';

  function navigateToFolder(path: string) {
    currentFolderPath = path;
  }

  function navigateUp() {
    if (!currentFolderPath || !$currentVault) {
      currentFolderPath = null;
      return;
    }
    const parent = currentFolderPath.substring(0, currentFolderPath.lastIndexOf('/'));
    currentFolderPath = parent.length > $currentVault.root_path.length ? parent : null;
  }

  // --- Inline folder creation ---
  let isCreatingFolder = false;
  let newFolderName = '';

  function startCreateFolder() {
    isCreatingFolder = true;
    newFolderName = '';
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !$currentVault) {
      isCreatingFolder = false;
      return;
    }
    try {
      await createFolder(newFolderName, $currentVault.root_path, new Set());
      const folderPath = `${$currentVault.root_path}/${newFolderName.trim()}`;
      navigateToFolder(folderPath);
    } catch (error) {
      log.error('Failed to create folder', error as Error);
    }
    isCreatingFolder = false;
  }

  function handleNewFolderKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleCreateFolder();
    else if (e.key === 'Escape') isCreatingFolder = false;
  }

  // --- Context menu ---
  let contextMenuNote: Note | null = null;
  let contextMenuX = 0;
  let contextMenuY = 0;

  function handleContextMenu(event: MouseEvent, note: Note) {
    event.preventDefault();
    contextMenuNote = note;
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
  }

  function closeContextMenu() {
    contextMenuNote = null;
  }

  function toggleNoteSelection(path: string) {
    if (selectedNotes.has(path)) selectedNotes.delete(path);
    else selectedNotes.add(path);
    selectedNotes = selectedNotes;
  }

  function clearNoteSelection() {
    selectedNotes = new Set();
  }

  // --- Drag and drop ---
  let draggedNote: Note | null = null;
  let dropTargetPath: string | null = null;

  function handleDragStart(event: DragEvent, note: Note) {
    if (!event.dataTransfer) return;
    draggedNote = note;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', note.path);
  }

  function handleDragOverFolder(event: DragEvent, folderPath: string) {
    event.preventDefault();
    if (!draggedNote) return;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    dropTargetPath = folderPath;
  }

  function handleDragLeave() {
    dropTargetPath = null;
  }
  function handleDragEnd() {
    draggedNote = null;
    dropTargetPath = null;
  }

  async function handleDropOnFolder(event: DragEvent, folderPath: string) {
    event.preventDefault();
    if (!draggedNote) {
      handleDragEnd();
      return;
    }
    try {
      await moveNoteToFolder(draggedNote, folderPath);
    } catch (error) {
      log.error('Failed to move note via drag-and-drop', error as Error);
    }
    handleDragEnd();
  }

  async function handleDropOnHeader(event: DragEvent) {
    event.preventDefault();
    if (!draggedNote || !$currentVault) {
      handleDragEnd();
      return;
    }
    const target = currentFolderPath || $currentVault.root_path;
    try {
      await moveNoteToFolder(draggedNote, target);
    } catch (error) {
      log.error('Failed to move note', error as Error);
    }
    handleDragEnd();
  }

  async function handleNoteClick(note: Note, event?: MouseEvent) {
    if (event && (event.metaKey || event.ctrlKey)) {
      toggleNoteSelection(note.path);
      return;
    }
    try {
      await openNote(note);
    } catch (error) {
      log.error('Failed to read note:', error as Error);
    }
  }

  function handleTreeKeydown(e: KeyboardEvent, node: TreeNode) {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      if (node.type === 'folder') {
        e.preventDefault();
        navigateToFolder(node.path);
      } else if (node.note) handleNoteClick(node.note);
    }
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      navigateUp();
    }
  }
</script>

<div class="file-tree">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="header"
    class:drop-target={dropTargetPath === (currentFolderPath || $currentVault?.root_path || '')}
    on:dragover|preventDefault={(e) =>
      handleDragOverFolder(e, currentFolderPath || $currentVault?.root_path || '')}
    on:dragleave={handleDragLeave}
    on:drop={handleDropOnHeader}
  >
    <div class="header-title">
      {#if currentFolderPath}
        <button
          class="icon-btn"
          on:click={navigateUp}
          aria-label="Go back"
          title="Go to parent folder"
        >
          <Icon name="arrow-left" size={16} />
        </button>
      {/if}
      <h2>{currentFolderName}</h2>
    </div>
    <div class="header-actions">
      {#if selectedNotes.size >= 2}
        <button
          class="icon-btn"
          on:click={() => {
            mergeModalOpen = true;
          }}
          aria-label="Merge selected notes"
          title="Merge {selectedNotes.size} notes"
        >
          <Icon name="git-merge" size={16} />
        </button>
        <button
          class="icon-btn"
          on:click={clearNoteSelection}
          aria-label="Clear selection"
          title="Clear selection"
        >
          <Icon name="x" size={16} />
        </button>
      {/if}
      <button class="icon-btn" on:click={startCreateFolder} aria-label="New folder">
        <Icon name="folder-plus" size={16} />
      </button>
      <div class="sort-wrapper">
        <button class="icon-btn" on:click={() => (showSortMenu = !showSortMenu)} aria-label="Sort">
          <Icon name="arrow-up-down" size={16} />
        </button>
        {#if showSortMenu}
          <div class="sort-menu" role="menu">
            <button
              class="sort-option"
              class:active={sortBy === 'name'}
              on:click={() => {
                sortBy = 'name';
                showSortMenu = false;
              }}
              role="menuitem">Name</button
            >
            <button
              class="sort-option"
              class:active={sortBy === 'modified'}
              on:click={() => {
                sortBy = 'modified';
                showSortMenu = false;
              }}
              role="menuitem">Modified</button
            >
            <button
              class="sort-option"
              class:active={sortBy === 'created'}
              on:click={() => {
                sortBy = 'created';
                showSortMenu = false;
              }}
              role="menuitem">Created</button
            >
          </div>
        {/if}
      </div>
      <span class="count">{$filteredNotes.length}</span>
    </div>
  </div>

  {#if isCreatingFolder}
    <div class="inline-input">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={newFolderName}
        on:keydown={handleNewFolderKeydown}
        on:blur={handleCreateFolder}
        placeholder="Folder name..."
        autofocus
      />
    </div>
  {/if}

  <div class="tree-content" role="tree">
    {#if $filteredNotes.length === 0}
      <div class="empty-state">
        <Icon name="file" size={48} color="var(--text-muted)" strokeWidth={1.5} />
        <p>No notes found</p>
        <p class="hint">Create your first note to get started</p>
      </div>
    {:else}
      <ul class="node-list" role="group">
        {#each visibleNodes as node (node.path)}
          <FileTreeNode
            {node}
            {dropTargetPath}
            activeNotePath={$activeNote?.path}
            {selectedNotes}
            onToggleFolder={navigateToFolder}
            onNoteClick={handleNoteClick}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverFolder={handleDragOverFolder}
            onDragLeave={handleDragLeave}
            onDropOnFolder={handleDropOnFolder}
            onKeydown={handleTreeKeydown}
          />
        {/each}
      </ul>
    {/if}
  </div>
</div>

{#if contextMenuNote}
  <FileContextMenu
    note={contextMenuNote}
    x={contextMenuX}
    y={contextMenuY}
    onClose={closeContextMenu}
  />
{/if}

<MergeNotesModal
  isOpen={mergeModalOpen}
  sources={mergeSourcePaths}
  onClose={() => {
    mergeModalOpen = false;
  }}
  onMerged={() => {
    mergeModalOpen = false;
    clearNoteSelection();
  }}
/>

<style>
  .file-tree {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-secondary);
    color: var(--text-normal);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .header-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }
  .header h2 {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .header.drop-target {
    background: var(--interactive-accent-hover, rgba(14, 165, 233, 0.1));
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .icon-btn:hover {
    background: var(--interactive-hover);
    color: var(--text-normal);
  }
  .sort-wrapper {
    position: relative;
  }
  .sort-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--spacing-xs);
    min-width: 120px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
    padding: var(--spacing-xs);
    z-index: var(--layer-popover);
  }
  .sort-option {
    display: block;
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    text-align: left;
    cursor: pointer;
  }
  .sort-option:hover {
    background: var(--interactive-hover);
  }
  .sort-option.active {
    color: var(--interactive-accent);
    font-weight: var(--font-medium);
  }
  .count {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    padding: 2px var(--spacing-s);
    border-radius: var(--radius-l);
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
  }
  .inline-input {
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .inline-input input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    outline: none;
  }
  .tree-content {
    flex: 1;
    overflow-y: auto;
  }
  .empty-state {
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
  }
  .empty-state p {
    margin: var(--spacing-s) 0;
  }
  .hint {
    font-size: var(--font-smaller);
    color: var(--text-faint);
  }
  .node-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
