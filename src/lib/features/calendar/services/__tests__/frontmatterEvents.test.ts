import { describe, it, expect } from 'vitest';
import {
  parseFrontmatterDate, computeDuration,
  extractFrontmatterEvent, extractAllFrontmatterEvents,
  applySmartCategories,
} from '../frontmatterEvents';
import type { NoteWithFrontmatter } from '../frontmatterEvents';
import { DEFAULT_FM_EVENT_CONFIG } from '../../types/prisma';
import type { CalendarEvent } from '../../types';

describe('parseFrontmatterDate', () => {
  it('parses ISO datetime', () => {
    const result = parseFrontmatterDate('2025-06-15T09:30');
    expect(result).toEqual({ date: '2025-06-15', startMinute: 570, isAllDay: false });
  });

  it('parses ISO datetime with seconds', () => {
    const result = parseFrontmatterDate('2025-06-15T14:00:00');
    expect(result).toEqual({ date: '2025-06-15', startMinute: 840, isAllDay: false });
  });

  it('parses plain date as all-day', () => {
    const result = parseFrontmatterDate('2025-06-15');
    expect(result).toEqual({ date: '2025-06-15', startMinute: null, isAllDay: true });
  });

  it('returns null for non-string', () => {
    expect(parseFrontmatterDate(42)).toBeNull();
    expect(parseFrontmatterDate(null)).toBeNull();
    expect(parseFrontmatterDate(undefined)).toBeNull();
  });

  it('returns null for invalid string', () => {
    expect(parseFrontmatterDate('not a date')).toBeNull();
  });
});

describe('computeDuration', () => {
  it('computes duration in minutes', () => {
    expect(computeDuration('2025-06-15T09:00', '2025-06-15T10:30')).toBe(90);
  });

  it('returns null for invalid dates', () => {
    expect(computeDuration('invalid', '2025-06-15T10:30')).toBeNull();
  });

  it('returns null when end is before start', () => {
    expect(computeDuration('2025-06-15T10:00', '2025-06-15T09:00')).toBeNull();
  });
});

describe('extractFrontmatterEvent', () => {
  it('extracts timed event from Start/End', () => {
    const note: NoteWithFrontmatter = {
      path: 'meetings/standup.md',
      title: 'Standup',
      frontmatter: {
        Start: '2025-06-15T09:00',
        End: '2025-06-15T09:30',
        AllDay: false,
      },
    };
    const event = extractFrontmatterEvent(note);
    expect(event).not.toBeNull();
    expect(event!.title).toBe('Standup');
    expect(event!.date).toBe('2025-06-15');
    expect(event!.startMinute).toBe(540);
    expect(event!.durationMinutes).toBe(30);
    expect(event!.notePath).toBe('meetings/standup.md');
  });

  it('extracts all-day event from Date', () => {
    const note: NoteWithFrontmatter = {
      path: 'events/birthday.md',
      title: 'Birthday',
      frontmatter: { Date: '2025-07-04' },
    };
    const event = extractFrontmatterEvent(note);
    expect(event).not.toBeNull();
    expect(event!.startMinute).toBeNull();
    expect(event!.durationMinutes).toBeNull();
  });

  it('maps additional fields', () => {
    const note: NoteWithFrontmatter = {
      path: 'work/review.md',
      title: 'Q1 Review',
      frontmatter: {
        Start: '2025-06-15T14:00',
        End: '2025-06-15T15:00',
        Project: 'Q1 Planning',
        Location: 'Room A',
      },
    };
    const event = extractFrontmatterEvent(note);
    expect(event!.project).toBe('Q1 Planning');
    expect(event!.location).toBe('Room A');
  });

  it('returns null when no date properties exist', () => {
    const note: NoteWithFrontmatter = {
      path: 'random.md',
      title: 'Random',
      frontmatter: { tags: ['a'] },
    };
    expect(extractFrontmatterEvent(note)).toBeNull();
  });
});

describe('extractAllFrontmatterEvents', () => {
  it('extracts events from multiple notes', () => {
    const notes: NoteWithFrontmatter[] = [
      { path: 'a.md', title: 'A', frontmatter: { Date: '2025-06-10' } },
      { path: 'b.md', title: 'B', frontmatter: { Date: '2025-06-11' } },
      { path: 'c.md', title: 'C', frontmatter: { tags: ['x'] } },
    ];
    const events = extractAllFrontmatterEvents(notes);
    expect(events).toHaveLength(2);
  });

  it('filters by folder when configured', () => {
    const notes: NoteWithFrontmatter[] = [
      { path: 'cal/a.md', title: 'A', frontmatter: { Date: '2025-06-10' } },
      { path: 'other/b.md', title: 'B', frontmatter: { Date: '2025-06-11' } },
    ];
    const events = extractAllFrontmatterEvents(notes, { ...DEFAULT_FM_EVENT_CONFIG, folder: 'cal/' });
    expect(events).toHaveLength(1);
    expect(events[0].notePath).toBe('cal/a.md');
  });
});

describe('applySmartCategories', () => {
  it('auto-assigns categories based on title patterns', () => {
    const events: CalendarEvent[] = [
      { id: '1', title: 'Team standup', type: 'event', date: '2025-06-10', startMinute: 540, durationMinutes: 30, completed: false },
      { id: '2', title: 'Gym session', type: 'event', date: '2025-06-10', startMinute: 700, durationMinutes: 60, completed: false },
    ];
    const rules = [
      { pattern: 'standup', categoryId: 'work' },
      { pattern: 'gym', categoryId: 'health' },
    ];
    const result = applySmartCategories(events, rules);
    expect(result[0].categoryId).toBe('work');
    expect(result[1].categoryId).toBe('health');
  });

  it('does not override existing category', () => {
    const events: CalendarEvent[] = [
      { id: '1', title: 'Team standup', type: 'event', date: '2025-06-10', startMinute: 540, durationMinutes: 30, completed: false, categoryId: 'personal' },
    ];
    const result = applySmartCategories(events, [{ pattern: 'standup', categoryId: 'work' }]);
    expect(result[0].categoryId).toBe('personal');
  });

  it('returns unchanged with no rules', () => {
    const events: CalendarEvent[] = [
      { id: '1', title: 'Hello', type: 'event', date: '2025-06-10', startMinute: null, durationMinutes: null, completed: false },
    ];
    expect(applySmartCategories(events, [])).toEqual(events);
  });
});
