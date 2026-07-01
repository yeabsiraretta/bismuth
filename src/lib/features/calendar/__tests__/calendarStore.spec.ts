/**
 * Calendar store tests — date navigation, event loading, view switching.
 * Spec 021 T018 — stored at feature module path per project conventions.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/utils/id', () => ({
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}-test-id`),
}));
vi.mock('@/features/tasks', () => ({
  tasks: { subscribe: vi.fn((fn: (v: unknown[]) => void) => { fn([]); return vi.fn(); }) },
}));
vi.mock('@/features/gamify', () => ({
  recordCalendarEventCompleted: vi.fn(),
}));

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

import {
  calendarEvents,
  calendarViewMode,
  calendarFocusDate,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  navigateCalendar,
  goToToday,
} from '../stores/calendarStore';
import type { CalendarEvent } from '../types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: `ev-${Math.random().toString(36).slice(2)}`,
    title: 'Test Event',
    type: 'event',
    date: '2026-07-01',
    startMinute: 600,
    durationMinutes: 60,
    completed: false,
    ...overrides,
  };
}

/** Read current year-month from focusDate as "YYYY-MM" */
function _focusYearMonth(): string {
  const d = get(calendarFocusDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
} void _focusYearMonth;

describe('calendarStore', () => {
  beforeEach(() => {
    calendarEvents.set([]);
    calendarViewMode.set('week');
    goToToday();
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  // ---------------------------------------------------------------------------
  // Date navigation
  // ---------------------------------------------------------------------------

  describe('date navigation', () => {
    it('navigateCalendar next in week mode advances by 7 days', () => {
      const before = get(calendarFocusDate).getTime();
      calendarViewMode.set('week');

      navigateCalendar('next');

      const after = get(calendarFocusDate).getTime();
      expect(after - before).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('navigateCalendar prev in week mode goes back 7 days', () => {
      calendarViewMode.set('week');
      const before = get(calendarFocusDate).getTime();

      navigateCalendar('prev');

      const after = get(calendarFocusDate).getTime();
      expect(before - after).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('navigateCalendar next in month mode advances to next month', () => {
      calendarViewMode.set('month');
      const before = get(calendarFocusDate);
      const expectedMonth = (before.getMonth() + 1) % 12;

      navigateCalendar('next');

      const after = get(calendarFocusDate);
      expect(after.getMonth()).toBe(expectedMonth);
    });

    it('navigateCalendar prev in month mode goes to previous month', () => {
      calendarViewMode.set('month');
      const before = get(calendarFocusDate);
      const expectedMonth = before.getMonth() === 0 ? 11 : before.getMonth() - 1;

      navigateCalendar('prev');

      const after = get(calendarFocusDate);
      expect(after.getMonth()).toBe(expectedMonth);
    });

    it('navigateCalendar next in day mode advances by exactly 1 day', () => {
      calendarViewMode.set('day');
      const before = get(calendarFocusDate).getTime();

      navigateCalendar('next');

      const after = get(calendarFocusDate).getTime();
      expect(after - before).toBe(24 * 60 * 60 * 1000);
    });

    it('navigateCalendar prev in day mode goes back 1 day', () => {
      calendarViewMode.set('day');
      const before = get(calendarFocusDate).getTime();

      navigateCalendar('prev');

      const after = get(calendarFocusDate).getTime();
      expect(before - after).toBe(24 * 60 * 60 * 1000);
    });

    it('goToToday resets focusDate to today', () => {
      calendarViewMode.set('month');
      navigateCalendar('next');
      navigateCalendar('next');

      goToToday();

      const today = new Date();
      const focus = get(calendarFocusDate);
      expect(focus.getFullYear()).toBe(today.getFullYear());
      expect(focus.getMonth()).toBe(today.getMonth());
      expect(focus.getDate()).toBe(today.getDate());
    });
  });

  // ---------------------------------------------------------------------------
  // Event loading (CRUD)
  // ---------------------------------------------------------------------------

  describe('event loading and CRUD', () => {
    it('starts with empty events', () => {
      expect(get(calendarEvents)).toHaveLength(0);
    });

    it('addCalendarEvent appends event to store', () => {
      const ev = makeEvent({ id: 'e1', title: 'Meeting' });
      addCalendarEvent(ev);
      expect(get(calendarEvents)).toHaveLength(1);
      expect(get(calendarEvents)[0].title).toBe('Meeting');
    });

    it('addCalendarEvent preserves existing events', () => {
      addCalendarEvent(makeEvent({ id: 'a', title: 'A' }));
      addCalendarEvent(makeEvent({ id: 'b', title: 'B' }));
      expect(get(calendarEvents)).toHaveLength(2);
    });

    it('updateCalendarEvent modifies the matching event', () => {
      const ev = makeEvent({ id: 'upd-1', title: 'Before' });
      addCalendarEvent(ev);

      updateCalendarEvent('upd-1', { title: 'After' });

      const updated = get(calendarEvents).find((e) => e.id === 'upd-1');
      expect(updated?.title).toBe('After');
    });

    it('updateCalendarEvent leaves other events unchanged', () => {
      addCalendarEvent(makeEvent({ id: 'x1', title: 'X1' }));
      addCalendarEvent(makeEvent({ id: 'x2', title: 'X2' }));

      updateCalendarEvent('x1', { title: 'Modified' });

      const x2 = get(calendarEvents).find((e) => e.id === 'x2');
      expect(x2?.title).toBe('X2');
    });

    it('deleteCalendarEvent removes the matching event', () => {
      addCalendarEvent(makeEvent({ id: 'del-1', title: 'Delete me' }));
      addCalendarEvent(makeEvent({ id: 'del-2', title: 'Keep me' }));

      deleteCalendarEvent('del-1');

      const remaining = get(calendarEvents);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('del-2');
    });

    it('deleteCalendarEvent is a no-op for unknown id', () => {
      addCalendarEvent(makeEvent({ id: 'keep', title: 'Keep' }));
      deleteCalendarEvent('does-not-exist');
      expect(get(calendarEvents)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // View switching
  // ---------------------------------------------------------------------------

  describe('view switching', () => {
    it('default view mode is week', () => {
      expect(get(calendarViewMode)).toBe('week');
    });

    it('switching to month mode changes calendarViewMode', () => {
      calendarViewMode.set('month');
      expect(get(calendarViewMode)).toBe('month');
    });

    it('switching to day mode changes calendarViewMode', () => {
      calendarViewMode.set('day');
      expect(get(calendarViewMode)).toBe('day');
    });

    it('switching back to week mode restores week', () => {
      calendarViewMode.set('month');
      calendarViewMode.set('week');
      expect(get(calendarViewMode)).toBe('week');
    });

    it('navigateCalendar respects current view mode', () => {
      calendarViewMode.set('day');
      const before = get(calendarFocusDate).getTime();
      navigateCalendar('next');
      const diff = get(calendarFocusDate).getTime() - before;
      // 1-day delta in ms
      expect(diff).toBe(86400000);
    });
  });
});
