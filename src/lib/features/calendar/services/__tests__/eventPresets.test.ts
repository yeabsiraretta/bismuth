import { describe, it, expect } from 'vitest';
import { createEventFromPreset, presetToFrontmatter } from '../eventPresets';
import type { EventPreset } from '../../types/prisma';

const meetingPreset: EventPreset = {
  id: 'preset-meeting',
  name: 'Meeting',
  defaults: { type: 'event', durationMinutes: 60 },
  frontmatter: { Status: 'Scheduled', AllDay: false },
  icon: 'users',
  categoryId: 'work',
};

const allDayPreset: EventPreset = {
  id: 'preset-allday',
  name: 'All-Day Event',
  defaults: { type: 'event', startMinute: null, durationMinutes: null },
  frontmatter: { AllDay: true },
  icon: 'calendar',
};

describe('createEventFromPreset', () => {
  it('creates event with preset defaults', () => {
    const event = createEventFromPreset(meetingPreset, '2025-06-15', 540, 'Standup');
    expect(event.title).toBe('Standup');
    expect(event.date).toBe('2025-06-15');
    expect(event.startMinute).toBe(540);
    expect(event.durationMinutes).toBe(60);
    expect(event.type).toBe('event');
    expect(event.categoryId).toBe('work');
    expect(event.id).toMatch(/^ev_/);
  });

  it('uses preset name as fallback title', () => {
    const event = createEventFromPreset(meetingPreset, '2025-06-15');
    expect(event.title).toBe('Meeting');
  });

  it('handles all-day preset', () => {
    const event = createEventFromPreset(allDayPreset, '2025-06-15');
    expect(event.startMinute).toBeNull();
    expect(event.durationMinutes).toBeNull();
  });
});

describe('presetToFrontmatter', () => {
  it('generates YAML frontmatter string', () => {
    const fm = presetToFrontmatter(meetingPreset, '2025-06-15', 540, 'Standup');
    expect(fm).toContain('---');
    expect(fm).toContain('title: "Standup"');
    expect(fm).toContain('Date: "2025-06-15"');
    expect(fm).toContain('Start: "2025-06-15T09:00"');
    expect(fm).toContain('End: "2025-06-15T10:00"');
    expect(fm).toContain('Status: "Scheduled"');
  });

  it('omits Start/End for null startMinute', () => {
    const fm = presetToFrontmatter(allDayPreset, '2025-06-15', null, 'Holiday');
    expect(fm).not.toContain('Start:');
    expect(fm).not.toContain('End:');
    expect(fm).toContain('AllDay: true');
  });
});
