<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { refreshNotes, removeNoteFromStore, setActiveNote } from '@/stores/vault/vault';
  import { currentVault } from '@/stores/vault/vault';
  import {
    duplicateNote as duplicateNoteService,
    deleteNote as deleteNoteService,
    renameNote as renameNoteService,
    updateLinksOnRename,
    listFolders,
    moveNote as moveNoteService,
    writeNote,
    openInFileManager,
  } from '@/services/vault/vault';
  import { archiveNoteCmd, organizeNoteCmd } from '@/features/capture';
  import { log } from '@/utils/logger';
  import type { Note } from '@/types/data/vault';

  export let note: Note;
  export let x: number = 0;
  export let y: number = 0;
  export let onClose: () => void;

  let isRenaming = false;
  let renameValue = '';

  function getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  async function handleDuplicate() {
    try {
      log.info('Duplicating note', { path: note.path });
      await duplicateNoteService(note.path);
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to duplicate note', error as Error);
    }
  }

  async function handleDelete() {
    try {
      log.info('Deleting note', { path: note.path });
      await deleteNoteService(note.path);
      removeNoteFromStore(note.path);
      setActiveNote(null);
      onClose();
    } catch (error) {
      log.error('Failed to delete note', error as Error);
    }
  }

  function startRename() {
    isRenaming = true;
    renameValue = getFileName(note.path).replace(/\.md$/, '');
  }

  async function handleRename() {
    if (!renameValue.trim()) {
      isRenaming = false;
      return;
    }
    try {
      const dir = note.path.substring(0, note.path.lastIndexOf('/'));
      const newName = renameValue.trim().endsWith('.md')
        ? renameValue.trim()
        : `${renameValue.trim()}.md`;
      const newPath = `${dir}/${newName}`;

      if (newPath === note.path) {
        isRenaming = false;
        onClose();
        return;
      }

      log.info('Renaming note', { oldPath: note.path, newPath });
      await renameNoteService(note.path, newPath);
      await updateLinksOnRename(note.path, newPath);
      await refreshNotes();
      isRenaming = false;
      onClose();
    } catch (error) {
      log.error('Failed to rename note', error as Error);
      isRenaming = false;
    }
  }

  async function handleMoveToFolder() {
    if (!$currentVault) return;
    try {
      const folders = await listFolders($currentVault.root_path);
      if (folders.length > 0) {
        const targetFolder = folders[0];
        log.info('Moving note', { path: note.path, target: targetFolder });
        await moveNoteService(note.path, targetFolder);
        await refreshNotes();
      }
      onClose();
    } catch (error) {
      log.error('Failed to move note', error as Error);
    }
  }

  async function handleCreateNoteHere() {
    if (!$currentVault) return;
    try {
      const dir = note.path.substring(0, note.path.lastIndexOf('/'));
      const newPath = `${dir}/Untitled.md`;
      const content = '# Untitled\n\n';
      await writeNote(newPath, content);
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to create note', error as Error);
    }
  }

  async function handleOpenInFileManager() {
    try {
      await openInFileManager(note.path);
      onClose();
    } catch (error) {
      log.error('Failed to open in file manager', error as Error);
    }
  }

  async function handleArchive() {
    try {
      await archiveNoteCmd(note.path);
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to archive note', error as Error, { path: note.path });
    }
  }

  async function handleOrganize() {
    const folder = prompt('Move to folder (path relative to vault root):');
    if (!folder || !folder.trim()) return;
    try {
      await organizeNoteCmd(note.path, folder.trim());
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to organize note', error as Error, { path: note.path });
    }
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      isRenaming = false;
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="context-menu-overlay"
  on:click={onClose}
  on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
  role="presentation"
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="context-menu"
    style="left: {x}px; top: {y}px;"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="menu"
    tabindex="-1"
  >
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
      <button class="menu-item" on:click={handleCreateNoteHere} role="menuitem">
        <Icon name="file-plus" size={14} />
        <span>New Note Here</span>
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item" on:click={startRename} role="menuitem">
        <Icon name="edit-2" size={14} />
        <span>Rename</span>
      </button>
      <button class="menu-item" on:click={handleDuplicate} role="menuitem">
        <Icon name="copy" size={14} />
        <span>Duplicate</span>
      </button>
      <button class="menu-item" on:click={handleMoveToFolder} role="menuitem">
        <Icon name="folder" size={14} />
        <span>Move to...</span>
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item" on:click={handleArchive} role="menuitem">
        <Icon name="archive" size={14} />
        <span>Archive</span>
      </button>
      <button class="menu-item" on:click={handleOrganize} role="menuitem">
        <Icon name="folder-input" size={14} />
        <span>Organize...</span>
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item" on:click={handleOpenInFileManager} role="menuitem">
        <Icon name="external-link" size={14} />
        <span>Reveal in Finder</span>
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item danger" on:click={handleDelete} role="menuitem">
        <Icon name="trash" size={14} />
        <span>Delete</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .context-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--layer-popover);
  }

  .context-menu {
    position: absolute;
    min-width: 180px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    padding: var(--spacing-xs);
    z-index: var(--layer-popover);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
    padding: var(--menu-item-padding-y) var(--menu-item-padding-x);
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: var(--sidebar-item-font);
    text-align: left;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .menu-item:hover {
    background: var(--interactive-hover);
  }

  .menu-item.danger {
    color: var(--text-error);
  }

  .menu-item.danger:hover {
    background: var(--background-modifier-error-hover, rgba(239, 68, 68, 0.1));
  }

  .menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--spacing-xs) 0;
  }

  .rename-input-container {
    padding: var(--spacing-xs);
  }

  .rename-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: var(--sidebar-item-font);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    outline: none;
  }
</style>
