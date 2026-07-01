<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { navigatorStore, removeShortcut } from '@/features/navigator';

  export let onActivate:
    | ((shortcut: { type: string; path: string; label: string }) => void)
    | undefined = undefined;

  $: shortcuts = $navigatorStore.shortcuts;

  function handleActivate(index: number) {
    const shortcut = shortcuts[index];
    if (shortcut) {
      onActivate?.(shortcut);
    }
  }

  function handleRemove(index: number, event: MouseEvent) {
    event.stopPropagation();
    removeShortcut(index);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey)) return;

    const num = parseInt(event.key);
    if (num >= 1 && num <= 9) {
      event.preventDefault();
      handleActivate(num - 1);
    }
  }

  function getIcon(type: string): string {
    switch (type) {
      case 'note':
        return 'file-text';
      case 'folder':
        return 'folder';
      case 'tag':
        return 'tag';
      case 'search':
        return 'search';
      default:
        return 'bookmark';
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="shortcut-bar" role="toolbar" aria-label="Shortcuts">
  {#each { length: 9 } as _, i}
    {#if shortcuts[i]}
      <button
        class="shortcut-slot occupied"
        on:click={() => handleActivate(i)}
        title="{shortcuts[i].label} (Cmd+{i + 1})"
        aria-label={shortcuts[i].label}
      >
        <Icon name={getIcon(shortcuts[i].type)} size={14} />
        <span class="shortcut-label">{shortcuts[i].label}</span>
        <span class="shortcut-key">{i + 1}</span>
        <span
          class="remove-btn"
          role="button"
          tabindex="0"
          on:click={(e) => handleRemove(i, e)}
          on:keydown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              removeShortcut(i);
            }
          }}
          title="Remove shortcut"
          aria-label="Remove shortcut"
        >
          <Icon name="x" size={10} />
        </span>
      </button>
    {:else}
      <div class="shortcut-slot empty" title="Empty slot (Cmd+{i + 1})">
        <span class="shortcut-key">{i + 1}</span>
      </div>
    {/if}
  {/each}
</div>

<style>
  .shortcut-bar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
    padding: var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .shortcut-slot {
    display: flex;
    align-items: center;
    gap: var(--sidebar-item-gap);
    padding: var(--sidebar-item-padding-y) var(--sidebar-item-padding-x);
    border-radius: var(--radius-s);
    font-size: var(--font-size-xs);
    position: relative;
    border: none;
    background: none;
    text-align: left;
    color: var(--text-normal);
    width: 100%;
  }

  .shortcut-slot.occupied {
    cursor: pointer;
  }

  .shortcut-slot.occupied:hover {
    background: var(--background-modifier-hover);
  }

  .shortcut-slot.empty {
    opacity: 0.3;
  }

  .shortcut-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .shortcut-key {
    font-size: var(--font-size-2xs);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-xs);
    background: var(--background-secondary);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .remove-btn {
    display: none;
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--background-secondary);
    border: none;
    border-radius: 3px;
    padding: 2px;
    cursor: pointer;
    color: var(--text-muted);
  }

  .shortcut-slot.occupied:hover .remove-btn {
    display: block;
  }

  .remove-btn:hover {
    background: var(--color-error);
    color: var(--text-on-accent);
  }
</style>
