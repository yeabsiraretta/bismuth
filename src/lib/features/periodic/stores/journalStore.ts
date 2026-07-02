/**
 * Journal store — registry, active journal, shelf filtering, CRUD, persistence.
 */

import { writable, derived, get } from 'svelte/store';
import { openNote } from '@/appNavigation';
import { log } from '@/utils/logger';
import type { JournalConfig, JournalShelf, PeriodicSettings } from '../types';
import { DEFAULT_PERIODIC_SETTINGS } from '../types/defaults';
import { createJournalNote, navigatePeriod, resolveNotePath } from '../services/journalService';
import { generatePrefixedId } from '@/utils/id';

const STORAGE_KEY = 'bismuth-journal-settings';

// ─── Settings Persistence ─────────────────────────────────────────────────

function loadSettings(): PeriodicSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PERIODIC_SETTINGS, ...parsed };
    }
  } catch (e) {
    log.warn('Failed to load journal settings', { error: String(e) });
  }
  return { ...DEFAULT_PERIODIC_SETTINGS };
}

/** All journal/periodic settings. */
export const journalSettings = writable<PeriodicSettings>(loadSettings());

// Persist on change
journalSettings.subscribe((settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    log.warn('Failed to persist journal settings', { error: String(e) });
  }
});

// ─── UI State ─────────────────────────────────────────────────────────────

/** The currently selected journal ID */
export const activeJournalId = writable<string>('daily');

/** The currently viewed date */
export const activeJournalDate = writable<Date>(new Date());

/** Active shelf filter (null = show all) */
export const activeShelfId = writable<string | null>(null);

/** Loading state */
export const journalLoading = writable(false);

// ─── Derived Stores ───────────────────────────────────────────────────────

/** All journal definitions */
export const journals = derived(journalSettings, ($s) => $s.journals);

/** All shelves */
export const shelves = derived(journalSettings, ($s) => $s.shelves);

/** Whether shelves are enabled */
export const shelvesEnabled = derived(journalSettings, ($s) => $s.shelvesEnabled);

/** The active journal config */
export const activeJournal = derived(
  [journals, activeJournalId],
  ([$journals, $id]) => $journals.find((j) => j.id === $id) ?? $journals[0] ?? null
);

/** Journals filtered by active shelf */
export const filteredJournals = derived(
  [journals, activeShelfId, shelvesEnabled],
  ([$journals, $shelfId, $enabled]) => {
    if (!$enabled || !$shelfId) return $journals;
    return $journals.filter((j) => j.shelfId === $shelfId);
  }
);

/** Journals grouped by type for quick access */
export const journalsByType = derived(journals, ($journals) => {
  const map = new Map<string, JournalConfig[]>();
  for (const j of $journals) {
    const key = j.type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(j);
  }
  return map;
});

// ─── Journal CRUD ─────────────────────────────────────────────────────────

/** Add a new journal. */
export function addJournal(journal: Omit<JournalConfig, 'id'>): string {
  const id = generatePrefixedId('jrn');
  const full: JournalConfig = { ...journal, id };

  journalSettings.update((s) => ({
    ...s,
    journals: [...s.journals, full],
  }));

  log.info('Journal added', { id, name: journal.name });
  return id;
}

/** Update an existing journal. */
export function updateJournal(id: string, updates: Partial<JournalConfig>): void {
  journalSettings.update((s) => ({
    ...s,
    journals: s.journals.map((j) => (j.id === id ? { ...j, ...updates } : j)),
  }));
}

/** Delete a journal. */
export function deleteJournal(id: string): void {
  journalSettings.update((s) => ({
    ...s,
    journals: s.journals.filter((j) => j.id !== id),
  }));
  log.info('Journal deleted', { id });
}

// ─── Shelf CRUD ───────────────────────────────────────────────────────────

/** Add a new shelf. */
export function addShelf(name: string): string {
  const id = generatePrefixedId('shelf');
  journalSettings.update((s) => ({
    ...s,
    shelves: [...s.shelves, { id, name, order: s.shelves.length }],
  }));
  log.info('Shelf added', { id, name });
  return id;
}

/** Update a shelf. */
export function updateShelf(id: string, updates: Partial<JournalShelf>): void {
  journalSettings.update((s) => ({
    ...s,
    shelves: s.shelves.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh)),
  }));
}

/** Delete a shelf and unassign its journals. */
export function deleteShelf(id: string): void {
  journalSettings.update((s) => ({
    ...s,
    shelves: s.shelves.filter((sh) => sh.id !== id),
    journals: s.journals.map((j) => (j.shelfId === id ? { ...j, shelfId: null } : j)),
  }));
  log.info('Shelf deleted', { id });
}

// ─── Actions ──────────────────────────────────────────────────────────────

/** Open or create a journal note for the active date. */
export async function openActiveJournalNote(): Promise<string | null> {
  const journal = get(activeJournal);
  if (!journal) {
    log.warn('No active journal to open');
    return null;
  }

  const date = get(activeJournalDate);
  journalLoading.set(true);

  try {
    const result = await createJournalNote(date, journal);
    await openNote(result.path);
    log.info('Journal note opened', { path: result.path, journal: journal.name });
    return result.path;
  } catch (err) {
    log.error('Failed to open journal note', err as Error);
    return null;
  } finally {
    journalLoading.set(false);
  }
}

/** Open today's daily note. */
export async function openTodaysDailyNote(): Promise<string | null> {
  const allJournals = get(journals);
  const daily = allJournals.find((j) => j.type === 'daily') ?? allJournals[0];
  if (!daily) return null;

  journalLoading.set(true);
  try {
    const result = await createJournalNote(new Date(), daily);
    await openNote(result.path);
    return result.path;
  } catch (err) {
    log.error('Failed to open daily note', err as Error);
    return null;
  } finally {
    journalLoading.set(false);
  }
}

/** Navigate the active date forward or backward. */
export function navigateJournal(direction: 'next' | 'prev'): void {
  const journal = get(activeJournal);
  if (!journal) return;

  const current = get(activeJournalDate);
  const next = navigatePeriod(current, journal, direction);
  activeJournalDate.set(next);
}

/** Jump to today. */
export function goToJournalToday(): void {
  activeJournalDate.set(new Date());
}

/** Get the resolved path for a journal note (without creating it). */
export function getJournalNotePath(date: Date, journalId: string): string | null {
  const allJournals = get(journals);
  const journal = allJournals.find((j) => j.id === journalId);
  if (!journal) return null;
  return resolveNotePath(date, journal);
}
