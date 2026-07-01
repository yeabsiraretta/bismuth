<script lang="ts">
  import { ContextMenu, MenuItem, MenuDivider } from '@/components/ui/menu';
  import {
    createFolder,
    createInlineNote,
    renameFolder,
    deleteFolder,
  } from '@/components/vault/fileTreeLogic';
  import { log } from '@/utils/logger';

  export let folderPath: string;
  export let folderName: string;
  export let x: number = 0;
  export let y: number = 0;
  export let onClose: () => void;

  let show = true;
  let isRenaming = false;
  let renameValue = '';

  function handleClose() {
    show = false;
    onClose();
  }

  async function handleNewNote() {
    try {
      await createInlineNote(folderPath);
      handleClose();
    } catch (error) {
      log.error('Failed to create note in folder', error as Error);
    }
  }

  async function handleNewFolder() {
    try {
      await createFolder('Untitled Folder', folderPath, new Set());
      handleClose();
    } catch (error) {
      log.error('Failed to create subfolder', error as Error);
    }
  }

  function startRename() {
    isRenaming = true;
    renameValue = folderName;
  }

  async function handleRename() {
    if (!renameValue.trim()) {
      isRenaming = false;
      return;
    }
    try {
      await renameFolder(folderPath, renameValue.trim());
      isRenaming = false;
      handleClose();
    } catch (error) {
      log.error('Failed to rename folder', error as Error);
      isRenaming = false;
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete folder "${folderName}" and all its contents?`)) return;
    try {
      await deleteFolder(folderPath);
      handleClose();
    } catch (error) {
      log.error('Failed to delete folder', error as Error);
    }
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      isRenaming = false;
      handleClose();
    }
  }
</script>

<ContextMenu {x} {y} {show} onClose={handleClose}>
  {#if isRenaming}
    <div class="rename-input-container">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="rename-input"
        type="text"
        bind:value={renameValue}
        on:keydown={handleRenameKeydown}
        on:blur={handleRename}
        autofocus
      />
    </div>
  {:else}
    <MenuItem icon="file-plus" label="New Note" on:click={handleNewNote} />
    <MenuItem icon="folder-plus" label="New Folder" on:click={handleNewFolder} />
    <MenuDivider />
    <MenuItem icon="edit-2" label="Rename" on:click={startRename} />
    <MenuDivider />
    <MenuItem icon="trash" label="Delete" destructive on:click={handleDelete} />
  {/if}
</ContextMenu>

<style>
  .rename-input-container {
    padding: 6px;
  }

  .rename-input {
    width: 100%;
    padding: 4px 8px;
    font-size: var(--sidebar-item-font);
    border: 1px solid var(--interactive-accent);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    outline: none;
  }
</style>
