<script lang="ts">
  import { currentVault } from '@/stores/vault/vault';
  import {
    activeNote,
    removeNoteFromStore,
    setActiveNote,
  } from '@/stores/vault/vault';
  import { toggleLeftSidebar, toggleRightSidebar } from '@/stores/layout/layout';
  import { settings } from '@/features/settings';
  import { deleteNote } from '@/services/vault/vault';
  import { createFolder, createInlineNote } from '@/components/vault/fileTreeLogic';
  import Icon from '@/components/icons/Icon.svelte';
  import ThemeToggle from '@/components/ui/ThemeToggle.svelte';
  import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.svelte';
  import { BreadcrumbTrail } from '@/features/breadcrumbs';
  import { log } from '@/utils/logger';

  // Callback props
  export let onRefresh: (() => void) | undefined = undefined;
  export let onNavigate: ((path: string) => void) | undefined = undefined;

  let showDeleteConfirm = false;

  async function handleCreateNote() {
    if (!$currentVault) return;
    try {
      const basePath = $settings.defaultNoteLocation
        ? `${$currentVault.root_path}/${$settings.defaultNoteLocation}`.replace(/\/+$/, '')
        : $currentVault.root_path;
      await createInlineNote(basePath);
      if (onRefresh) onRefresh();
    } catch (error) {
      log.error('Failed to create note', error as Error);
    }
  }

  async function handleCreateFolder() {
    if (!$currentVault) return;
    try {
      await createFolder('Untitled Folder', $currentVault.root_path, new Set());
      log.info('Folder created inline');
      if (onRefresh) onRefresh();
    } catch (error) {
      log.error('Failed to create folder', error as Error);
    }
  }

  async function handleDeleteNote() {
    if (!$activeNote) return;

    log.info('Deleting note', { path: $activeNote.path, title: $activeNote.title });
    try {
      await deleteNote($activeNote.path);
      removeNoteFromStore($activeNote.path);
      setActiveNote(null);
      showDeleteConfirm = false;
      log.info('Note deleted successfully', { path: $activeNote.path });
    } catch (error) {
      log.error('Failed to delete note', error as Error, { path: $activeNote.path });
    }
  }
</script>

<div class="toolbar">
  <!-- Left sidebar toggle -->
  <button
    class="toolbar-btn icon-only"
    on:click={toggleLeftSidebar}
    title="Toggle File Explorer"
    aria-label="Toggle file explorer sidebar"
  >
    <Icon name="sidebar" size={18} ariaLabel="Toggle sidebar icon" />
  </button>

  <div class="toolbar-divider"></div>

  <button
    class="toolbar-btn icon-only"
    on:click={handleCreateNote}
    title="New Note (⌘N)"
    aria-label="Create new note"
  >
    <Icon name="file-plus" size={18} ariaLabel="New note icon" />
  </button>

  <button
    class="toolbar-btn icon-only"
    on:click={handleCreateFolder}
    title="New Folder"
    aria-label="Create new folder"
  >
    <Icon name="folder-plus" size={18} ariaLabel="New folder icon" />
  </button>

  {#if $activeNote}
    <button
      class="toolbar-btn icon-only danger"
      on:click={() => { if ($settings.confirmBeforeDelete) { showDeleteConfirm = true; } else { handleDeleteNote(); } }}
      title="Delete Note"
      aria-label="Delete note"
    >
      <Icon name="trash" size={18} ariaLabel="Delete icon" />
    </button>
  {/if}

  <div class="toolbar-divider"></div>

  <BreadcrumbTrail {onNavigate} />

  <!-- Theme Toggle -->
  <ThemeToggle />

  <!-- Right sidebar toggle -->
  <button
    class="toolbar-btn icon-only"
    on:click={toggleRightSidebar}
    title="Toggle Right Sidebar"
    aria-label="Toggle right sidebar"
  >
    <Icon name="panel-right" size={18} ariaLabel="Toggle right sidebar icon" />
  </button>
</div>

<DeleteConfirmDialog
  isOpen={showDeleteConfirm}
  noteTitle={$activeNote?.title || ''}
  onConfirm={handleDeleteNote}
  onClose={() => (showDeleteConfirm = false)}
/>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--grid-gap-xs, 4px);
    padding: 0 var(--grid-gap-sm, 8px);
    background: var(--color-surface);
    flex: 1;
    height: var(--panel-header-height);
    min-height: var(--panel-header-height);
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 var(--grid-gap-xs, 4px);
  }


  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.15s ease;
    user-select: none;
  }

  .toolbar-btn.icon-only {
    padding: 0;
    width: 28px;
  }

  .toolbar-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .toolbar-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toolbar-btn.danger:hover {
    background-color: var(--interactive-hover);
    color: var(--text-error);
  }



</style>
