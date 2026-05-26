<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { navigatorStore, removeShortcut } from '@/stores/navigator/navigator';
  import { selectFolder, selectNote } from '@/stores/navigator/navigator';
  import { invoke } from '@tauri-apps/api/core';
  import type { Note } from '@/types/vault';

  $: shortcuts = $navigatorStore.shortcuts;

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  function handleGlobalKeydown(event: KeyboardEvent) {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;

    if (isCmdOrCtrl && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      if (shortcuts[index]) {
        activateShortcut(index);
      }
    }
  }

  async function activateShortcut(index: number) {
    const shortcut = shortcuts[index];
    if (!shortcut) return;

    switch (shortcut.type) {
      case 'folder':
        selectFolder(shortcut.path);
        break;
      case 'note':
        try {
          const note = await invoke<Note>('read_note', { path: shortcut.path });
          selectNote(note);
        } catch (error) {
          console.error('Failed to open note:', error);
        }
        break;
      case 'tag':
        break;
      case 'search':
        break;
    }
  }

  function getShortcutIcon(type: string): string {
    switch (type) {
      case 'folder':
        return 'folder';
      case 'note':
        return 'file-text';
      case 'tag':
        return 'tag';
      case 'search':
        return 'search';
      default:
        return 'bookmark';
    }
  }

  function handleRemove(index: number, event: MouseEvent) {
    event.stopPropagation();
    removeShortcut(index);
  }
</script>

<div class="shortcut-bar">
  {#each Array(9) as _, index}
    {@const shortcut = shortcuts[index]}

    <button
      class="shortcut-slot"
      class:filled={!!shortcut}
      on:click={() => shortcut && activateShortcut(index)}
      aria-label={shortcut ? `${shortcut.label} (${index + 1})` : `Empty slot ${index + 1}`}
      title={shortcut
        ? `${shortcut.label}\nCmd/Ctrl+${index + 1}`
        : `Empty slot\nCmd/Ctrl+${index + 1}`}
    >
      {#if shortcut}
        <Icon name={getShortcutIcon(shortcut.type)} size={14} />
        <span class="shortcut-label">{shortcut.label}</span>
        <button
          class="remove-btn"
          on:click={(e) => handleRemove(index, e)}
          aria-label="Remove shortcut"
        >
          <Icon name="x" size={12} />
        </button>
      {:else}
        <span class="slot-number">{index + 1}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .shortcut-bar {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    overflow-x: auto;
  }

  .shortcut-slot {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: var(--font-size-xs);
    color: var(--text-primary);
  }

  .shortcut-slot:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .shortcut-slot.filled {
    padding-right: 1.75rem;
  }

  .slot-number {
    color: var(--text-muted);
    font-weight: var(--font-medium);
  }

  .shortcut-label {
    max-width: 8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-btn {
    position: absolute;
    right: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .shortcut-slot:hover .remove-btn {
    opacity: 1;
  }

  .remove-btn:hover {
    background-color: var(--background-modifier-error);
    color: var(--text-error);
  }

  @media (max-width: 768px) {
    .shortcut-bar {
      overflow-x: scroll;
      scrollbar-width: thin;
    }
  }
</style>
