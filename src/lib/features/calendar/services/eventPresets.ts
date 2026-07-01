/**
 * Event Presets — reusable event templates with pre-filled
 * frontmatter for rapid event creation.
 */
import { writable, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { generatePrefixedId } from '@/utils/id';
import type { CalendarEvent } from '../types';
import type { EventPreset } from '../types/prisma';

// ─── Store ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bismuth-event-presets';

function loadPresets(): EventPreset[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : defaultPresets();
  } catch {
    return defaultPresets();
  }
}

export const eventPresets = writable<EventPreset[]>(loadPresets());
eventPresets.subscribe((p) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (e) {
    log.warn('Failed to persist presets', { error: String(e) });
  }
});

// ─── Default presets ─────────────────────────────────────────────────────────

function defaultPresets(): EventPreset[] {
  return [
    {
      id: 'preset-meeting',
      name: 'Meeting',
      defaults: { type: 'event', durationMinutes: 60 },
      frontmatter: { Status: 'Scheduled', AllDay: false },
      icon: 'users',
      categoryId: 'work',
    },
    {
      id: 'preset-focus',
      name: 'Focus Block',
      defaults: { type: 'time-block', durationMinutes: 120 },
      frontmatter: { Status: 'In Progress', AllDay: false },
      icon: 'target',
      categoryId: 'work',
    },
    {
      id: 'preset-allday',
      name: 'All-Day Event',
      defaults: { type: 'event', startMinute: null, durationMinutes: null },
      frontmatter: { AllDay: true },
      icon: 'calendar',
    },
    {
      id: 'preset-deadline',
      name: 'Deadline',
      defaults: { type: 'event', startMinute: null, durationMinutes: null },
      frontmatter: { Status: 'Pending', AllDay: true },
      icon: 'alert-triangle',
      categoryId: 'work',
    },
  ];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Create a new event from a preset */
export function createEventFromPreset(
  preset: EventPreset,
  date: string,
  startMinute: number | null = null,
  title: string = ''
): CalendarEvent {
  return {
    id: generatePrefixedId('ev'),
    title: title || preset.name,
    type: preset.defaults.type ?? 'event',
    date,
    startMinute: startMinute ?? preset.defaults.startMinute ?? null,
    durationMinutes: preset.defaults.durationMinutes ?? null,
    completed: false,
    categoryId: preset.categoryId,
    ...preset.defaults,
  };
}

/** Generate frontmatter YAML for a preset */
export function presetToFrontmatter(
  preset: EventPreset,
  date: string,
  startMinute: number | null,
  title: string
): string {
  const fm: Record<string, unknown> = { ...preset.frontmatter };
  fm['title'] = title || preset.name;
  fm['Date'] = date;
  if (startMinute !== null) {
    const hours = String(Math.floor(startMinute / 60)).padStart(2, '0');
    const mins = String(startMinute % 60).padStart(2, '0');
    fm['Start'] = `${date}T${hours}:${mins}`;
    if (preset.defaults.durationMinutes) {
      const endMin = startMinute + preset.defaults.durationMinutes;
      const eh = String(Math.floor(endMin / 60)).padStart(2, '0');
      const em = String(endMin % 60).padStart(2, '0');
      fm['End'] = `${date}T${eh}:${em}`;
    }
  }
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** Add a custom preset */
export function addPreset(preset: Omit<EventPreset, 'id'>): string {
  const id = generatePrefixedId('preset');
  eventPresets.update((p) => [...p, { ...preset, id }]);
  log.info('Event preset added', { id, name: preset.name });
  return id;
}

/** Remove a preset */
export function removePreset(id: string): void {
  eventPresets.update((p) => p.filter((pr) => pr.id !== id));
}

/** Update a preset */
export function updatePreset(id: string, updates: Partial<EventPreset>): void {
  eventPresets.update((p) => p.map((pr) => (pr.id === id ? { ...pr, ...updates } : pr)));
}

/** Reset to default presets */
export function resetPresets(): void {
  eventPresets.set(defaultPresets());
}

/** Get a preset by ID */
export function getPreset(id: string): EventPreset | undefined {
  return get(eventPresets).find((p) => p.id === id);
}
