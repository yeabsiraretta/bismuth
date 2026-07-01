<script lang="ts">
  import Modal from '@/components/ui/layout/Modal.svelte';
  import { addCalendarEvent, createTimeBlock } from '../../stores/calendarStore';
  import { settings } from '@/features/settings';
  import { generatePrefixedId } from '@/utils/id';
  import RecurrenceEditor from './RecurrenceEditor.svelte';
  import EventFormFields from './EventFormFields.svelte';
  import EventLinkManager from './EventLinkManager.svelte';
  import type { CalendarItemType, RecurrenceRule } from '../../types';

  export let date: string | null = null;
  export let startMinute: number | null = null;
  export let onClose: (() => void) | undefined = undefined;

  let title = '';
  let itemType: CalendarItemType = 'event';
  let allDay = startMinute === null;
  let startHour = startMinute !== null ? Math.floor(startMinute / 60) : 9;
  let startMin = startMinute !== null ? startMinute % 60 : 0;
  let durationHours = 1;
  let durationMins = 0;
  let eventDate = date || new Date().toISOString().slice(0, 10);
  let categoryId = '';
  let recurrenceRule: RecurrenceRule | undefined = undefined;
  let linkedNotePaths: string[] = [];

  $: categories = $settings.calendarCategories;

  function handleFieldChange(d: Record<string, unknown>): void {
    if (d['title'] !== undefined) title = d['title'] as string;
    if (d['itemType'] !== undefined) itemType = d['itemType'] as CalendarItemType;
    if (d['allDay'] !== undefined) allDay = d['allDay'] as boolean;
    if (d['startHour'] !== undefined) startHour = d['startHour'] as number;
    if (d['startMin'] !== undefined) startMin = d['startMin'] as number;
    if (d['durationHours'] !== undefined) durationHours = d['durationHours'] as number;
    if (d['durationMins'] !== undefined) durationMins = d['durationMins'] as number;
    if (d['eventDate'] !== undefined) eventDate = d['eventDate'] as string;
    if (d['categoryId'] !== undefined) categoryId = d['categoryId'] as string;
  }

  function handleRecurrenceChange(val: RecurrenceRule | undefined): void {
    recurrenceRule = val;
  }

  function handleSubmit(): void {
    if (!title.trim()) return;
    const startMinutes = allDay ? null : startHour * 60 + startMin;
    const duration = allDay ? null : durationHours * 60 + durationMins;

    if (itemType === 'time-block' && !allDay) {
      createTimeBlock(eventDate, startMinutes ?? 540, duration ?? 60, title.trim());
    } else {
      addCalendarEvent({
        id: generatePrefixedId('evt'),
        title: title.trim(),
        type: itemType,
        date: eventDate,
        startMinute: startMinutes,
        durationMinutes: duration,
        completed: false,
        categoryId: categoryId || undefined,
        recurring: recurrenceRule,
        linkedNotePaths: linkedNotePaths.length > 0 ? linkedNotePaths : undefined,
      });
    }
    onClose?.();
  }
</script>

<Modal isOpen={true} title="New Event" ariaLabel="Create event" onClose={() => onClose?.()}>
  <form on:submit|preventDefault={handleSubmit} class="dialog-body">
    <EventFormFields
      {title}
      {itemType}
      {allDay}
      {startHour}
      {startMin}
      {durationHours}
      {durationMins}
      {eventDate}
      {categoryId}
      {categories}
      onChange={handleFieldChange}
    />

    <div class="recurrence-section">
      <RecurrenceEditor value={recurrenceRule} onChange={handleRecurrenceChange} />
    </div>

    <EventLinkManager
      {linkedNotePaths}
      onChange={(paths) => {
        linkedNotePaths = paths;
      }}
    />

    <div class="dialog-actions">
      <button type="button" class="btn-cancel" on:click={() => onClose?.()}>Cancel</button>
      <button type="submit" class="btn-submit" disabled={!title.trim()}>Create</button>
    </div>
  </form>
</Modal>

<style>
  .dialog-body {
    padding: 12px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .recurrence-section {
    padding: 10px 0 4px;
    border-top: 1px solid var(--border-color);
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
  .btn-cancel {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .btn-cancel:hover {
    background: var(--background-modifier-hover);
  }
  .btn-submit {
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .btn-submit:hover:not(:disabled) {
    opacity: 0.9;
  }
  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
