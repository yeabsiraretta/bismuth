<script lang="ts">
  import type { CalendarItemType, CalendarCategory } from '../../types';

  export let title: string = '';
  export let itemType: CalendarItemType = 'event';
  export let allDay: boolean = true;
  export let startHour: number = 9;
  export let startMin: number = 0;
  export let durationHours: number = 1;
  export let durationMins: number = 0;
  export let eventDate: string = '';
  export let categoryId: string = '';
  export let categories: CalendarCategory[] = [];
  export let onChange: ((fields: Record<string, unknown>) => void) | undefined = undefined;

  $: selectedCategoryColor = categoryId
    ? (categories.find((c) => c.id === categoryId)?.color ?? null)
    : null;
</script>

<input
  class="input-title"
  type="text"
  placeholder="Event title"
  value={title}
  aria-required="true"
  on:input={(e) => onChange?.({ title: (e.target as HTMLInputElement).value })}
  autofocus
/>

<div class="form-row">
  <label class="form-label" for="event-type">Type</label>
  <div class="type-selector" id="event-type" role="group" aria-label="Event type">
    {#each [['event', 'Event'], ['task', 'Task'], ['time-block', 'Time Block']] as [val, label]}
      <button
        type="button"
        class="type-btn"
        class:active={itemType === val}
        on:click={() => onChange?.({ itemType: val as CalendarItemType })}>{label}</button
      >
    {/each}
  </div>
</div>

<div class="form-row">
  <label class="form-label" for="event-category">Category</label>
  <div class="category-row">
    {#if selectedCategoryColor}
      <span class="category-swatch" style="background: {selectedCategoryColor}" aria-hidden="true"
      ></span>
    {/if}
    <select
      id="event-category"
      class="input-field category-select"
      value={categoryId}
      on:change={(e) => onChange?.({ categoryId: (e.target as HTMLSelectElement).value })}
    >
      <option value="">None</option>
      {#each categories as cat}
        <option value={cat.id}>{cat.name}</option>
      {/each}
    </select>
  </div>
</div>

<div class="form-row">
  <label class="form-label" for="event-date">Date</label>
  <input
    id="event-date"
    type="date"
    class="input-field"
    value={eventDate}
    on:change={(e) => onChange?.({ eventDate: (e.target as HTMLInputElement).value })}
  />
</div>

<div class="form-row">
  <label class="form-label">
    <input
      type="checkbox"
      checked={allDay}
      on:change={(e) => onChange?.({ allDay: (e.target as HTMLInputElement).checked })}
    /> All day
  </label>
</div>

{#if !allDay}
  <div class="form-row time-row">
    <label class="form-label" for="event-start-hour">Start</label>
    <select
      id="event-start-hour"
      class="input-field time-select"
      value={startHour}
      on:change={(e) => onChange?.({ startHour: Number((e.target as HTMLSelectElement).value) })}
    >
      {#each Array.from({ length: 24 }, (_, i) => i) as h}
        <option value={h}>{h === 0 ? '12' : h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</option>
      {/each}
    </select>
    <select
      class="input-field time-select"
      value={startMin}
      on:change={(e) => onChange?.({ startMin: Number((e.target as HTMLSelectElement).value) })}
    >
      {#each [0, 15, 30, 45] as m}
        <option value={m}>:{String(m).padStart(2, '0')}</option>
      {/each}
    </select>
  </div>
  <div class="form-row time-row">
    <label class="form-label" for="event-duration-hours">Duration</label>
    <select
      id="event-duration-hours"
      class="input-field time-select"
      value={durationHours}
      on:change={(e) =>
        onChange?.({ durationHours: Number((e.target as HTMLSelectElement).value) })}
    >
      {#each Array.from({ length: 13 }, (_, i) => i) as h}
        <option value={h}>{h}h</option>
      {/each}
    </select>
    <select
      class="input-field time-select"
      value={durationMins}
      on:change={(e) => onChange?.({ durationMins: Number((e.target as HTMLSelectElement).value) })}
    >
      {#each [0, 15, 30, 45] as m}
        <option value={m}>{m}m</option>
      {/each}
    </select>
  </div>
{/if}

<style>
  .input-title {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.9rem;
    outline: none;
    min-height: 44px;
    box-sizing: border-box;
  }
  .input-title:focus {
    border-color: var(--interactive-accent);
  }
  .form-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .form-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    min-width: 60px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .type-selector {
    display: flex;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .type-btn {
    padding: 5px 12px;
    font-size: 0.72rem;
    border: none;
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    min-height: 40px;
  }
  .type-btn:not(:last-child) {
    border-right: 1px solid var(--border-color);
  }
  .type-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .category-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }
  .category-swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  .category-select {
    flex: 1;
  }
  .input-field {
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
    min-height: 36px;
  }
  .time-row {
    gap: 8px;
  }
  .time-select {
    width: auto;
  }
</style>
