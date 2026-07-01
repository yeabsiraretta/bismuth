/**
 * ICS feed service — fetches and parses ICS calendar feeds,
 * converts VEVENT entries to CalendarEvents for display.
 */

import { writable, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { IcsFeedConfig, IcsEvent, CalendarEvent } from '../types';

const STORAGE_KEY = 'bismuth-ics-feeds';
const CACHE_KEY = 'bismuth-ics-cache';

function loadFeeds(): IcsFeedConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function loadCache(): Record<string, CalendarEvent[]> {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

/** Configured ICS feeds. */
export const icsFeeds = writable<IcsFeedConfig[]>(loadFeeds());

/** Cached ICS events keyed by feed ID. */
export const icsEventCache = writable<Record<string, CalendarEvent[]>>(loadCache());

/** All ICS events (flattened from cache). */
export const allIcsEvents = writable<CalendarEvent[]>([]);

// Persist feeds
icsFeeds.subscribe(feeds => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds)); }
  catch (e) { log.warn('Failed to persist ICS feeds', { error: String(e) }); }
});

// Update flattened events when cache changes
icsEventCache.subscribe(cache => {
  const all = Object.values(cache).flat();
  allIcsEvents.set(all);
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch (e) { log.warn('Failed to persist ICS cache', { error: String(e) }); }
});

/** Add a new ICS feed. */
export function addIcsFeed(feed: Omit<IcsFeedConfig, 'id'>): string {
  const id = `ics-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const full: IcsFeedConfig = { ...feed, id };
  icsFeeds.update(feeds => [...feeds, full]);
  log.info('ICS feed added', { id, name: feed.name, url: feed.url });
  return id;
}

/** Remove an ICS feed and its cached events. */
export function removeIcsFeed(id: string): void {
  icsFeeds.update(feeds => feeds.filter(f => f.id !== id));
  icsEventCache.update(cache => {
    const next = { ...cache };
    delete next[id];
    return next;
  });
  log.info('ICS feed removed', { id });
}

/** Update feed config. */
export function updateIcsFeed(id: string, updates: Partial<IcsFeedConfig>): void {
  icsFeeds.update(feeds => feeds.map(f => f.id === id ? { ...f, ...updates } : f));
}

/** Fetch and parse a single ICS feed. */
export async function fetchIcsFeed(feedId: string): Promise<void> {
  const feeds = get(icsFeeds);
  const feed = feeds.find(f => f.id === feedId);
  if (!feed || !feed.enabled) return;

  log.info('Fetching ICS feed', { id: feedId, url: feed.url });

  try {
    const url = feed.url.replace(/^webcal:\/\//, 'https://');
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const icsText = await response.text();
    const events = parseIcsText(icsText);
    const calEvents = events.map(e => icsEventToCalendarEvent(e, feed));

    icsEventCache.update(cache => ({ ...cache, [feedId]: calEvents }));
    updateIcsFeed(feedId, {
      lastFetched: new Date().toISOString(),
      error: undefined,
    });

    log.info('ICS feed fetched', { id: feedId, eventCount: calEvents.length });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    updateIcsFeed(feedId, { error: errorMsg });
    log.error('ICS feed fetch failed', new Error(errorMsg), { feedId });
  }
}

/** Fetch all enabled ICS feeds. */
export async function fetchAllIcsFeeds(): Promise<void> {
  const feeds = get(icsFeeds);
  await Promise.allSettled(
    feeds.filter(f => f.enabled).map(f => fetchIcsFeed(f.id)),
  );
}

/** Parse ICS text into IcsEvent objects. */
export function parseIcsText(icsText: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  const vevents = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split('END:VEVENT')[0];
    const event = parseVEvent(block);
    if (event) events.push(event);
  }

  return events;
}

function parseVEvent(block: string): IcsEvent | null {
  const lines = unfoldIcsLines(block);
  const props = new Map<string, string>();

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).split(';')[0].toUpperCase();
    const val = line.slice(colonIdx + 1).trim();
    props.set(key, val);
  }

  const uid = props.get('UID') ?? '';
  const summary = props.get('SUMMARY') ?? 'Untitled';
  const dtstart = props.get('DTSTART') ?? '';
  if (!dtstart) return null;

  const allDay = dtstart.length === 8;

  return {
    uid,
    summary: unescapeIcs(summary),
    description: props.get('DESCRIPTION') ? unescapeIcs(props.get('DESCRIPTION')!) : undefined,
    location: props.get('LOCATION') ? unescapeIcs(props.get('LOCATION')!) : undefined,
    dtstart,
    dtend: props.get('DTEND'),
    allDay,
    rrule: props.get('RRULE'),
  };
}

/** Unfold ICS continuation lines (lines starting with space/tab). */
function unfoldIcsLines(block: string): string[] {
  const raw = block.split(/\r?\n/);
  const result: string[] = [];
  for (const line of raw) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (result.length > 0) result[result.length - 1] += line.slice(1);
    } else {
      result.push(line);
    }
  }
  return result;
}

function unescapeIcs(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Convert an ICS datetime string to ISO date + minutes from midnight. */
function parseIcsDateTime(dt: string): { date: string; minutes: number | null } {
  if (dt.length === 8) {
    return { date: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`, minutes: null };
  }
  // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const dateStr = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
  const hours = parseInt(dt.slice(9, 11), 10);
  const mins = parseInt(dt.slice(11, 13), 10);
  return { date: dateStr, minutes: hours * 60 + mins };
}

/** Convert an IcsEvent to a CalendarEvent. */
function icsEventToCalendarEvent(ics: IcsEvent, feed: IcsFeedConfig): CalendarEvent {
  const start = parseIcsDateTime(ics.dtstart);
  let durationMinutes: number | null = null;

  if (ics.dtend) {
    const end = parseIcsDateTime(ics.dtend);
    if (start.minutes !== null && end.minutes !== null) {
      durationMinutes = end.minutes - start.minutes;
      if (durationMinutes < 0) durationMinutes += 1440;
    }
  }

  return {
    id: `ics-${feed.id}-${ics.uid}`,
    title: ics.summary,
    type: 'ics',
    date: start.date,
    startMinute: start.minutes,
    durationMinutes,
    color: feed.color,
    completed: false,
    description: ics.description,
    location: ics.location,
    icsFeedId: feed.id,
    readonly: true,
  };
}

/** Auto-sync timer handle. */
let syncTimerId: ReturnType<typeof setInterval> | null = null;

/** Start periodic sync for all ICS feeds. */
export function startIcsSync(): void {
  stopIcsSync();
  void fetchAllIcsFeeds();
  syncTimerId = setInterval(() => { void fetchAllIcsFeeds(); }, 15 * 60 * 1000);
  log.info('ICS sync started');
}

/** Stop periodic sync. */
export function stopIcsSync(): void {
  if (syncTimerId) {
    clearInterval(syncTimerId);
    syncTimerId = null;
  }
}
