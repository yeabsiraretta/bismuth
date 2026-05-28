<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { onMount } from 'svelte';
  import { commands as commandsStore, executeCommand as execCmd } from '@/stores/commands';
  import { notes } from '@/stores/vault/vault';
  import { invoke } from '@tauri-apps/api/core';
  import type { Note } from '@/types/vault';

  export let isOpen = false;
  export let onClose: () => void;
  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  type PaletteMode = 'commands' | 'notes';
  let mode: PaletteMode = 'notes';

  let searchQuery = '';
  let selectedIndex = 0;

  $: if (searchQuery.startsWith('>')) {
    mode = 'commands';
  } else {
    mode = 'notes';
  }

  $: effectiveQuery = mode === 'commands' ? searchQuery.slice(1).trim() : searchQuery;

  // Note search results
  $: filteredNotes =
    mode === 'notes'
      ? $notes
          .filter((n) => {
            if (!effectiveQuery) return true;
            const q = effectiveQuery.toLowerCase();
            return n.title?.toLowerCase().includes(q) || n.path?.toLowerCase().includes(q);
          })
          .slice(0, 20)
      : [];

  // Command search results
  $: filteredCommands =
    mode === 'commands'
      ? $commandsStore.filter(
          (cmd) =>
            !effectiveQuery ||
            cmd.name.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
            cmd.description.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
            cmd.category.toLowerCase().includes(effectiveQuery.toLowerCase())
        )
      : [];

  $: totalItems = mode === 'notes' ? filteredNotes.length : filteredCommands.length;

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, totalItems - 1);
        scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (mode === 'notes' && filteredNotes[selectedIndex]) {
          handleOpenNote(filteredNotes[selectedIndex]);
        } else if (mode === 'commands' && filteredCommands[selectedIndex]) {
          handleExecuteCommand(filteredCommands[selectedIndex].id);
        }
        break;
    }
  }

  function scrollToSelected() {
    const element = document.querySelector(`[data-index="${selectedIndex}"]`);
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function handleExecuteCommand(commandId: string) {
    onClose();
    await execCmd(commandId);
  }

  async function handleOpenNote(note: Note) {
    onClose();
    if (onOpenNote) {
      onOpenNote(note.path);
    } else {
      try {
        const fullNote = await invoke<Note>('read_note', { path: note.path });
        const { setActiveNote } = await import('@/stores/vault/vault');
        setActiveNote(fullNote);
      } catch (e) {
        console.error('Failed to open note:', e);
      }
    }
  }

  onMount(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  $: if (isOpen) {
    searchQuery = '';
    selectedIndex = 0;
    setTimeout(() => {
      const input = document.querySelector('.command-input') as HTMLInputElement;
      input?.focus();
    }, 50);
  }

  $: if (effectiveQuery !== undefined) {
    selectedIndex = 0;
  }
</script>

{#if isOpen}
  <div class="command-overlay" on:click={onClose} role="presentation">
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <div
      class="command-palette"
      on:click|stopPropagation
      role="dialog"
      aria-label="Command palette"
      tabindex="-1"
    >
      <div class="command-header">
        <Icon name={mode === 'commands' ? 'terminal' : 'search'} size={18} />
        <input
          type="text"
          class="command-input"
          placeholder={mode === 'commands'
            ? 'Type a command...'
            : 'Search notes... (type > for commands)'}
          bind:value={searchQuery}
        />
      </div>

      <div class="command-results">
        {#if mode === 'notes'}
          {#if filteredNotes.length === 0}
            <div class="empty-state">
              <Icon name="search" size={32} />
              <p>No notes found</p>
            </div>
          {:else}
            {#each filteredNotes as note, idx}
              <button
                class="command-item"
                class:selected={idx === selectedIndex}
                data-index={idx}
                on:click={() => handleOpenNote(note)}
              >
                <Icon name="file-text" size={16} />
                <div class="command-info">
                  <div class="command-name">{note.title || 'Untitled'}</div>
                  <div class="command-description">{note.path}</div>
                </div>
              </button>
            {/each}
          {/if}
        {:else if filteredCommands.length === 0}
          <div class="empty-state">
            <Icon name="terminal" size={32} />
            <p>No commands found</p>
          </div>
        {:else}
          {#each filteredCommands as cmd, idx}
            <button
              class="command-item"
              class:selected={idx === selectedIndex}
              data-index={idx}
              on:click={() => handleExecuteCommand(cmd.id)}
            >
              <Icon name="play" size={16} />
              <div class="command-info">
                <div class="command-name">{cmd.name}</div>
                <div class="command-description">{cmd.description}</div>
              </div>
              {#if cmd.shortcut}
                <div class="command-shortcut">{cmd.shortcut}</div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <div class="command-footer">
        <span class="hint"><kbd>↑↓</kbd> Navigate</span>
        <span class="hint"><kbd>Enter</kbd> {mode === 'notes' ? 'Open' : 'Execute'}</span>
        <span class="hint"><kbd>Esc</kbd> Close</span>
        <span class="hint">{mode === 'notes' ? '> for commands' : 'Remove > for notes'}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: 1000;
  }

  .command-palette {
    width: 90%;
    max-width: 600px;
    max-height: 60vh;
    background-color: var(--background-primary);
    border-radius: var(--radius-m);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .command-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .command-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    font-size: 16px;
    outline: none;
  }

  .command-input::placeholder {
    color: var(--text-faint);
  }

  .command-results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .category-header {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .command-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-align: left;
  }

  .command-item:hover {
    background-color: var(--interactive-hover);
  }

  .command-item.selected {
    background-color: var(--interactive-accent);
  }

  .command-item.selected .command-name,
  .command-item.selected .command-description,
  .command-item.selected .command-shortcut {
    color: var(--text-on-accent);
  }

  .command-info {
    flex: 1;
  }

  .command-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-normal);
    margin-bottom: 2px;
  }

  .command-description {
    font-size: 12px;
    color: var(--text-muted);
  }

  .command-shortcut {
    padding: 4px 8px;
    background-color: var(--background-modifier-border);
    border-radius: 4px;
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--text-faint);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    gap: 12px;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    font-size: 14px;
    margin: 0;
  }

  .command-footer {
    display: flex;
    gap: 16px;
    padding: 12px 20px;
    border-top: 1px solid var(--border-color);
    background-color: var(--background-secondary);
  }

  .hint {
    font-size: 11px;
    color: var(--text-muted);
  }

  .hint kbd {
    padding: 2px 6px;
    background-color: var(--background-modifier-border);
    border-radius: 3px;
    font-family: var(--font-monospace);
    font-size: 10px;
  }
</style>
