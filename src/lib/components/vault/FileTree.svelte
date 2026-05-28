<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { notes, activeNote, setActiveNote } from '@/stores/vault/vault';
  import type { Note } from '@/types/vault';
  import Icon from '@/components/icons/Icon.svelte';

  async function handleNoteClick(note: Note) {
    try {
      // note.path is already an absolute path from the backend
      const fullNote = await invoke<Note>('read_note', { path: note.path });
      setActiveNote(fullNote);
    } catch (error) {
      console.error('Failed to read note:', error);
    }
  }

  function getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  function isActive(note: Note): boolean {
    return $activeNote?.path === note.path;
  }
</script>

<div class="file-tree">
  <div class="header">
    <div class="header-title">
      <Icon name="folder-open" size={18} />
      <h2>Notes</h2>
    </div>
    <span class="count">{$notes.length}</span>
  </div>

  <div class="tree-content">
    {#if $notes.length === 0}
      <div class="empty-state">
        <Icon name="file" size={48} color="var(--text-muted)" strokeWidth={1.5} />
        <p>No notes found</p>
        <p class="hint">Create your first note to get started</p>
      </div>
    {:else}
      <ul class="note-list">
        {#each $notes as note (note.path)}
          <li class="note-item" class:active={isActive(note)}>
            <button class="note-button" on:click={() => handleNoteClick(note)}>
              <Icon name="file" size={16} />
              <span class="note-title">{note.title || getFileName(note.path)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

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
    padding: var(--spacing-m);
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

  .count {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    padding: 2px var(--spacing-s);
    border-radius: var(--radius-l);
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
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

  .note-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .note-item {
    border-bottom: 1px solid var(--border-color);
  }

  .note-item.active {
    background: var(--interactive-hover);
  }

  .note-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    min-height: 40px;
    padding: var(--spacing-s) var(--spacing-m);
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

  .note-button:active {
    transform: scale(0.98);
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
