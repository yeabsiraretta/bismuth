<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { Note } from '@/types/vault';

  export let note: Note;
  export let x: number;
  export let y: number;
  export let onClose: () => void;
  export let onAction: (action: string) => void;

  interface MenuItem {
    label: string;
    icon: string;
    action: string;
    divider?: boolean;
    danger?: boolean;
  }

  const menuItems: MenuItem[] = [
    { label: 'Open', icon: 'file-text', action: 'open' },
    { label: 'Open in New Pane', icon: 'columns', action: 'open-new-pane' },
    { label: '', icon: '', action: '', divider: true },
    { label: 'Rename', icon: 'edit-3', action: 'rename' },
    { label: 'Duplicate', icon: 'copy', action: 'duplicate' },
    { label: 'Move to...', icon: 'folder', action: 'move' },
    { label: '', icon: '', action: '', divider: true },
    { label: 'Pin', icon: 'pin', action: 'pin' },
    { label: 'Set Color', icon: 'palette', action: 'color' },
    { label: 'Set Icon', icon: 'smile', action: 'icon' },
    { label: '', icon: '', action: '', divider: true },
    { label: 'Merge Notes...', icon: 'git-merge', action: 'merge' },
    { label: 'Convert to Folder Note', icon: 'folder-plus', action: 'convert-folder' },
    { label: '', icon: '', action: '', divider: true },
    { label: 'Delete', icon: 'trash-2', action: 'delete', danger: true },
  ];

  function handleAction(action: string) {
    onAction(action);
    onClose();
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.context-menu')) {
      onClose();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="context-menu" style="left: {x}px; top: {y}px;">
  {#each menuItems as item}
    {#if item.divider}
      <div class="menu-divider"></div>
    {:else}
      <button
        class="menu-item"
        class:danger={item.danger}
        on:click={() => handleAction(item.action)}
      >
        <Icon name={item.icon} size={16} />
        <span>{item.label}</span>
      </button>
    {/if}
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 10000;
    min-width: 200px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-xl);
    padding: 0.5rem;
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    text-align: left;
    transition: background-color 0.15s ease;
  }

  .menu-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .menu-item.danger {
    color: var(--text-error);
  }

  .menu-item.danger:hover {
    background-color: var(--background-modifier-error);
  }

  .menu-divider {
    height: 1px;
    background-color: var(--background-modifier-border);
    margin: 0.25rem 0;
  }
</style>
