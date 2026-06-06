<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import { refreshNotes, removeNoteFromStore, setActiveNote } from '@/stores/vault/vault';
  import { currentVault } from '@/stores/vault/vault';
  import { log } from '@/utils/logger';
  import type { Note } from '@/types/vault';

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
      await invoke<Note>('duplicate_note', { path: note.path });
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to duplicate note', error as Error);
    }
  }

  async function handleDelete() {
    try {
      log.info('Deleting note', { path: note.path });
      await invoke('delete_note', { path: note.path });
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
      await invoke('rename_note', { oldPath: note.path, newPath });
      await invoke('update_links_on_rename', { oldPath: note.path, newPath });
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
      const folders = await invoke<string[]>('list_folders', {});
      // For now, move to root if only option; full folder picker is a UI enhancement
      if (folders.length > 0) {
        const targetFolder = folders[0];
        log.info('Moving note', { path: note.path, target: targetFolder });
        await invoke<Note>('move_note', { oldPath: note.path, newFolder: targetFolder });
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
      await invoke('write_note', { path: newPath, content });
      await refreshNotes();
      onClose();
    } catch (error) {
      log.error('Failed to create note', error as Error);
    }
  }

  async function handleOpenInFileManager() {
    try {
      await invoke('open_in_file_manager', { path: note.path });
      onClose();
    } catch (error) {
      log.error('Failed to open in file manager', error as Error);
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
    z-index: var(--layer-popover, 200);
  }

  .context-menu {
    position: absolute;
    min-width: 180px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m, 8px);
    box-shadow: var(--shadow-l);
    padding: 4px;
    z-index: var(--layer-popover, 200);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: 0.8125rem;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .menu-item:hover {
    background: var(--interactive-hover);
  }

  .menu-item.danger {
    color: var(--text-error, #ef4444);
  }

  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
  }

  .rename-input-container {
    padding: 6px;
  }

  .rename-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.8125rem;
    border: 1px solid var(--interactive-accent);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    outline: none;
  }
</style>
