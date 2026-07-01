import { describe, it, expect } from 'vitest';
import { expandRecurringEvents } from '../recurrence';
import type { CalendarEvent } from '../../types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    title: 'Test',
    type: 'event',
    date: '2026-06-01',
    startMinute: 540,
    durationMinutes: 60,
    completed: false,
    ...overrides,
  };
}

const start = new Date(2026, 5, 1);  // 2026-06-01
const end = new Date(2026, 6, 1);    // 2026-07-01

describe('expandRecurringEvents', () => {
  it('passes non-recurring events through if in range', () => {
    const event = makeEvent({ date: '2026-06-15' });
    const result = expandRecurringEvents([event], start, end);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-06-15');
  });

  it('excludes non-recurring events outside range', () => {
    const event = makeEvent({ date: '2026-05-01' });
    const result = expandRecurringEvents([event], start, end);
    expect(result).toHaveLength(0);
  });

  it('expands daily recurring event across range', () => {
    const event = makeEvent({
      date: '2026-06-01',
      recurring: { frequency: 'daily', interval: 1 },
    });
    const result = expandRecurringEvents([event], start, end);
    expect(result.length).toBe(31); // June 1–July 1 = 31 days
    expect(result[0].date).toBe('2026-06-01');
    expect(result[30].date).toBe('2026-07-01');
  });

  it('respects interval: every 2 days', () => {
    const event = makeEvent({
      date: '2026-06-01',
      recurring: { frequency: 'daily', interval: 2 },
    });
    const result = expandRecurringEvents([event], start, end);
    // Jun 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29 = 15 days + Jul 1 = 16
    expect(result.length).toBe(16);
  });

  it('expands weekly every 2 weeks', () => {
    const event = makeEvent({
      date: '2026-06-01',  // Monday
      recurring: { frequency: 'weekly', interval: 2 },
    });
    const result = expandRecurringEvents([event], start, end);
    expect(result.length).toBe(3); // Jun 1, Jun 15, Jun 29
    expect(result.map(e => e.date)).toEqual(['2026-06-01', '2026-06-15', '2026-06-29']);
  });

  it('respects endDate for recurring event', () => {
    const event = makeEvent({
      date: '2026-06-01',
      recurring: { frequency: 'daily', interval: 1, endDate: '2026-06-05' },
    });
    const result = expandRecurringEvents([event], start, end);
    expect(result.length).toBe(5);
    expect(result[4].date).toBe('2026-06-05');
  });

  it('expands monthly event', () => {
    const rangeStart = new Date(2026, 0, 1);  // Jan 1
    const rangeEnd = new Date(2026, 5, 30);   // Jun 30
    const event = makeEvent({
      date: '2026-01-15',
      recurring: { frequency: 'monthly', interval: 1 },
    });
    const result = expandRecurringEvents([event], rangeStart, rangeEnd);
    expect(result.length).toBe(6); // Jan 15 through Jun 15
    expect(result[0].date).toBe('2026-01-15');
    expect(result[5].date).toBe('2026-06-15');
  });

  it('clamps monthly event on 31st to last day of shorter months', () => {
    const rangeStart = new Date(2026, 0, 1);
    const rangeEnd = new Date(2026, 2, 31);
    const event = makeEvent({
      date: '2026-01-31',
      recurring: { frequency: 'monthly', interval: 1 },
    });
    const result = expandRecurringEvents([event], rangeStart, rangeEnd);
    const dates = result.map(e => e.date);
    expect(dates).toContain('2026-01-31');
    expect(dates).toContain('2026-02-28'); // Feb clamped to 28
    expect(dates).toContain('2026-03-31');
  });

  it('produces composite IDs for expanded instances', () => {
    const event = makeEvent({
      id: 'orig',
      date: '2026-06-01',
      recurring: { frequency: 'daily', interval: 1 },
    });
    const result = expandRecurringEvents([event], start, end);
    expect(result[0].id).toBe('orig::2026-06-01');
    expect(result[1].id).toBe('orig::2026-06-02');
  });
});
