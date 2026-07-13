<script lang="ts">
  import type { CalendarSettings } from '@/hubs/core/types/settings';
  import SettingRow from '@/ui/settings-controls.svelte';
  import { PALETTE } from '@/constants/colors';

  let {
    calendar = $bindable(),
  }: {
    calendar: CalendarSettings;
  } = $props();

  let newCatName = $state('');
  let newCatColor = $state(PALETTE.indigo);

  function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (calendar.calendarCategories.some((c) => c.id === id)) return;
    calendar.calendarCategories = [
      ...calendar.calendarCategories,
      { id, name, color: newCatColor },
    ];
    newCatName = '';
  }

  function removeCategory(id: string) {
    calendar.calendarCategories = calendar.calendarCategories.filter((c) => c.id !== id);
  }
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">View</h3>

    <SettingRow label="Default View" hint="Calendar view shown on launch" id="cal-default-view">
      <select id="cal-default-view" bind:value={calendar.defaultView}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
        <option value="list">List</option>
      </select>
    </SettingRow>

    <SettingRow label="Week starts on" hint="First day of the week" id="cal-week-start">
      <select id="cal-week-start" bind:value={calendar.weekStartsOn}>
        <option value={0}>Sunday</option>
        <option value={1}>Monday</option>
      </select>
    </SettingRow>

    <SettingRow
      label="Default event duration"
      hint="Duration in minutes for new events"
      id="cal-duration"
    >
      <div class="flex">
        <input
          id="cal-duration"
          type="range"
          bind:value={calendar.defaultEventDuration}
          min="15"
          max="240"
          step="15"
        />
        <span>{calendar.defaultEventDuration}m</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Show completed events"
      hint="Display completed events in calendar views"
      id="cal-show-completed"
    >
      <input id="cal-show-completed" type="checkbox" bind:checked={calendar.showCompletedEvents} />
    </SettingRow>

    <SettingRow label="Time slot height" hint="Pixel height of each hour slot" id="cal-slot-height">
      <div class="flex">
        <input
          id="cal-slot-height"
          type="range"
          bind:value={calendar.timeSlotHeight}
          min="24"
          max="96"
          step="4"
        />
        <span>{calendar.timeSlotHeight}px</span>
      </div>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Notes</h3>

    <SettingRow
      label="Show note blurbs"
      hint="Display description previews on event chips in day view"
      id="cal-blurbs"
    >
      <input id="cal-blurbs" type="checkbox" bind:checked={calendar.showNoteBlurbs} />
    </SettingRow>

    <SettingRow
      label="Event note folder"
      hint="Default folder for notes created from events (blank = default location)"
      id="cal-note-folder"
    >
      <input
        id="cal-note-folder"
        type="text"
        class="input-field"
        style="width:160px"
        placeholder="e.g. Calendar Notes"
        bind:value={calendar.eventNoteFolder}
      />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Categories</h3>

    <div class="cat-list">
      {#each calendar.calendarCategories as cat (cat.id)}
        <div class="cat-row">
          <span class="cat-swatch" style="background: {cat.color}"></span>
          <span class="cat-name">{cat.name}</span>
          <button
            class="cat-remove"
            onclick={() => removeCategory(cat.id)}
            aria-label="Remove {cat.name}">×</button
          >
        </div>
      {/each}
    </div>

    <div class="cat-add">
      <input
        type="text"
        class="cat-input"
        placeholder="Category name"
        bind:value={newCatName}
        onkeydown={(e) => e.key === 'Enter' && addCategory()}
      />
      <input type="color" class="cat-color-pick" bind:value={newCatColor} />
      <button class="cat-add-btn" onclick={addCategory} disabled={!newCatName.trim()}>Add</button>
    </div>
  </section>
</div>

<style>
  .cat-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .cat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: var(--radius-s);
  }
  .cat-row:hover {
    background: var(--color-surface-hover);
  }
  .cat-swatch {
    width: 14px;
    height: 14px;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }
  .cat-name {
    flex: 1;
    font-size: 0.8rem;
    color: var(--color-text);
  }
  .cat-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--color-text-subtle);
    opacity: 0;
    padding: 0 2px;
  }
  .cat-row:hover .cat-remove {
    opacity: 1;
  }
  .cat-remove:hover {
    color: var(--color-error);
  }
  .cat-add {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .cat-input {
    flex: 1;
    padding: 4px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .cat-input:focus {
    border-color: var(--color-accent);
    outline: none;
  }
  .cat-color-pick {
    width: 28px;
    height: 28px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    padding: 0;
    cursor: pointer;
    background: none;
  }
  .cat-add-btn {
    padding: 4px 12px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
  }
  .cat-add-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-accent);
  }
  .cat-add-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
