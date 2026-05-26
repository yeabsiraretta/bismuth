<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { notes, activeNote, setActiveNote } from '@/stores/vault/vault';
  import type { Note } from '@/types/vault';
  import Icon from '@/components/icons/Icon.svelte';

  async function handleNoteClick(note: Note) {
    try {
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
    background: var(--bg-secondary, #f5f5f5);
    border-right: 1px solid var(--border-color, #ddd);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .count {
    background: var(--accent-color, #007bff);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tree-content {
    flex: 1;
    overflow-y: auto;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-muted, #666);
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
  }

  .note-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .note-item {
    border-bottom: 1px solid var(--border-color, #eee);
  }

  .note-item.active {
    background: var(--bg-active, #e3f2fd);
  }

  .note-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    user-select: none;
  }

  .note-button:focus-visible {
    outline: 2px solid var(--accent-color, #007bff);
    outline-offset: -2px;
  }

  .note-button:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .note-button:active {
    transform: scale(0.98);
  }

  .note-item.active .note-button {
    background: var(--bg-active, #e3f2fd);
    font-weight: 500;
  }

  .note-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
  }
</style>
