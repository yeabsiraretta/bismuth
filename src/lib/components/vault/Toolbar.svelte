<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { currentVault } from '@/stores/vault/vault';
  import {
    activeNote,
    removeNoteFromStore,
    setActiveNote,
    refreshNotes,
  } from '@/stores/vault/vault';
  import { toggleLeftSidebar, toggleRightSidebar } from '@/stores/layout/layout';
  import Icon from '@/components/icons/Icon.svelte';
  import ThemeToggle from '@/components/ui/ThemeToggle.svelte';
  import NewNoteDialog from '@/components/dialogs/NewNoteDialog.svelte';
  import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.svelte';
  import SettingsModal from '@/components/modals/SettingsModal.svelte';
  import { log } from '@/utils/logger';

  // Callback prop for refresh event (Svelte 5 pattern)
  export let onRefresh: (() => void) | undefined = undefined;

  let showDeleteConfirm = false;
  let showNewNoteDialog = false;
  let newNoteName = '';
  let showSettingsMenu = false;
  let showSettingsModal = false;

  async function handleCreateNote(detail: { name: string }) {
    if (!$currentVault) return;

    log.info('Creating new note', { name: detail.name });
    try {
      const fileName = detail.name.endsWith('.md') ? detail.name : `${detail.name}.md`;
      const notePath = `${$currentVault.root_path}/${fileName}`;
      const content = `# ${detail.name}\n\n`;

      await invoke('write_note', { path: notePath, content });
      log.info('Note created successfully', { path: notePath });

      // Call refresh callback if provided, otherwise refresh directly
      if (onRefresh) {
        onRefresh();
      } else {
        await refreshNotes();
      }

      showNewNoteDialog = false;
      newNoteName = '';
    } catch (error) {
      log.error('Failed to create note', error as Error, { name: detail.name });
    }
  }

  async function handleDeleteNote() {
    if (!$activeNote) return;

    log.info('Deleting note', { path: $activeNote.path, title: $activeNote.title });
    try {
      await invoke('delete_note', { path: $activeNote.path });
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
    class="toolbar-btn"
    on:click={() => (showNewNoteDialog = true)}
    title="New Note (⌘N)"
    aria-label="Create new note"
  >
    <Icon name="file-plus" size={18} ariaLabel="New note icon" />
    <span class="label">New Note</span>
  </button>

  {#if $activeNote}
    <button
      class="toolbar-btn danger"
      on:click={() => (showDeleteConfirm = true)}
      title="Delete Note"
      aria-label="Delete note"
    >
      <Icon name="trash" size={18} ariaLabel="Delete icon" />
      <span class="label">Delete</span>
    </button>
  {/if}

  <div class="spacer"></div>

  <!-- Theme Toggle -->
  <ThemeToggle />

  <!-- Settings Menu -->
  <div class="settings-menu-container">
    <button
      class="toolbar-btn icon-only"
      on:click={() => (showSettingsMenu = !showSettingsMenu)}
      title="Settings"
      aria-label="Open settings menu"
    >
      <Icon name="settings" size={18} ariaLabel="Settings icon" />
    </button>

    {#if showSettingsMenu}
      <div class="settings-dropdown">
        <button
          class="settings-item"
          on:click={() => {
            showSettingsMenu = false;
            showSettingsModal = true;
          }}
        >
          <Icon name="settings" size={16} />
          <span>Settings</span>
        </button>
        <div class="settings-divider"></div>
        <button
          class="settings-item"
          on:click={() => {
            showSettingsMenu = false;
          }}
        >
          <Icon name="info" size={16} />
          <span>About</span>
        </button>
      </div>
    {/if}
  </div>

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

<NewNoteDialog
  isOpen={showNewNoteDialog}
  bind:noteName={newNoteName}
  onCreate={handleCreateNote}
  onClose={() => (showNewNoteDialog = false)}
/>

<DeleteConfirmDialog
  isOpen={showDeleteConfirm}
  noteTitle={$activeNote?.title || ''}
  onConfirm={handleDeleteNote}
  onClose={() => (showDeleteConfirm = false)}
/>

<SettingsModal isOpen={showSettingsModal} onClose={() => (showSettingsModal = false)} />

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    flex: 1;
    border-bottom: 1px solid var(--color-border);
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--color-border);
    margin: 0 var(--space-2);
  }

  .settings-menu-container {
    position: relative;
  }

  .settings-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 220px;
    padding: 4px;
    z-index: 1000;
  }

  .settings-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.15s;
  }

  .settings-item:hover {
    background: var(--color-surface-hover);
  }

  .settings-divider {
    height: 1px;
    background: var(--color-border);
    margin: 4px 0;
  }

  .spacer {
    flex: 1;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 36px;
    min-width: 36px;
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
    transition: all 0.15s ease;
    user-select: none;
  }

  .toolbar-btn.icon-only {
    padding: var(--space-2);
    justify-content: center;
  }

  .toolbar-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .toolbar-btn:active {
    transform: translateY(1px);
  }

  .toolbar-btn:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .toolbar-btn.danger:hover {
    background: #fee;
    border-color: #fcc;
    color: var(--color-danger);
    box-shadow: 0 1px 3px rgba(220, 53, 69, 0.2);
  }

  .label {
    font-weight: 500;
  }
</style>
