/**
 * Timeline service — event scheduling, conflict detection, and filtering.
 */

import type { TimelineEvent, TimelineConflict, TimelineFilter, TimelineFork, TimelineEra } from '../types/timeline';

const EVENTS_KEY = 'bismuth-storyteller-timeline-events';
const ERAS_KEY = 'bismuth-storyteller-timeline-eras';
const FORKS_KEY = 'bismuth-storyteller-timeline-forks';

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadTimelineEvents(): TimelineEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistTimelineEvents(events: TimelineEvent[]): void {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); }
  catch { /* silent */ }
}

export function loadEras(): TimelineEra[] {
  try {
    const raw = localStorage.getItem(ERAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistEras(eras: TimelineEra[]): void {
  try { localStorage.setItem(ERAS_KEY, JSON.stringify(eras)); }
  catch { /* silent */ }
}

export function loadForks(): TimelineFork[] {
  try {
    const raw = localStorage.getItem(FORKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistForks(forks: TimelineFork[]): void {
  try { localStorage.setItem(FORKS_KEY, JSON.stringify(forks)); }
  catch { /* silent */ }
}

// ─── Filtering ──────────────────────────────────────────────────────────────

export function filterTimelineEvents(events: TimelineEvent[], filter: TimelineFilter): TimelineEvent[] {
  let result = events;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(e => e.label.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)));
  }
  if (filter.tracks.length > 0) result = result.filter(e => e.track && filter.tracks.includes(e.track));
  if (filter.eras.length > 0) result = result.filter(e => e.era && filter.eras.includes(e.era));
  if (filter.milestonesOnly) result = result.filter(e => e.isMilestone);
  if (filter.dateRange) {
    const { start, end } = filter.dateRange;
    result = result.filter(e => e.date >= start && e.date <= end);
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Grouping ───────────────────────────────────────────────────────────────

export function groupEvents(events: TimelineEvent[], groupBy: string): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const key = groupBy === 'track' ? (event.track ?? 'Unassigned')
      : groupBy === 'era' ? (event.era ?? 'No Era')
      : 'All';
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

// ─── Conflict detection ─────────────────────────────────────────────────────

export function detectConflicts(events: TimelineEvent[]): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (b.date > (a.endDate ?? a.date)) break;
      if (a.track && b.track && a.track === b.track) {
        conflicts.push({ eventIds: [a.id, b.id], reason: `Overlapping events on track "${a.track}"`, severity: 'warning' });
      }
    }
  }
  return conflicts;
}

// ─── Dependency resolution ──────────────────────────────────────────────────

export function getDependencyChain(events: TimelineEvent[], eventId: string): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const event = events.find(e => e.id === id);
    if (!event) return;
    for (const depId of event.dependsOn) {
      walk(depId);
    }
    chain.push(id);
  }
  walk(eventId);
  return chain;
}

export function createTimelineEvent(entityId: string, label: string, date: string, overrides?: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: crypto.randomUUID(), entityId, label, date,
    isMilestone: false, dependsOn: [], tags: [],
    ...overrides,
  };
}
