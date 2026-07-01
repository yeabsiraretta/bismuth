import { describe, it, expect } from 'vitest';
import {
  filterEventsByRange, computeCategoryBreakdown,
  computeStreaks, findBusiestDay, computeCalendarStats,
} from '../calendarStats';
import type { CalendarEvent, CalendarCategory } from '../../types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1', title: 'Test', type: 'event', date: '2025-06-15',
    startMinute: 540, durationMinutes: 60, completed: false, ...overrides,
  };
}

describe('filterEventsByRange', () => {
  const events = [
    makeEvent({ id: 'a', date: '2025-06-14' }),
    makeEvent({ id: 'b', date: '2025-06-15' }),
    makeEvent({ id: 'c', date: '2025-06-16' }),
    makeEvent({ id: 'd', date: '2025-07-01' }),
  ];

  it('returns all for range=all', () => {
    expect(filterEventsByRange(events, 'all')).toHaveLength(4);
  });

  it('filters by day', () => {
    const ref = new Date('2025-06-15T12:00:00');
    const result = filterEventsByRange(events, 'day', ref);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('filters by month', () => {
    const ref = new Date('2025-06-15T12:00:00');
    const result = filterEventsByRange(events, 'month', ref);
    expect(result).toHaveLength(3);
  });
});

describe('computeCategoryBreakdown', () => {
  const categories: CalendarCategory[] = [
    { id: 'work', name: 'Work', color: 'red' },
    { id: 'personal', name: 'Personal', color: 'green' },
  ];

  it('groups events by category', () => {
    const events = [
      makeEvent({ categoryId: 'work', durationMinutes: 60 }),
      makeEvent({ id: 'e2', categoryId: 'work', durationMinutes: 120 }),
      makeEvent({ id: 'e3', categoryId: 'personal', durationMinutes: 30 }),
    ];
    const result = computeCategoryBreakdown(events, categories);
    expect(result).toHaveLength(2);
    const work = result.find(r => r.categoryId === 'work')!;
    expect(work.eventCount).toBe(2);
    expect(work.totalMinutes).toBe(180);
  });

  it('handles events with no category', () => {
    const result = computeCategoryBreakdown([makeEvent()], categories);
    expect(result[0].categoryId).toBe('other');
  });
});

describe('computeStreaks', () => {
  it('computes streak of consecutive days', () => {
    const events = [
      makeEvent({ date: '2025-06-13' }),
      makeEvent({ date: '2025-06-14' }),
      makeEvent({ date: '2025-06-15' }),
    ];
    const { longestStreak } = computeStreaks(events);
    expect(longestStreak).toBe(3);
  });

  it('handles gaps', () => {
    const events = [
      makeEvent({ date: '2025-06-10' }),
      makeEvent({ date: '2025-06-12' }),
    ];
    const { longestStreak } = computeStreaks(events);
    expect(longestStreak).toBe(1);
  });

  it('returns 0 for empty', () => {
    const { currentStreak, longestStreak } = computeStreaks([]);
    expect(currentStreak).toBe(0);
    expect(longestStreak).toBe(0);
  });
});

describe('findBusiestDay', () => {
  it('finds the day with most events', () => {
    const events = [
      makeEvent({ date: '2025-06-10' }),
      makeEvent({ id: '2', date: '2025-06-10' }),
      makeEvent({ id: '3', date: '2025-06-11' }),
    ];
    const result = findBusiestDay(events);
    expect(result).toEqual({ date: '2025-06-10', count: 2 });
  });

  it('returns null for empty', () => {
    expect(findBusiestDay([])).toBeNull();
  });
});

describe('computeCalendarStats', () => {
  it('computes full stats', () => {
    const events = [
      makeEvent({ date: '2025-06-14', completed: true, durationMinutes: 60 }),
      makeEvent({ id: '2', date: '2025-06-15', durationMinutes: 120 }),
      makeEvent({ id: '3', date: '2025-06-15', completed: true, durationMinutes: 30 }),
    ];
    const stats = computeCalendarStats(events);
    expect(stats.totalEvents).toBe(3);
    expect(stats.totalMinutes).toBe(210);
    expect(stats.completedCount).toBe(2);
    expect(stats.completionRate).toBe(67);
    expect(stats.busiestDay!.date).toBe('2025-06-15');
    expect(stats.averageEventsPerDay).toBe(1.5);
  });
});
