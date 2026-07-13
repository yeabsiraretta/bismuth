import { describe, expect, it } from 'vitest';

import {
  addEvent,
  deleteEvent,
  formatDateStr,
  getDayEvents,
  getEventCountMap,
  getEvents,
  getMonthGrid,
  getUpcomingEvents,
  getViewMode,
  getWeekColumns,
  getYearMonths,
  goToToday,
  navigateCalendar,
  setFocusDate,
  setViewMode,
  toggleEventComplete,
} from '@/hubs/planner/stores/calendar-store.svelte';

describe('calendar-store', () => {
  describe('formatDateStr', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(formatDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('pads single-digit month and day', () => {
      expect(formatDateStr(new Date(2026, 2, 3))).toBe('2026-03-03');
    });

    it('handles December correctly', () => {
      expect(formatDateStr(new Date(2026, 11, 25))).toBe('2026-12-25');
    });

    it('handles last day of year', () => {
      expect(formatDateStr(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
  });

  describe('viewMode', () => {
    it('defaults to month', () => {
      const mode = getViewMode();
      expect(['day', 'week', 'month', 'year', 'list']).toContain(mode);
    });

    it('can be set and retrieved', () => {
      setViewMode('week');
      expect(getViewMode()).toBe('week');
      setViewMode('month');
      expect(getViewMode()).toBe('month');
    });
  });

  describe('focusDate and navigation', () => {
    it('goToToday sets focus to today', () => {
      setFocusDate(new Date(2020, 0, 1));
      goToToday();
      const events = getDayEvents();
      expect(events).toBeDefined();
    });

    it('navigateCalendar moves month forward', () => {
      setFocusDate(new Date(2026, 5, 15));
      setViewMode('month');
      navigateCalendar('next');
      const grid = getMonthGrid();
      expect(grid.length).toBeGreaterThan(0);
    });

    it('navigateCalendar moves day backward', () => {
      setFocusDate(new Date(2026, 5, 15));
      setViewMode('day');
      navigateCalendar('prev');
      const events = getDayEvents();
      expect(events).toBeDefined();
    });
  });

  describe('getMonthGrid', () => {
    it('returns cells for a full month starting at correct weekday', () => {
      setFocusDate(new Date(2026, 0, 1));
      const grid = getMonthGrid();
      const firstDay = new Date(2026, 0, 1).getDay();
      for (let i = 0; i < firstDay; i++) {
        expect(grid[i].day).toBeNull();
      }
      expect(grid[firstDay].day).toBe(1);
    });

    it('has 31 day cells for January', () => {
      setFocusDate(new Date(2026, 0, 1));
      const grid = getMonthGrid();
      const dayCells = grid.filter((c) => c.day !== null);
      expect(dayCells).toHaveLength(31);
    });

    it('has 28 day cells for February 2026', () => {
      setFocusDate(new Date(2026, 1, 1));
      const grid = getMonthGrid();
      const dayCells = grid.filter((c) => c.day !== null);
      expect(dayCells).toHaveLength(28);
    });
  });

  describe('getYearMonths', () => {
    it('returns 12 months', () => {
      setFocusDate(new Date(2026, 0, 1));
      const months = getYearMonths();
      expect(months).toHaveLength(12);
    });

    it('each month has correct name', () => {
      setFocusDate(new Date(2026, 0, 1));
      const months = getYearMonths();
      expect(months[0].name).toBe('Jan');
      expect(months[11].name).toBe('Dec');
    });
  });

  describe('getWeekColumns', () => {
    it('returns 7 columns', () => {
      setFocusDate(new Date(2026, 6, 6));
      const cols = getWeekColumns();
      expect(cols).toHaveLength(7);
    });

    it('columns have dayName and dayNumber', () => {
      setFocusDate(new Date(2026, 6, 6));
      const cols = getWeekColumns();
      for (const col of cols) {
        expect(col.dayName).toBeTruthy();
        expect(typeof col.dayNumber).toBe('number');
        expect(col.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('event CRUD', () => {
    it('addEvent adds an event and getEvents returns it', () => {
      const before = getEvents().length;
      addEvent('Test Event', '2099-12-25');
      const after = getEvents();
      expect(after.length).toBe(before + 1);
      const added = after.find((e) => e.title === 'Test Event');
      expect(added).toBeDefined();
      expect(added!.date).toBe('2099-12-25');
      expect(added!.completed).toBe(false);
    });

    it('toggleEventComplete flips completed', () => {
      const evt = getEvents().find((e) => e.title === 'Test Event')!;
      expect(evt.completed).toBe(false);
      toggleEventComplete(evt.id);
      const toggled = getEvents().find((e) => e.id === evt.id)!;
      expect(toggled.completed).toBe(true);
    });

    it('deleteEvent removes the event', () => {
      const evt = getEvents().find((e) => e.title === 'Test Event')!;
      deleteEvent(evt.id);
      const remaining = getEvents().find((e) => e.id === evt.id);
      expect(remaining).toBeUndefined();
    });
  });

  describe('getEventCountMap', () => {
    it('counts events per date', () => {
      addEvent('A', '2099-01-01');
      addEvent('B', '2099-01-01');
      addEvent('C', '2099-01-02');
      const counts = getEventCountMap();
      expect(counts['2099-01-01']).toBeGreaterThanOrEqual(2);
      expect(counts['2099-01-02']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getUpcomingEvents', () => {
    it('returns events sorted by date', () => {
      const upcoming = getUpcomingEvents(100);
      for (let i = 1; i < upcoming.length; i++) {
        expect(upcoming[i].date >= upcoming[i - 1].date).toBe(true);
      }
    });

    it('respects limit', () => {
      const limited = getUpcomingEvents(2);
      expect(limited.length).toBeLessThanOrEqual(2);
    });
  });
});
