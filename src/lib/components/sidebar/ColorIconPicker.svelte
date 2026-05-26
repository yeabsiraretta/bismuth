<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    setFolderColor,
    setFolderIcon,
    setFileColor,
    setFileIcon,
  } from '@/stores/navigator/navigator';
  import { COLOR_PRESETS, ICON_PRESETS } from '@/config/presets';

  export let type: 'folder' | 'file' = 'folder';
  export let path: string;
  export let currentColor: string = '';
  export let currentIcon: string = '';
  export let onClose: () => void;

  // Use centralized color presets
  const colors = [{ name: 'Default', value: '' }, ...COLOR_PRESETS.accentColors];

  // Use centralized icon presets
  const folderIcons = ICON_PRESETS.folderIcons;
  const fileIcons = ICON_PRESETS.noteIcons;

  let selectedColor = currentColor;
  let selectedIcon = currentIcon;

  function handleColorSelect(color: string) {
    selectedColor = color;
    if (type === 'folder') {
      setFolderColor(path, color);
    } else {
      setFileColor(path, color);
    }
  }

  function handleIconSelect(icon: string) {
    selectedIcon = icon;
    if (type === 'folder') {
      setFolderIcon(path, icon);
    } else {
      setFileIcon(path, icon);
    }
  }

  function handleApply() {
    onClose();
  }
</script>

<div class="picker-overlay" on:click={onClose} role="presentation">
  <div class="picker-dialog" on:click|stopPropagation role="dialog">
    <div class="picker-header">
      <h3>Customize {type === 'folder' ? 'Folder' : 'File'}</h3>
      <button class="close-btn" on:click={onClose} aria-label="Close">
        <Icon name="x" size={16} />
      </button>
    </div>

    <div class="picker-content">
      <div class="section">
        <h4>Color</h4>
        <div class="color-grid">
          {#each colors as color}
            <button
              class="color-swatch"
              class:selected={selectedColor === color.value}
              style="background-color: {color.value || 'var(--background-secondary)'}"
              on:click={() => handleColorSelect(color.value)}
              title={color.name}
              aria-label={color.name}
            >
              {#if selectedColor === color.value}
                <Icon name="check" size={14} />
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="section">
        <h4>Icon</h4>
        <div class="icon-grid">
          {#each type === 'folder' ? folderIcons : fileIcons as icon}
            <button
              class="icon-btn"
              class:selected={selectedIcon === icon}
              on:click={() => handleIconSelect(icon)}
              aria-label={icon}
            >
              <Icon name={icon} size={20} />
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="picker-footer">
      <button class="btn-secondary" on:click={onClose}> Cancel </button>
      <button class="btn-primary" on:click={handleApply}> Apply </button>
    </div>
  </div>
</div>

<style>
  .picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .picker-dialog {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    width: 90%;
    max-width: 400px;
    box-shadow: var(--shadow-xl);
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-m);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .picker-header h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-4-8);
    height: var(--size-4-8);
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-xs);
    cursor: pointer;
    color: var(--text-muted);
  }

  .close-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .picker-content {
    padding: var(--spacing-m);
    max-height: 60vh;
    overflow-y: auto;
  }

  .section {
    margin-bottom: var(--spacing-l);
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section h4 {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-s) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-s);
  }

  .color-swatch {
    aspect-ratio: 1;
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    color: white;
  }

  .color-swatch:hover {
    transform: scale(1.05);
    border-color: var(--interactive-accent);
  }

  .color-swatch.selected {
    border-color: var(--interactive-accent);
    border-width: 3px;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-s);
  }

  .icon-btn {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-secondary);
    border: 2px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--text-primary);
    transition: all var(--transition-fast);
  }

  .icon-btn:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .icon-btn.selected {
    background-color: var(--interactive-accent);
    border-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .picker-footer {
    display: flex;
    gap: var(--spacing-s);
    justify-content: flex-end;
    padding: var(--spacing-m);
    border-top: 1px solid var(--background-modifier-border);
  }

  .btn-secondary,
  .btn-primary {
    padding: var(--spacing-s) var(--spacing-m);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background-color: var(--background-modifier-hover);
  }

  .btn-primary {
    background-color: var(--interactive-accent);
    border: none;
    color: var(--text-on-accent);
  }

  .btn-primary:hover {
    opacity: 0.9;
  }
</style>
