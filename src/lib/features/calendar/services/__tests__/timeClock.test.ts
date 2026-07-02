/**
 * Tests for the time clock service.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  clockRecords,
  activeClocks,
  completedClocks,
  clockEvents,
  startClock,
  stopClock,
  cancelClock,
  deleteClock,
  formatDuration,
  getElapsedMinutes,
  getTodayTrackedMinutes,
} from '../timeClock';
import type { ClockRecord } from '../../types';

beforeEach(() => {
  clockRecords.set([]);
});

describe('startClock', () => {
  it('creates a running clock record', () => {
    const id = startClock('Write tests', 'src/test.md', 10, 'Project A');
    expect(id).toBeTruthy();
    const records = get(clockRecords);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      taskText: 'Write tests',
      sourcePath: 'src/test.md',
      sourceLine: 10,
      status: 'running',
      stoppedAt: null,
      durationMinutes: null,
      project: 'Project A',
    });
  });

  it('allows multiple running clocks', () => {
    startClock('Task A', 'a.md', 1);
    startClock('Task B', 'b.md', 2);
    expect(get(activeClocks)).toHaveLength(2);
  });
});

describe('stopClock', () => {
  it('stops a running clock and computes duration', () => {
    const id = startClock('Task', 'a.md', 1);
    stopClock(id);
    const records = get(clockRecords);
    expect(records[0].status).toBe('stopped');
    expect(records[0].stoppedAt).toBeTruthy();
    expect(records[0].durationMinutes).toBeTypeOf('number');
  });

  it('does not stop already stopped clocks', () => {
    const id = startClock('Task', 'a.md', 1);
    stopClock(id);
    const stoppedAt = get(clockRecords)[0].stoppedAt;
    stopClock(id);
    expect(get(clockRecords)[0].stoppedAt).toBe(stoppedAt);
  });
});

describe('cancelClock', () => {
  it('cancels a running clock', () => {
    const id = startClock('Task', 'a.md', 1);
    cancelClock(id);
    expect(get(clockRecords)[0].status).toBe('cancelled');
    expect(get(activeClocks)).toHaveLength(0);
  });
});

describe('deleteClock', () => {
  it('removes a clock record entirely', () => {
    const id = startClock('Task', 'a.md', 1);
    deleteClock(id);
    expect(get(clockRecords)).toHaveLength(0);
  });
});

describe('derived stores', () => {
  it('activeClocks filters to running clocks', () => {
    const id1 = startClock('Running', 'a.md', 1);
    const id2 = startClock('Also running', 'b.md', 2);
    stopClock(id1);
    expect(get(activeClocks)).toHaveLength(1);
    expect(get(activeClocks)[0].id).toBe(id2);
  });

  it('completedClocks filters to stopped clocks', () => {
    const id = startClock('Task', 'a.md', 1);
    expect(get(completedClocks)).toHaveLength(0);
    stopClock(id);
    expect(get(completedClocks)).toHaveLength(1);
  });

  it('clockEvents produces CalendarEvent objects', () => {
    const id = startClock('Task', 'a.md', 1);
    stopClock(id);
    const events = get(clockEvents);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('clock');
    expect(events[0].readonly).toBe(true);
    expect(events[0].title).toBe('Task');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('getElapsedMinutes', () => {
  it('returns durationMinutes for stopped clocks', () => {
    const record: ClockRecord = {
      id: 'test',
      taskText: 'T',
      sourcePath: 'a.md',
      sourceLine: 1,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      stoppedAt: new Date().toISOString(),
      status: 'stopped',
      durationMinutes: 60,
    };
    expect(getElapsedMinutes(record)).toBe(60);
  });

  it('computes elapsed for running clocks', () => {
    const record: ClockRecord = {
      id: 'test',
      taskText: 'T',
      sourcePath: 'a.md',
      sourceLine: 1,
      startedAt: new Date(Date.now() - 120000).toISOString(),
      stoppedAt: null,
      status: 'running',
      durationMinutes: null,
    };
    const elapsed = getElapsedMinutes(record);
    expect(elapsed).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThanOrEqual(3);
  });
});

describe('getTodayTrackedMinutes', () => {
  it('sums stopped clocks from today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const records: ClockRecord[] = [
      {
        id: '1',
        taskText: 'A',
        sourcePath: 'a.md',
        sourceLine: 1,
        startedAt: `${today}T09:00:00Z`,
        stoppedAt: `${today}T10:00:00Z`,
        status: 'stopped',
        durationMinutes: 60,
      },
      {
        id: '2',
        taskText: 'B',
        sourcePath: 'b.md',
        sourceLine: 2,
        startedAt: `${today}T14:00:00Z`,
        stoppedAt: `${today}T14:30:00Z`,
        status: 'stopped',
        durationMinutes: 30,
      },
      {
        id: '3',
        taskText: 'C',
        sourcePath: 'c.md',
        sourceLine: 3,
        startedAt: `${today}T16:00:00Z`,
        stoppedAt: null,
        status: 'running',
        durationMinutes: null,
      },
    ];
    expect(getTodayTrackedMinutes(records)).toBe(90);
  });

  it('excludes clocks from other days', () => {
    const records: ClockRecord[] = [
      {
        id: '1',
        taskText: 'A',
        sourcePath: 'a.md',
        sourceLine: 1,
        startedAt: '2020-01-01T09:00:00Z',
        stoppedAt: '2020-01-01T10:00:00Z',
        status: 'stopped',
        durationMinutes: 60,
      },
    ];
    expect(getTodayTrackedMinutes(records)).toBe(0);
  });
});
