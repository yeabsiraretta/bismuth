/**
 * Tests for the ICS feed parser (pure parsing logic, no network).
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { parseIcsText } from '../icsFeed';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART:20240115T100000Z
DTEND:20240115T113000Z
SUMMARY:Team Meeting
DESCRIPTION:Weekly sync
LOCATION:Room 42
UID:evt-001@example.com
END:VEVENT
BEGIN:VEVENT
DTSTART:20240116
DTEND:20240117
SUMMARY:All Day Conference
UID:evt-002@example.com
END:VEVENT
BEGIN:VEVENT
DTSTART:20240120T140000Z
DTEND:20240120T150000Z
SUMMARY:Escaped\\, special\\; chars\\nwith newline
UID:evt-003@example.com
END:VEVENT
END:VCALENDAR`;

describe('parseIcsText', () => {
  it('parses timed events with correct fields', () => {
    const events = parseIcsText(SAMPLE_ICS);
    expect(events.length).toBeGreaterThanOrEqual(3);

    const timed = events.find(e => e.uid === 'evt-001@example.com');
    expect(timed).toBeDefined();
    expect(timed!.summary).toBe('Team Meeting');
    expect(timed!.description).toBe('Weekly sync');
    expect(timed!.location).toBe('Room 42');
    expect(timed!.dtstart).toBe('20240115T100000Z');
    expect(timed!.dtend).toBe('20240115T113000Z');
    expect(timed!.allDay).toBe(false);
  });

  it('parses all-day events', () => {
    const events = parseIcsText(SAMPLE_ICS);
    const allDay = events.find(e => e.uid === 'evt-002@example.com');
    expect(allDay).toBeDefined();
    expect(allDay!.summary).toBe('All Day Conference');
    expect(allDay!.allDay).toBe(true);
    expect(allDay!.dtstart).toBe('20240116');
  });

  it('unescapes ICS special characters', () => {
    const events = parseIcsText(SAMPLE_ICS);
    const escaped = events.find(e => e.uid === 'evt-003@example.com');
    expect(escaped).toBeDefined();
    expect(escaped!.summary).toBe('Escaped, special; chars\nwith newline');
  });

  it('returns empty array for non-ICS content', () => {
    const events = parseIcsText('not an ics file');
    expect(events).toHaveLength(0);
  });

  it('handles events without optional fields', () => {
    const minimal = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20240201T090000
SUMMARY:Minimal
UID:min-1
END:VEVENT
END:VCALENDAR`;
    const events = parseIcsText(minimal);
    expect(events).toHaveLength(1);
    expect(events[0].description).toBeUndefined();
    expect(events[0].location).toBeUndefined();
    expect(events[0].dtend).toBeUndefined();
  });

  it('handles folded (continuation) lines', () => {
    const folded = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20240201T090000
SUMMARY:Very long event title that
 continues on the next line
UID:fold-1
END:VEVENT
END:VCALENDAR`;
    const events = parseIcsText(folded);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Very long event title thatcontinues on the next line');
  });

  it('skips events without DTSTART', () => {
    const noDt = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:No date event
UID:nodt-1
END:VEVENT
END:VCALENDAR`;
    const events = parseIcsText(noDt);
    expect(events).toHaveLength(0);
  });
});
