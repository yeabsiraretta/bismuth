<script lang="ts">
  /**
   * FilterPicker — visual grid of filter preset thumbnails.
   * Clicking a preset dispatches a 'select' CustomEvent with the chosen FilterPreset.
   */
  import { FILTER_PRESETS } from '../types/media';
  import type { FilterPreset } from '../types/media';

  export let imageUrl: string = '';
  export let activeFilterId: string = 'none';
  export let onSelect: ((preset: FilterPreset) => void) | undefined = undefined;

  function handleSelect(preset: FilterPreset): void {
    onSelect?.(preset);
  }
</script>

<div class="filter-picker" role="group" aria-label="Filter presets">
  {#each FILTER_PRESETS as preset (preset.id)}
    <button
      class="filter-tile"
      class:active={activeFilterId === preset.id}
      on:click={() => handleSelect(preset)}
      title={preset.name}
      aria-label={preset.name}
      aria-pressed={activeFilterId === preset.id}
    >
      <div class="filter-thumb-wrap">
        {#if imageUrl}
          <img
            src={imageUrl}
            alt={preset.name}
            class="filter-thumb"
            style="filter: {preset.cssFilter || 'none'}"
            draggable="false"
          />
        {:else}
          <div
            class="filter-thumb filter-thumb--placeholder"
            style="filter: {preset.cssFilter || 'none'}"
          ></div>
        {/if}
      </div>
      <span class="filter-label">{preset.name}</span>
    </button>
  {/each}
</div>

<style>
  .filter-picker {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-s, 8px);
  }

  .filter-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    background: none;
    border: 2px solid transparent;
    border-radius: var(--radius-m, 6px);
    padding: var(--spacing-xs, 4px);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .filter-tile:hover {
    background-color: var(--interactive-hover, rgba(0, 0, 0, 0.05));
    border-color: var(--border-color, #d1d5db);
  }

  .filter-tile.active {
    border-color: var(--interactive-accent, #3b82f6);
    background-color: var(--background-modifier-active-hover, rgba(59, 130, 246, 0.08));
  }

  .filter-thumb-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-modifier-form-field, #f3f4f6);
  }

  .filter-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .filter-thumb--placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #6366f1 100%);
  }

  .filter-label {
    font-size: var(--font-ui-smaller, 10px);
    color: var(--text-muted, #6b7280);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .filter-tile.active .filter-label {
    color: var(--interactive-accent, #3b82f6);
    font-weight: 600;
  }
</style>
