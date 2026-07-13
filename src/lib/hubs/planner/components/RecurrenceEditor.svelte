<script lang="ts">
  import { untrack } from 'svelte';
  import type { RecurrenceRule } from '@/hubs/planner/types/calendar-types';

  interface Props {
    value?: RecurrenceRule;
    onChange: (val: RecurrenceRule | undefined) => void;
  }

  let { value, onChange }: Props = $props();

  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  let repeats = $state(untrack(() => value !== undefined));
  let frequency: RecurrenceRule['frequency'] = $state(untrack(() => value?.frequency ?? 'weekly'));
  let interval = $state(untrack(() => value?.interval ?? 1));
  let daysOfWeek: number[] = $state(untrack(() => value?.daysOfWeek ?? []));
  let endDate: string = $state(untrack(() => value?.endDate ?? ''));

  function emit() {
    if (!repeats) {
      onChange(undefined);
      return;
    }
    const rule: RecurrenceRule = { frequency, interval };
    if (frequency === 'weekly' && daysOfWeek.length > 0) rule.daysOfWeek = [...daysOfWeek];
    if (endDate) rule.endDate = endDate;
    onChange(rule);
  }

  function toggleRepeats() {
    repeats = !repeats;
    emit();
  }

  function toggleDay(day: number) {
    if (daysOfWeek.includes(day)) {
      daysOfWeek = daysOfWeek.filter((d) => d !== day);
    } else {
      daysOfWeek = [...daysOfWeek, day].sort((a, b) => a - b);
    }
    emit();
  }

  let frequencyLabel = $derived(
    (() => {
      if (interval === 1)
        return { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[frequency];
      return { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' }[frequency];
    })()
  );
</script>

<div class="recurrence-editor">
  <label class="toggle-label">
    <input
      type="checkbox"
      checked={repeats}
      onchange={toggleRepeats}
      aria-label="Enable recurrence"
    />
    <span class="toggle-text">{repeats ? 'Repeats' : 'Does not repeat'}</span>
  </label>

  {#if repeats}
    <div class="fields">
      <div class="field-row">
        <span class="field-label">Every</span>
        <input
          type="number"
          class="interval-input"
          min="1"
          max="99"
          value={interval}
          aria-label="Repeat interval"
          oninput={(e) => {
            interval = Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1);
            emit();
          }}
        />
        <select
          class="freq-select"
          value={frequency}
          aria-label="Repeat frequency"
          onchange={(e) => {
            frequency = (e.target as HTMLSelectElement).value as RecurrenceRule['frequency'];
            if (frequency !== 'weekly') daysOfWeek = [];
            emit();
          }}
        >
          <option value="daily">{interval === 1 ? 'day' : 'days'}</option>
          <option value="weekly">{interval === 1 ? 'week' : 'weeks'}</option>
          <option value="monthly">{interval === 1 ? 'month' : 'months'}</option>
          <option value="yearly">{interval === 1 ? 'year' : 'years'}</option>
        </select>
      </div>

      {#if frequency === 'weekly'}
        <div class="field-row">
          <span class="field-label">On</span>
          <div class="weekday-buttons" role="group" aria-label="Days of week">
            {#each DAY_LABELS as label, idx (label)}
              <button
                type="button"
                class="day-btn"
                class:active={daysOfWeek.includes(idx)}
                aria-label={label}
                aria-pressed={daysOfWeek.includes(idx)}
                onclick={() => toggleDay(idx)}>{label}</button
              >
            {/each}
          </div>
        </div>
      {/if}

      <div class="field-row">
        <label class="field-label" for="recur-end">Ends</label>
        <input
          id="recur-end"
          type="date"
          class="date-input"
          value={endDate}
          aria-label="Recurrence end date (optional)"
          onchange={(e) => {
            endDate = (e.target as HTMLInputElement).value;
            emit();
          }}
        />
        {#if endDate}
          <button
            type="button"
            class="clear-btn"
            aria-label="Clear end date"
            onclick={() => {
              endDate = '';
              emit();
            }}>×</button
          >
        {/if}
      </div>

      <p class="summary" aria-live="polite">
        Repeats every {interval}
        {frequencyLabel}{frequency === 'weekly' && daysOfWeek.length > 0
          ? ' on ' + daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')
          : ''}{endDate ? ', until ' + endDate : ''}
      </p>
    </div>
  {/if}
</div>

<style>
  .recurrence-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    font-size: 0.8rem;
    color: var(--color-text);
  }
  .toggle-text {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 4px;
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    min-width: 32px;
  }
  .interval-input {
    width: 52px;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.8rem;
    text-align: center;
  }
  .interval-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  .freq-select {
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.8rem;
  }
  .weekday-buttons {
    display: flex;
    gap: 4px;
  }
  .day-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-background);
    color: var(--color-text-muted);
    font-size: 0.68rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--transition-base),
      color var(--transition-base);
  }
  .day-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .date-input {
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.8rem;
  }
  .date-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 1rem;
    padding: 2px 4px;
    line-height: 1;
  }
  .clear-btn:hover {
    color: var(--color-error);
  }
  .summary {
    font-size: 0.72rem;
    color: var(--color-text-subtle);
    margin: 0;
    font-style: italic;
  }
</style>
