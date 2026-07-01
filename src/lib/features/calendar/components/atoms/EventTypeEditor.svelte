<script lang="ts">
  import { settings } from '@/features/settings';
  import { generateId } from '@/utils/id';
  import type { CalendarCategory } from '../../types';

  const SWATCH_COLORS = [
    '#dc2626',
    '#ea580c',
    '#d97706',
    '#ca8a04',
    '#16a34a',
    '#059669',
    '#0891b2',
    '#2563eb',
    '#7c3aed',
    '#9333ea',
    '#db2777',
    '#6b7280',
  ];

  function addCategory() {
    settings.update((s) => ({
      ...s,
      calendarCategories: [
        ...s.calendarCategories,
        { id: generateId(), name: 'New', color: '#dc2626' },
      ],
    }));
  }

  function deleteCategory(id: string) {
    settings.update((s) => ({
      ...s,
      calendarCategories: s.calendarCategories.filter((c) => c.id !== id),
    }));
  }

  function updateName(id: string, name: string) {
    settings.update((s) => ({
      ...s,
      calendarCategories: s.calendarCategories.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  }

  function updateColor(id: string, color: string) {
    settings.update((s) => ({
      ...s,
      calendarCategories: s.calendarCategories.map((c) => (c.id === id ? { ...c, color } : c)),
    }));
  }

  function handleNameInput(e: Event, id: string) {
    const input = e.currentTarget as HTMLInputElement;
    updateName(id, input.value);
  }

  $: categories = $settings.calendarCategories as CalendarCategory[];
</script>

<div class="event-type-editor" role="list" aria-label="Calendar categories">
  {#each categories as cat (cat.id)}
    <div class="category-row" role="listitem">
      <div class="swatch-picker" role="group" aria-label="Pick color for {cat.name}">
        {#each SWATCH_COLORS as swColor}
          <button
            type="button"
            class="swatch"
            class:selected={cat.color === swColor}
            style="background: {swColor}"
            aria-label="Color {swColor}"
            aria-pressed={cat.color === swColor}
            on:click={() => updateColor(cat.id, swColor)}
          ></button>
        {/each}
      </div>

      <div class="color-preview" style="background: {cat.color}" aria-hidden="true"></div>

      <input
        type="text"
        class="name-input"
        value={cat.name}
        aria-label="Category name"
        maxlength="32"
        on:input={(e) => handleNameInput(e, cat.id)}
      />

      <button
        type="button"
        class="delete-btn"
        aria-label="Delete category {cat.name}"
        on:click={() => deleteCategory(cat.id)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      </button>
    </div>
  {/each}

  <button type="button" class="add-btn" on:click={addCategory}>
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    Add category
  </button>
</div>

<style>
  .event-type-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .category-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
  }

  .swatch-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 120px;
  }

  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s;
  }

  .swatch:hover {
    transform: scale(1.2);
  }

  .swatch.selected {
    border-color: var(--text-normal);
    transform: scale(1.15);
  }

  .color-preview {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .name-input {
    flex: 1;
    min-width: 80px;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
    min-height: 40px;
    box-sizing: border-box;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    min-height: 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .delete-btn:hover {
    color: var(--color-error, #dc2626);
    background: var(--background-modifier-hover);
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    min-height: 40px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    transition:
      color 0.15s,
      border-color 0.15s;
    align-self: flex-start;
  }

  .add-btn:hover {
    color: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }
</style>
