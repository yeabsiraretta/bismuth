<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { navigatorStore, removeShortcut, selectFolder } from '../stores/navigator';
  import { selectTag } from '../stores/navigatorActions';
  import { openNote } from '@/appNavigation';

  $: shortcuts = $navigatorStore.shortcuts;

  function getIcon(type: string): string {
    switch (type) {
      case 'folder': return 'folder';
      case 'tag': return 'hash';
      case 'search': return 'search';
      default: return 'file-text';
    }
  }

  function handleClick(shortcut: typeof shortcuts[0]) {
    switch (shortcut.type) {
      case 'folder':
        selectFolder(shortcut.path);
        break;
      case 'tag':
        selectTag(shortcut.path);
        break;
      case 'note':
        openNote(shortcut.path);
        break;
    }
  }

  function handleKeydown(e: KeyboardEvent, shortcut: typeof shortcuts[0]) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(shortcut);
    }
  }
</script>

{#if shortcuts.length > 0}
  <div class="shortcuts-section">
    <div class="shortcuts-header">
      <Icon name="bookmark" size={11} />
      <span>Shortcuts</span>
    </div>
    <div class="shortcuts-list">
      {#each shortcuts as shortcut, i (shortcut.path)}
        <div
          class="shortcut-item"
          role="button"
          tabindex="0"
          on:click={() => handleClick(shortcut)}
          on:keydown={(e) => handleKeydown(e, shortcut)}
          title="{shortcut.label} ({shortcut.path})"
        >
          <Icon name={getIcon(shortcut.type)} size={12} />
          <span class="shortcut-label">{shortcut.label}</span>
          <span class="shortcut-number">{i + 1}</span>
          <button
            class="shortcut-remove"
            on:click|stopPropagation={() => removeShortcut(i)}
            title="Remove shortcut"
            aria-label="Remove shortcut"
          >
            <Icon name="x" size={10} />
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .shortcuts-section {
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .shortcuts-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0 4px 4px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal);
    user-select: none;
  }

  .shortcut-item:hover {
    background: var(--interactive-hover);
  }

  .shortcut-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shortcut-number {
    font-size: 9px;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    border-radius: 2px;
    padding: 0 3px;
    line-height: 14px;
    flex-shrink: 0;
  }

  .shortcut-remove {
    display: none;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 2px;
    padding: 0;
    flex-shrink: 0;
  }

  .shortcut-item:hover .shortcut-remove {
    display: flex;
  }

  .shortcut-remove:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
