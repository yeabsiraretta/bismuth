<script lang="ts">
  import type { RecurrenceRule } from '../../types';

  export let value: RecurrenceRule | undefined = undefined;
  export let onChange: ((val: RecurrenceRule | undefined) => void) | undefined = undefined;

  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  let repeats = value !== undefined;
  let frequency: RecurrenceRule['frequency'] = value?.frequency ?? 'weekly';
  let interval = value?.interval ?? 1;
  let daysOfWeek: number[] = value?.daysOfWeek ?? [];
  let endDate: string = value?.endDate ?? '';

  function emit() {
    if (!repeats) {
      onChange?.(undefined);
      return;
    }
    const rule: RecurrenceRule = { frequency, interval };
    if (frequency === 'weekly' && daysOfWeek.length > 0) {
      rule.daysOfWeek = [...daysOfWeek];
    }
    if (endDate) rule.endDate = endDate;
    onChange?.(rule);
  }

  function toggleRepeats() {
    repeats = !repeats;
    emit();
  }

  function handleFrequencyChange(e: Event) {
    frequency = (e.currentTarget as HTMLSelectElement).value as RecurrenceRule['frequency'];
    if (frequency !== 'weekly') daysOfWeek = [];
    emit();
  }

  function handleIntervalChange(e: Event) {
    const raw = parseInt((e.currentTarget as HTMLInputElement).value, 10);
    interval = isNaN(raw) || raw < 1 ? 1 : raw;
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

  function handleEndDateChange(e: Event) {
    endDate = (e.currentTarget as HTMLInputElement).value;
    emit();
  }

  $: frequencyLabel = (() => {
    if (interval === 1) {
      return { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[frequency];
    }
    return { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' }[frequency];
  })();
</script>

<div class="recurrence-editor">
  <div class="toggle-row">
    <label class="toggle-label">
      <input
        type="checkbox"
        checked={repeats}
        on:change={toggleRepeats}
        aria-label="Enable recurrence"
      />
      <span class="toggle-text">{repeats ? 'Repeats' : 'Does not repeat'}</span>
    </label>
  </div>

  {#if repeats}
    <div class="recurrence-fields">
      <div class="field-row">
        <label class="field-label" for="recur-freq">Every</label>
        <input
          id="recur-interval"
          type="number"
          class="interval-input"
          min="1"
          max="99"
          value={interval}
          aria-label="Repeat interval"
          on:input={handleIntervalChange}
        />
        <select
          id="recur-freq"
          class="freq-select"
          value={frequency}
          aria-label="Repeat frequency"
          on:change={handleFrequencyChange}
        >
          <option value="daily">{interval === 1 ? 'day' : 'days'}</option>
          <option value="weekly">{interval === 1 ? 'week' : 'weeks'}</option>
          <option value="monthly">{interval === 1 ? 'month' : 'months'}</option>
          <option value="yearly">{interval === 1 ? 'year' : 'years'}</option>
        </select>
      </div>

      {#if frequency === 'weekly'}
        <div class="field-row weekday-row">
          <span class="field-label">On</span>
          <div class="weekday-buttons" role="group" aria-label="Days of week">
            {#each DAY_LABELS as label, idx}
              <button
                type="button"
                class="day-btn"
                class:active={daysOfWeek.includes(idx)}
                aria-label={label}
                aria-pressed={daysOfWeek.includes(idx)}
                on:click={() => toggleDay(idx)}
              >
                {label}
              </button>
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
          on:change={handleEndDateChange}
        />
        {#if endDate}
          <button
            type="button"
            class="clear-end"
            aria-label="Clear end date"
            on:click={() => { endDate = ''; emit(); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        {/if}
      </div>

      <p class="summary" aria-live="polite">
        Repeats every {interval} {frequencyLabel}{frequency === 'weekly' && daysOfWeek.length > 0
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

  .toggle-row {
    display: flex;
    align-items: center;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    font-size: 0.8rem;
    color: var(--text-normal);
  }

  .toggle-text {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .recurrence-fields {
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

  .weekday-row {
    align-items: center;
  }

  .field-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    min-width: 32px;
  }

  .interval-input {
    width: 52px;
    padding: 5px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
    text-align: center;
  }

  .interval-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .freq-select {
    padding: 5px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
  }

  .weekday-buttons {
    display: flex;
    gap: 4px;
  }

  .day-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    background: var(--background-primary);
    color: var(--text-muted);
    font-size: 0.68rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }

  .day-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .date-input {
    padding: 5px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .clear-end {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
  }

  .clear-end:hover {
    color: var(--color-error, #dc2626);
  }

  .summary {
    font-size: 0.72rem;
    color: var(--text-faint);
    margin: 0;
    font-style: italic;
  }
</style>
