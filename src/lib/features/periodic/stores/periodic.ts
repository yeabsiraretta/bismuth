import { writable, derived, get } from 'svelte/store';
import { openOrCreatePeriodicNote, getPeriodicNotesForRange } from '../services/periodic';
import { openNote } from '@/appNavigation';
import type { PeriodType, PeriodicSettings } from '../types';
import { DEFAULT_PERIODIC_SETTINGS } from '../types/defaults';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-periodic-settings';

function loadSettings(): PeriodicSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PERIODIC_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {
    log.warn('Failed to load periodic settings from localStorage', { error: String(e) });
  }
  return { ...DEFAULT_PERIODIC_SETTINGS };
}

/** Periodic notes settings (folder paths, templates, date formats per type) */
export const periodicSettings = writable<PeriodicSettings>(loadSettings());

/** The currently viewed period type */
export const activePeriodType = writable<PeriodType>('daily');

/** The currently viewed date (ISO string YYYY-MM-DD) */
export const activeDate = writable<string>(new Date().toISOString().slice(0, 10));

/** Notes found for the current calendar range */
export const periodicNotesInRange = writable<string[]>([]);

/** Loading state */
export const periodicLoading = writable(false);

/** Derived: today's date string */
export const todayString = derived(activeDate, () => new Date().toISOString().slice(0, 10));

/** Navigate to the previous period */
export function navigatePrevious(): void {
  const type = get(activePeriodType);
  const date = new Date(get(activeDate));
  switch (type) {
    case 'daily':
      date.setDate(date.getDate() - 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() - 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() - 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() - 1);
      break;
  }
  activeDate.set(date.toISOString().slice(0, 10));
}

/** Navigate to the next period */
export function navigateNext(): void {
  const type = get(activePeriodType);
  const date = new Date(get(activeDate));
  switch (type) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  activeDate.set(date.toISOString().slice(0, 10));
}

/** Navigate to today */
export function navigateToday(): void {
  activeDate.set(new Date().toISOString().slice(0, 10));
}

/** Open or create the periodic note for the currently selected date/type */
export async function openCurrentPeriodNote(): Promise<string> {
  const type = get(activePeriodType);
  const date = get(activeDate);

  periodicLoading.set(true);
  try {
    const result = await openOrCreatePeriodicNote(date, type);
    log.info('Periodic note opened', { path: result.path, type });
    await openNote(result.path);
    return result.path;
  } finally {
    periodicLoading.set(false);
  }
}

/** Open today's daily note (bottom button action) */
export async function openDailyNote(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  periodicLoading.set(true);
  try {
    const result = await openOrCreatePeriodicNote(today, 'daily');
    log.info('Daily note opened', { path: result.path });
    await openNote(result.path);
    return result.path;
  } finally {
    periodicLoading.set(false);
  }
}

/** Fetch periodic notes for a month (used by calendar highlighting) */
export async function fetchNotesForMonth(year: number, month: number): Promise<void> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  try {
    const notes = await getPeriodicNotesForRange(startDate, endDate, 'daily');
    periodicNotesInRange.set(notes);
  } catch {
    periodicNotesInRange.set([]);
  }
}

/** Persist settings on change */
periodicSettings.subscribe((settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    log.warn('Failed to persist periodic settings to localStorage', { error: String(e) });
  }
});
