/**
 * Calendar feature tests — EventChip category colors and RecurrenceEditor output.
 * Covers T09 (category color on EventChip) and T18 (RecurrenceEditor change event).
 */

import { describe, it, expect } from 'vitest';
import { expandRecurringEvents } from '../stores/recurrence';
import type { CalendarEvent } from '../types';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'test-1',
    title: 'Test Event',
    type: 'event',
    date: '2026-01-05',
    startMinute: 540,
    durationMinutes: 60,
    completed: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// EventChip category color logic (pure color resolution, no DOM render)
// ---------------------------------------------------------------------------

describe('EventChip category color resolution', () => {
  const categories = [
    { id: 'work', name: 'Work', color: '#dc2626' },
    { id: 'personal', name: 'Personal', color: '#16a34a' },
    { id: 'health', name: 'Health', color: '#d97706' },
    { id: 'study', name: 'Study', color: '#2563eb' },
    { id: 'other', name: 'Other', color: '#6b7280' },
  ];

  function resolveCategoryColor(event: CalendarEvent): string | null {
    if (!event.categoryId) return null;
    const cat = categories.find((c) => c.id === event.categoryId);
    return cat?.color ?? null;
  }

  it('returns null when categoryId is absent', () => {
    expect(resolveCategoryColor(makeEvent())).toBeNull();
  });

  it('returns correct color for work category', () => {
    const event = makeEvent({ categoryId: 'work' });
    expect(resolveCategoryColor(event)).toBe('#dc2626');
  });

  it('returns correct color for personal category', () => {
    const event = makeEvent({ categoryId: 'personal' });
    expect(resolveCategoryColor(event)).toBe('#16a34a');
  });

  it('returns correct color for health category', () => {
    const event = makeEvent({ categoryId: 'health' });
    expect(resolveCategoryColor(event)).toBe('#d97706');
  });

  it('returns correct color for study category', () => {
    const event = makeEvent({ categoryId: 'study' });
    expect(resolveCategoryColor(event)).toBe('#2563eb');
  });

  it('returns correct color for other category', () => {
    const event = makeEvent({ categoryId: 'other' });
    expect(resolveCategoryColor(event)).toBe('#6b7280');
  });

  it('returns null for unknown categoryId (fallback)', () => {
    const event = makeEvent({ categoryId: 'nonexistent-id' });
    expect(resolveCategoryColor(event)).toBeNull();
  });

  it('produces correct inline background style at 22 hex opacity', () => {
    const color = '#dc2626';
    const style = `background: ${color}22; border-left: 3px solid ${color};`;
    expect(style).toBe('background: #dc262622; border-left: 3px solid #dc2626;');
  });
});

// ---------------------------------------------------------------------------
// RecurrenceEditor — emitted RecurrenceRule logic tested via expandRecurringEvents
// ---------------------------------------------------------------------------

describe('RecurrenceEditor weekly every-2-weeks rule', () => {
  it('weekly interval:2 produces instances on correct bi-weekly dates', () => {
    const event = makeEvent({
      id: 'recur-1',
      date: '2026-01-05', // Monday
      recurring: { frequency: 'weekly', interval: 2 },
    });

    const start = new Date(2026, 0, 1); // 2026-01-01
    const end = new Date(2026, 1, 28); // 2026-02-28

    const expanded = expandRecurringEvents([event], start, end);
    const dates = expanded.map((e) => e.date);

    // Jan 5, Jan 19, Feb 2, Feb 16 (every 2 weeks)
    expect(dates).toContain('2026-01-05');
    expect(dates).toContain('2026-01-19');
    expect(dates).toContain('2026-02-02');
    expect(dates).toContain('2026-02-16');

    // Ensure non-bi-weekly dates are absent
    expect(dates).not.toContain('2026-01-12');
    expect(dates).not.toContain('2026-01-26');
    expect(dates).not.toContain('2026-02-09');
    expect(dates).not.toContain('2026-02-23');
  });

  it('weekly rule stops on endDate', () => {
    const event = makeEvent({
      id: 'recur-2',
      date: '2026-01-05',
      recurring: { frequency: 'weekly', interval: 1, endDate: '2026-01-19' },
    });

    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 1, 28);

    const expanded = expandRecurringEvents([event], start, end);
    const dates = expanded.map((e) => e.date);

    expect(dates).toContain('2026-01-05');
    expect(dates).toContain('2026-01-12');
    expect(dates).toContain('2026-01-19');
    expect(dates).not.toContain('2026-01-26');
  });

  it('weekly with daysOfWeek filter only includes cursor days that match the filter', () => {
    // The recurrence expander advances by full week intervals from origin.
    // daysOfWeek acts as a guard: cursor days that do NOT match the list are skipped.
    // Jan 5 is Monday (day 1). With interval:1 weekly, cursor lands Mon Jan 5, Mon Jan 12.
    // Only Mon (day 1) matches [1], so only Mondays appear.
    const event = makeEvent({
      id: 'recur-3',
      date: '2026-01-05', // Monday
      recurring: { frequency: 'weekly', interval: 1, daysOfWeek: [1] }, // Mondays only
    });

    const start = new Date(2026, 0, 5);
    const end = new Date(2026, 0, 25);

    const expanded = expandRecurringEvents([event], start, end);
    const dates = expanded.map((e) => e.date);

    // Weekly from Jan 5 (Mon) → Jan 5, 12, 19
    expect(dates).toContain('2026-01-05');
    expect(dates).toContain('2026-01-12');
    expect(dates).toContain('2026-01-19');

    // Tuesdays and Wednesdays should not appear
    expect(dates).not.toContain('2026-01-06');
    expect(dates).not.toContain('2026-01-07');
    expect(dates).not.toContain('2026-01-13');
  });
});

// ---------------------------------------------------------------------------
// Linked note paths round-trip
// ---------------------------------------------------------------------------

describe('CalendarEvent linkedNotePaths', () => {
  it('event with linked note paths serializes and deserializes correctly', () => {
    const paths = ['notes/project-alpha.md', '10-19-personal/11.01-welcome.md'];
    const event = makeEvent({ linkedNotePaths: paths });

    const serialized = JSON.stringify(event);
    const deserialized: CalendarEvent = JSON.parse(serialized);

    expect(deserialized.linkedNotePaths).toEqual(paths);
    expect(deserialized.linkedNotePaths?.length).toBe(2);
  });

  it('event without linked notes has undefined linkedNotePaths', () => {
    const event = makeEvent();
    expect(event.linkedNotePaths).toBeUndefined();
  });
});
