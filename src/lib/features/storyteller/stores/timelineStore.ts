/**
 * Timeline store — reactive state for timeline and Gantt views.
 */

import { writable, derived } from 'svelte/store';
import type { TimelineEvent, TimelineEra, TimelineFork, TimelineFilter, TimelineConflict, TimelineMode } from '../types/timeline';
import { DEFAULT_TIMELINE_FILTER } from '../types/timeline';
import * as svc from '../services/timelineService';

export const timelineEvents = writable<TimelineEvent[]>(svc.loadTimelineEvents());
export const timelineEras = writable<TimelineEra[]>(svc.loadEras());
export const timelineForks = writable<TimelineFork[]>(svc.loadForks());
export const timelineFilter = writable<TimelineFilter>({ ...DEFAULT_TIMELINE_FILTER });
export const timelineMode = writable<TimelineMode>('standard');

export const filteredEvents = derived([timelineEvents, timelineFilter], ([$events, $filter]) =>
  svc.filterTimelineEvents($events, $filter),
);

export const groupedEvents = derived([filteredEvents, timelineFilter], ([$events, $filter]) =>
  svc.groupEvents($events, $filter.groupBy),
);

export const timelineConflicts = derived(timelineEvents, ($events) =>
  svc.detectConflicts($events),
);

export const allTracks = derived(timelineEvents, ($events) => {
  const tracks = new Set<string>();
  for (const e of $events) if (e.track) tracks.add(e.track);
  return [...tracks].sort();
});

// ─── Actions ────────────────────────────────────────────────────────────────

export function addTimelineEvent(entityId: string, label: string, date: string, overrides?: Partial<TimelineEvent>): TimelineEvent {
  const event = svc.createTimelineEvent(entityId, label, date, overrides);
  timelineEvents.update(list => {
    const next = [...list, event];
    svc.persistTimelineEvents(next);
    return next;
  });
  return event;
}

export function editTimelineEvent(updated: TimelineEvent): void {
  timelineEvents.update(list => {
    const next = list.map(e => e.id === updated.id ? updated : e);
    svc.persistTimelineEvents(next);
    return next;
  });
}

export function removeTimelineEvent(eventId: string): void {
  timelineEvents.update(list => {
    const next = list.filter(e => e.id !== eventId);
    svc.persistTimelineEvents(next);
    return next;
  });
}

export function addEra(name: string, startDate: string, endDate: string, color: string): TimelineEra {
  const era: TimelineEra = { id: crypto.randomUUID(), name, startDate, endDate, color };
  timelineEras.update(list => {
    const next = [...list, era];
    svc.persistEras(next);
    return next;
  });
  return era;
}

export function removeEra(eraId: string): void {
  timelineEras.update(list => {
    const next = list.filter(e => e.id !== eraId);
    svc.persistEras(next);
    return next;
  });
}

export function addFork(name: string, description = '', parentForkId: string | null = null): TimelineFork {
  const fork: TimelineFork = { id: crypto.randomUUID(), name, parentForkId, eventIds: [], description };
  timelineForks.update(list => {
    const next = [...list, fork];
    svc.persistForks(next);
    return next;
  });
  return fork;
}

export function updateFilter(partial: Partial<TimelineFilter>): void {
  timelineFilter.update(f => ({ ...f, ...partial }));
}

export function resetFilter(): void {
  timelineFilter.set({ ...DEFAULT_TIMELINE_FILTER });
}

export function setTimelineMode(mode: TimelineMode): void {
  timelineMode.set(mode);
}
