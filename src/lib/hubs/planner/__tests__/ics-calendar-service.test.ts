import { describe, expect, it } from 'vitest';

import {
  exportToIcs,
  mergeIcsImport,
  parseIcs,
} from '@/hubs/planner/services/ics-calendar-service';
import type { CalendarEvent } from '@/hubs/planner/types/calendar-types';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:event-1@google.com
DTSTART:20260715T090000Z
DTEND:20260715T100000Z
SUMMARY:Team Standup
DESCRIPTION:Daily sync meeting
LOCATION:Conference Room A
END:VEVENT
BEGIN:VEVENT
UID:event-2@google.com
DTSTART:20260716
DTEND:20260717
SUMMARY:Company Holiday
END:VEVENT
BEGIN:VEVENT
UID:event-3@google.com
DTSTART:20260720T143000Z
DTEND:20260720T160000Z
SUMMARY:Project Review
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR
DESCRIPTION:Bi-weekly\\nproject status review
END:VEVENT
END:VCALENDAR`;

describe('ICS Calendar Service', () => {
  describe('parseIcs', () => {
    it('parses multiple VEVENT components', () => {
      const result = parseIcs(SAMPLE_ICS);
      expect(result.count).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts date and time for timed events', () => {
      const result = parseIcs(SAMPLE_ICS);
      const standup = result.events.find((e) => e.title === 'Team Standup')!;
      expect(standup.date).toBe('2026-07-15');
      expect(standup.startMinute).toBe(9 * 60); // 9:00 = 540 min
      expect(standup.durationMinutes).toBe(60);
    });

    it('parses all-day events with null startMinute', () => {
      const result = parseIcs(SAMPLE_ICS);
      const holiday = result.events.find((e) => e.title === 'Company Holiday')!;
      expect(holiday.date).toBe('2026-07-16');
      expect(holiday.startMinute).toBeNull();
    });

    it('extracts description and location', () => {
      const result = parseIcs(SAMPLE_ICS);
      const standup = result.events.find((e) => e.title === 'Team Standup')!;
      expect(standup.description).toBe('Daily sync meeting');
      expect(standup.location).toBe('Conference Room A');
    });

    it('parses RRULE into RecurrenceRule', () => {
      const result = parseIcs(SAMPLE_ICS);
      const review = result.events.find((e) => e.title === 'Project Review')!;
      expect(review.recurring).toBeDefined();
      expect(review.recurring!.frequency).toBe('weekly');
      expect(review.recurring!.interval).toBe(2);
      expect(review.recurring!.daysOfWeek).toEqual([1, 3, 5]); // MO, WE, FR
    });

    it('unescapes ICS special characters in description', () => {
      const result = parseIcs(SAMPLE_ICS);
      const review = result.events.find((e) => e.title === 'Project Review')!;
      expect(review.description).toBe('Bi-weekly\nproject status review');
    });

    it('uses UID as event id', () => {
      const result = parseIcs(SAMPLE_ICS);
      expect(result.events[0].id).toBe('event-1@google.com');
    });

    it('handles empty input gracefully', () => {
      const result = parseIcs('');
      expect(result.count).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('handles ICS with no events', () => {
      const result = parseIcs('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR');
      expect(result.count).toBe(0);
    });

    it('handles folded lines (continuation)', () => {
      const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:fold-test
DTSTART:20260801T100000Z
SUMMARY:This is a very long
 event title that wraps
END:VEVENT
END:VCALENDAR`;
      const result = parseIcs(ics);
      expect(result.events[0].title).toBe('This is a very longevent title that wraps');
    });

    it('skips events without SUMMARY', () => {
      const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-title
DTSTART:20260801T100000Z
END:VEVENT
END:VCALENDAR`;
      const result = parseIcs(ics);
      expect(result.count).toBe(0);
    });
  });

  describe('exportToIcs', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Morning Meeting',
        type: 'event',
        date: '2026-07-15',
        startMinute: 540,
        durationMinutes: 60,
        completed: false,
        description: 'Discuss roadmap',
        location: 'Room 301',
      },
      {
        id: 'evt-2',
        title: 'All Day Conference',
        type: 'event',
        date: '2026-07-20',
        startMinute: null,
        durationMinutes: null,
        completed: false,
      },
      {
        id: 'evt-3',
        title: 'Done Task',
        type: 'task',
        date: '2026-07-10',
        startMinute: null,
        durationMinutes: null,
        completed: true,
      },
    ];

    it('generates valid VCALENDAR structure', () => {
      const ics = exportToIcs(events);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
    });

    it('includes VEVENT for each non-completed event by default', () => {
      const ics = exportToIcs(events);
      expect(ics).toContain('SUMMARY:Morning Meeting');
      expect(ics).toContain('SUMMARY:All Day Conference');
      expect(ics).not.toContain('SUMMARY:Done Task');
    });

    it('includes completed events when option set', () => {
      const ics = exportToIcs(events, { includeCompleted: true });
      expect(ics).toContain('SUMMARY:Done Task');
    });

    it('formats timed events with DTSTART and DTEND', () => {
      const ics = exportToIcs(events);
      expect(ics).toContain('DTSTART:20260715T090000');
      expect(ics).toContain('DTEND:20260715T100000');
    });

    it('formats all-day events with date-only DTSTART', () => {
      const ics = exportToIcs(events);
      expect(ics).toContain('DTSTART:20260720');
    });

    it('escapes special characters', () => {
      const special: CalendarEvent[] = [
        {
          id: 'esc',
          title: 'Review; check, things',
          type: 'event',
          date: '2026-07-01',
          startMinute: 600,
          durationMinutes: 30,
          completed: false,
          description: 'Line1\nLine2',
        },
      ];
      const ics = exportToIcs(special);
      expect(ics).toContain('SUMMARY:Review\\; check\\, things');
      expect(ics).toContain('DESCRIPTION:Line1\\nLine2');
    });

    it('includes RRULE for recurring events', () => {
      const recurring: CalendarEvent[] = [
        {
          id: 'rec-1',
          title: 'Weekly',
          type: 'event',
          date: '2026-07-01',
          startMinute: 480,
          durationMinutes: 60,
          completed: false,
          recurring: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3] },
        },
      ];
      const ics = exportToIcs(recurring);
      expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE');
    });

    it('sets custom calendar name', () => {
      const ics = exportToIcs(events, { calendarName: 'My Cal' });
      expect(ics).toContain('X-WR-CALNAME:My Cal');
    });
  });

  describe('mergeIcsImport', () => {
    const existing: CalendarEvent[] = [
      {
        id: 'event-1@google.com',
        title: 'Old Standup',
        type: 'event',
        date: '2026-07-15',
        startMinute: 540,
        durationMinutes: 60,
        completed: false,
      },
    ];

    it('identifies new events', () => {
      const { newEvents, updatedEvents } = mergeIcsImport(SAMPLE_ICS, existing);
      expect(newEvents.length).toBe(2); // event-2, event-3
      expect(updatedEvents.length).toBe(1); // event-1 updated
    });

    it('matches by UID for updates', () => {
      const { updatedEvents } = mergeIcsImport(SAMPLE_ICS, existing);
      expect(updatedEvents[0].id).toBe('event-1@google.com');
      expect(updatedEvents[0].title).toBe('Team Standup');
    });

    it('returns empty arrays for empty ICS', () => {
      const { newEvents, updatedEvents } = mergeIcsImport('', existing);
      expect(newEvents).toHaveLength(0);
      expect(updatedEvents).toHaveLength(0);
    });
  });

  describe('roundtrip', () => {
    it('events survive export then reimport', () => {
      const events: CalendarEvent[] = [
        {
          id: 'rt-1',
          title: 'Roundtrip Test',
          type: 'event',
          date: '2026-08-01',
          startMinute: 600,
          durationMinutes: 90,
          completed: false,
          description: 'Testing roundtrip',
        },
      ];

      const ics = exportToIcs(events, { includeCompleted: true });
      const parsed = parseIcs(ics);

      expect(parsed.count).toBe(1);
      const reimported = parsed.events[0];
      expect(reimported.id).toBe('rt-1');
      expect(reimported.title).toBe('Roundtrip Test');
      expect(reimported.date).toBe('2026-08-01');
      expect(reimported.startMinute).toBe(600);
      expect(reimported.durationMinutes).toBe(90);
      expect(reimported.description).toBe('Testing roundtrip');
    });
  });
});
