<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getCalendar } from '@/hubs/core/stores/settings-store.svelte';
  import { DEFAULT_CALENDAR_CATEGORIES } from '@/hubs/planner/types/calendar-types';
  import type {
    CalendarEvent,
    CalendarItemType,
    RecurrenceRule,
  } from '@/hubs/planner/types/calendar-types';
  import RecurrenceEditor from '@/hubs/planner/components/RecurrenceEditor.svelte';
  import { createNewNote } from '@/hubs/editor/services/file-ops';
  import { updateCachedContent } from '@/hubs/editor/services/file-ops';
  import { writeNote } from '@/sal/note-service';

  interface Props {
    open: boolean;
    /** Pre-fill date (YYYY-MM-DD) */
    initialDate?: string;
    /** Pre-fill start minute (0-1439) for time-slot clicks */
    initialStartMinute?: number | null;
    /** If provided, modal edits this event instead of creating */
    editEvent?: CalendarEvent | null;
    onSubmit: (data: Omit<CalendarEvent, 'id'>) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
    onNoteCreated?: (eventId: string, notePath: string) => void;
  }

  let {
    open,
    initialDate = new Date().toISOString().slice(0, 10),
    initialStartMinute = null,
    editEvent = null,
    onSubmit,
    onDelete,
    onClose,
    onNoteCreated,
  }: Props = $props();

  let title = $state('');
  let itemType: CalendarItemType = $state('event');
  let allDay = $state(true);
  let startHour = $state(9);
  let startMin = $state(0);
  let durationHours = $state(1);
  let durationMins = $state(0);
  let eventDate = $state('');
  let categoryId = $state('');
  let description = $state('');
  let location = $state('');
  let recurrence: RecurrenceRule | undefined = $state(undefined);

  const TYPE_OPTIONS: { value: CalendarItemType; label: string }[] = [
    { value: 'event', label: 'Event' },
    { value: 'task', label: 'Task' },
    { value: 'time-block', label: 'Time Block' },
  ];

  let isEditing = $derived(editEvent !== null);
  let selectedCategoryColor = $derived(
    categoryId
      ? (DEFAULT_CALENDAR_CATEGORIES.find((c) => c.id === categoryId)?.color ?? null)
      : null
  );

  $effect(() => {
    if (!open) return;
    if (editEvent) {
      title = editEvent.title;
      itemType = editEvent.type;
      eventDate = editEvent.date;
      allDay = editEvent.startMinute === null;
      startHour = editEvent.startMinute != null ? Math.floor(editEvent.startMinute / 60) : 9;
      startMin = editEvent.startMinute != null ? editEvent.startMinute % 60 : 0;
      durationHours =
        editEvent.durationMinutes != null ? Math.floor(editEvent.durationMinutes / 60) : 1;
      durationMins = editEvent.durationMinutes != null ? editEvent.durationMinutes % 60 : 0;
      categoryId = editEvent.categoryId ?? '';
      description = editEvent.description ?? '';
      location = editEvent.location ?? '';
      recurrence = editEvent.recurring;
    } else {
      title = '';
      itemType = 'event';
      eventDate = initialDate;
      allDay = initialStartMinute === null;
      startHour = initialStartMinute != null ? Math.floor(initialStartMinute / 60) : 9;
      startMin = initialStartMinute != null ? initialStartMinute % 60 : 0;
      durationHours = 1;
      durationMins = 0;
      categoryId = '';
      description = '';
      location = '';
      recurrence = undefined;
    }
  });

  function handleSubmit() {
    if (!title.trim()) return;
    const startMinutes = allDay ? null : startHour * 60 + startMin;
    const duration = allDay ? null : durationHours * 60 + durationMins;
    onSubmit({
      title: title.trim(),
      type: itemType,
      date: eventDate,
      startMinute: startMinutes,
      durationMinutes: duration,
      completed: editEvent?.completed ?? false,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      recurring: recurrence,
      color: selectedCategoryColor ?? undefined,
    });
  }

  function handleDelete() {
    if (editEvent && onDelete) onDelete(editEvent.id);
  }

  let creatingNote = $state(false);

  function formatTime(h: number, m: number): string {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }

  async function handleCreateNote() {
    if (!title.trim() || creatingNote) return;
    creatingNote = true;
    try {
      const noteTitle = title.trim();
      const folder = getCalendar().eventNoteFolder || undefined;
      const path = await createNewNote(noteTitle, folder);

      const lines: string[] = [
        '---',
        `title: "${noteTitle}"`,
        `date: ${eventDate}`,
        `type: ${itemType}`,
      ];
      if (categoryId) lines.push(`category: ${categoryId}`);
      if (location.trim()) lines.push(`location: "${location.trim()}"`);
      lines.push('---', '');
      lines.push(`# ${noteTitle}`, '');

      if (!allDay) {
        const startStr = formatTime(startHour, startMin);
        const endH = startHour + durationHours + Math.floor((startMin + durationMins) / 60);
        const endM = (startMin + durationMins) % 60;
        const endStr = formatTime(endH, endM);
        lines.push(`**Time:** ${startStr} – ${endStr}`, '');
      }
      if (location.trim()) lines.push(`**Location:** ${location.trim()}`, '');
      if (description.trim()) {
        lines.push('## Notes', '', description.trim(), '');
      }

      const content = lines.join('\n');
      await writeNote(path, content);
      updateCachedContent(path, content);

      if (editEvent && onNoteCreated) {
        onNoteCreated(editEvent.id, path);
      }

      onClose();
    } finally {
      creatingNote = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={isEditing ? 'Edit event' : 'New event'}
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{isEditing ? 'Edit Event' : 'New Event'}</h2>
        <button class="modal-close" onclick={onClose} aria-label="Close">×</button>
      </div>

      <form
        class="modal-body"
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="input-title"
          type="text"
          placeholder="Event title"
          bind:value={title}
          aria-required="true"
          autofocus
        />

        <div class="form-row">
          <span class="form-label">Type</span>
          <div class="type-selector" role="group" aria-label="Event type">
            {#each TYPE_OPTIONS as opt (opt.value)}
              <button
                type="button"
                class="type-btn"
                class:active={itemType === opt.value}
                onclick={() => (itemType = opt.value)}>{opt.label}</button
              >
            {/each}
          </div>
        </div>

        <div class="form-row">
          <label class="form-label" for="evt-category">Category</label>
          <div class="category-row">
            {#if selectedCategoryColor}
              <span
                class="category-swatch"
                style="background:{selectedCategoryColor}"
                aria-hidden="true"
              ></span>
            {/if}
            <select id="evt-category" class="input-field" bind:value={categoryId}>
              <option value="">None</option>
              {#each DEFAULT_CALENDAR_CATEGORIES as cat (cat.id)}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label" for="evt-date">Date</label>
          <input id="evt-date" type="date" class="input-field" bind:value={eventDate} />
        </div>

        <div class="form-row">
          <label class="form-label checkbox-label">
            <input type="checkbox" bind:checked={allDay} /> All day
          </label>
        </div>

        {#if !allDay}
          <div class="form-row">
            <label class="form-label" for="evt-start-h">Start</label>
            <select id="evt-start-h" class="input-field time-select" bind:value={startHour}>
              {#each Array.from({ length: 24 }, (_, i) => i) as h (h)}
                <option value={h}
                  >{h === 0 ? '12' : h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</option
                >
              {/each}
            </select>
            <select class="input-field time-select" bind:value={startMin}>
              {#each [0, 15, 30, 45] as m (m)}
                <option value={m}>:{String(m).padStart(2, '0')}</option>
              {/each}
            </select>
          </div>
          <div class="form-row">
            <label class="form-label" for="evt-dur-h">Duration</label>
            <select id="evt-dur-h" class="input-field time-select" bind:value={durationHours}>
              {#each Array.from({ length: 13 }, (_, i) => i) as h (h)}
                <option value={h}>{h}h</option>
              {/each}
            </select>
            <select class="input-field time-select" bind:value={durationMins}>
              {#each [0, 15, 30, 45] as m (m)}
                <option value={m}>{m}m</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="form-row">
          <label class="form-label" for="evt-location">Location</label>
          <input
            id="evt-location"
            type="text"
            class="input-field flex-1"
            placeholder="Optional"
            bind:value={location}
          />
        </div>

        <div class="form-row description-row">
          <label class="form-label" for="evt-desc">Notes</label>
          <textarea
            id="evt-desc"
            class="input-field flex-1"
            rows="2"
            placeholder="Add description..."
            bind:value={description}></textarea>
        </div>

        <div class="recurrence-section">
          <RecurrenceEditor
            value={recurrence}
            onChange={(val: RecurrenceRule | undefined) => (recurrence = val)}
          />
        </div>

        <div class="modal-actions">
          {#if isEditing && onDelete}
            <button type="button" class="btn-delete" onclick={handleDelete}>Delete</button>
          {/if}
          <div class="actions-right">
            <button
              type="button"
              class="btn-note"
              onclick={handleCreateNote}
              disabled={!title.trim() || creatingNote}
              title="Create a note from this event"
            >
              <BIcon name="editor" size={13} />
              <span>{creatingNote ? 'Creating…' : 'Create Note'}</span>
            </button>
            <button type="button" class="btn-cancel" onclick={onClose}>Cancel</button>
            <button type="submit" class="btn-submit" disabled={!title.trim()}>
              {isEditing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
  }
  .modal-content {
    background: var(--color-surface);
    border-radius: var(--radius-l);
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-m);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--color-border);
  }
  .modal-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--color-text-muted);
    padding: 4px 8px;
    border-radius: var(--radius-s);
  }
  .modal-close:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .modal-body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .input-title {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.9rem;
    outline: none;
    box-sizing: border-box;
  }
  .input-title:focus {
    border-color: var(--color-accent);
  }
  .form-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .description-row {
    align-items: flex-start;
  }
  .form-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    min-width: 60px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .checkbox-label {
    cursor: pointer;
    user-select: none;
  }
  .type-selector {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .type-btn {
    padding: 5px 12px;
    font-size: 0.72rem;
    border: none;
    background: var(--color-background);
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .type-btn:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }
  .type-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
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
    border-radius: var(--radius-s);
    flex-shrink: 0;
    border: 1px solid oklch(0 0 0 / 0.1);
  }
  .input-field {
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.8rem;
  }
  .input-field:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  .flex-1 {
    flex: 1;
  }
  .time-select {
    width: auto;
  }
  textarea.input-field {
    resize: vertical;
    font-family: inherit;
  }
  .recurrence-section {
    padding: 10px 0 4px;
    border-top: 1px solid var(--color-border);
  }
  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }
  .actions-right {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .btn-cancel {
    padding: 6px 14px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
  }
  .btn-cancel:hover {
    background: var(--color-surface-hover);
  }
  .btn-submit {
    padding: 6px 14px;
    font-size: 0.75rem;
    border: none;
    border-radius: var(--radius-s);
    background: var(--color-accent);
    color: var(--color-background);
    cursor: pointer;
    font-weight: 500;
  }
  .btn-submit:hover {
    background: var(--color-accent-hover);
  }
  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-delete {
    padding: 6px 14px;
    font-size: 0.75rem;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
  }
  .btn-delete:hover {
    background: oklch(from var(--color-error) l c h / 0.1);
  }
  .btn-note {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
  }
  .btn-note:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .btn-note:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
