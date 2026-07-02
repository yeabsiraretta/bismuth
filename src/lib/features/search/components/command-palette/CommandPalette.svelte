<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/accessibility/focusTrap';
  import { commands as commandsStore, executeCommand as execCmd } from '@/stores/commands/commands';
  import { notes } from '@/stores/vault/vault';
  import { getNote } from '@/services/vault/vault';
  import { filterNotes, filterCommands, navigateIndex, scrollToIndex } from './commandPaletteLogic';
  import type { Note } from '@/types/data/vault';
  import { log } from '@/utils/logger';

  export let isOpen = false;
  export let onClose: () => void;
  export let onOpenNote: ((path: string) => void) | undefined = undefined;
  export let initialMode: 'notes' | 'commands' = 'notes';

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
  $: filteredNotes = mode === 'notes' ? filterNotes($notes, effectiveQuery) : [];
  $: filteredCommands = mode === 'commands' ? filterCommands($commandsStore, effectiveQuery) : [];
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
        selectedIndex = navigateIndex('down', selectedIndex, totalItems);
        scrollToIndex(selectedIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = navigateIndex('up', selectedIndex, totalItems);
        scrollToIndex(selectedIndex);
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
        const fullNote = await getNote(note.path);
        const { setActiveNote } = await import('@/stores/vault/vault');
        setActiveNote(fullNote);
      } catch (e) {
        log.error('Failed to open note', e);
      }
    }
  }

  let paletteEl: HTMLElement;
  let trap: FocusTrapInstance | null = null;

  onMount(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => trap?.deactivate());

  $: if (isOpen) {
    searchQuery = initialMode === 'commands' ? '>' : '';
    selectedIndex = 0;
    setTimeout(() => {
      const input = document.querySelector('.command-input') as HTMLInputElement;
      input?.focus();
      if (paletteEl && !trap) {
        trap = createFocusTrap(paletteEl, { onEscape: onClose, returnFocus: true });
        trap.activate();
      }
    }, 50);
  }

  $: if (!isOpen && trap) {
    trap.deactivate();
    trap = null;
  }
  $: if (effectiveQuery !== undefined) {
    selectedIndex = 0;
  }
</script>

{#if isOpen}
  <div class="command-overlay" on:click={onClose} role="presentation">
    <div
      class="command-palette"
      bind:this={paletteEl}
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
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
    padding-top: calc(15vh / var(--ui-scale, 1));
    z-index: 1000;
  }
  .command-palette {
    width: 90%;
    max-width: 600px;
    max-height: calc(60vh / var(--ui-scale, 1));
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
