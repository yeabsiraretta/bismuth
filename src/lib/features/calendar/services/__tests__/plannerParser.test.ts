/**
 * Tests for the daily note planner parser.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { parsePlannerEntries, plannerEntriesToEvents, parseScheduledTasks } from '../plannerParser';

// ---------------------------------------------------------------------------
// parsePlannerEntries
// ---------------------------------------------------------------------------

describe('parsePlannerEntries', () => {
  const PATH = 'daily/2024-01-15.md';

  it('parses timed tasks under Day planner heading', () => {
    const content = `# Day planner
- [ ] 10:00 - 11:30 Meeting with team
- [x] 14:00 Write report`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      text: 'Meeting with team',
      completed: false,
      startTime: '10:00',
      endTime: '11:30',
      line: 2,
    });
    expect(entries[1]).toMatchObject({
      text: 'Write report',
      completed: true,
      startTime: '14:00',
      endTime: null,
      line: 3,
    });
  });

  it('ignores timed tasks outside planner heading without scheduled date', () => {
    const content = `# Notes
- [ ] 10:00 Some note task
# Day planner
- [ ] 12:00 Actual planner entry`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('Actual planner entry');
  });

  it('includes tasks outside planner heading if they have scheduled date', () => {
    const content = `# Tasks
- [ ] 09:00 Review docs [scheduled:: 2024-01-15]`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(1);
    expect(entries[0].scheduledDate).toBe('2024-01-15');
    expect(entries[0].text).toBe('Review docs');
  });

  it('handles case-insensitive heading match', () => {
    const content = `## day planner
- [ ] 08:00 Morning standup`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(1);
  });

  it('handles custom planner heading', () => {
    const content = `# Schedule
- [ ] 08:00 Coffee`;
    const entries = parsePlannerEntries(content, PATH, 'Schedule');
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('Coffee');
  });

  it('strips #task prefix from text', () => {
    const content = `# Day planner
- [ ] #task 10:00 - 11:00 Review`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('Review');
  });

  it('strips scheduled date markers from text', () => {
    const content = `# Day planner
- [ ] 10:00 Meeting (scheduled:: 2024-01-15)`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries[0].text).toBe('Meeting');
    expect(entries[0].scheduledDate).toBe('2024-01-15');
  });

  it('infers end times from next entry start time', () => {
    const content = `# Day planner
- [ ] 09:00 Task A
- [ ] 10:30 Task B
- [ ] 11:00 Task C`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries[0].endTime).toBe('10:30');
    expect(entries[1].endTime).toBe('11:00');
    expect(entries[2].endTime).toBeNull();
  });

  it('returns empty for content without matching lines', () => {
    const content = `# Day planner
Just some notes here.
No tasks at all.`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(0);
  });

  it('handles completed tasks with X (uppercase)', () => {
    const content = `# Day planner
- [X] 15:00 Done task`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries[0].completed).toBe(true);
  });

  it('leaves section when a new heading appears', () => {
    const content = `# Day planner
- [ ] 09:00 In planner
# Other section
- [ ] 10:00 Not in planner`;
    const entries = parsePlannerEntries(content, PATH);
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe('In planner');
  });
});

// ---------------------------------------------------------------------------
// plannerEntriesToEvents
// ---------------------------------------------------------------------------

describe('plannerEntriesToEvents', () => {
  it('converts entries to CalendarEvents with correct fields', () => {
    const entries = [
      { text: 'Meeting', completed: false, startTime: '10:00', endTime: '11:30', sourcePath: 'a.md', line: 2 },
    ];
    const events = plannerEntriesToEvents(entries, '2024-01-15');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: 'Meeting',
      type: 'planner',
      date: '2024-01-15',
      startMinute: 600,
      durationMinutes: 90,
      completed: false,
      taskSourcePath: 'a.md',
      taskLine: 2,
    });
  });

  it('uses scheduledDate over passed date when present', () => {
    const entries = [
      { text: 'Task', completed: false, startTime: '09:00', endTime: null, sourcePath: 'a.md', line: 1, scheduledDate: '2024-02-01' },
    ];
    const events = plannerEntriesToEvents(entries, '2024-01-15');
    expect(events[0].date).toBe('2024-02-01');
  });

  it('defaults to 60 minutes when no end time', () => {
    const entries = [
      { text: 'Task', completed: false, startTime: '14:00', endTime: null, sourcePath: 'a.md', line: 1 },
    ];
    const events = plannerEntriesToEvents(entries, '2024-01-15');
    expect(events[0].durationMinutes).toBe(60);
  });

  it('handles overnight wrap (negative duration)', () => {
    const entries = [
      { text: 'Night shift', completed: false, startTime: '23:00', endTime: '01:00', sourcePath: 'a.md', line: 1 },
    ];
    const events = plannerEntriesToEvents(entries, '2024-01-15');
    expect(events[0].durationMinutes).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// parseScheduledTasks
// ---------------------------------------------------------------------------

describe('parseScheduledTasks', () => {
  it('extracts timed tasks with scheduled dates', () => {
    const tasks = [
      { text: '10:00 - 11:00 Review PR', source_path: 'tasks.md', line: 5, scheduled_date: '2024-01-15', status: 'open' },
    ];
    const entries = parseScheduledTasks(tasks);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      text: 'Review PR',
      startTime: '10:00',
      endTime: '11:00',
      scheduledDate: '2024-01-15',
      completed: false,
    });
  });

  it('skips tasks without scheduled dates', () => {
    const tasks = [
      { text: '10:00 No date', source_path: 'a.md', line: 1, scheduled_date: null, status: 'open' },
    ];
    expect(parseScheduledTasks(tasks)).toHaveLength(0);
  });

  it('skips tasks without time in text', () => {
    const tasks = [
      { text: 'No time here', source_path: 'a.md', line: 1, scheduled_date: '2024-01-15', status: 'open' },
    ];
    expect(parseScheduledTasks(tasks)).toHaveLength(0);
  });

  it('marks done tasks as completed', () => {
    const tasks = [
      { text: '08:00 Done task', source_path: 'a.md', line: 1, scheduled_date: '2024-01-15', status: 'done' },
    ];
    const entries = parseScheduledTasks(tasks);
    expect(entries[0].completed).toBe(true);
  });
});
