import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { currentVault } from '@/stores/vault/vault';
import type { PeriodType } from '../types';

interface PeriodicNoteResult {
  path: string;
  created: boolean;
}

/**
 * Opens or creates a periodic note for the given date and period type.
 * If the note doesn't exist, creates it from the configured template.
 */
export async function openOrCreatePeriodicNote(
  date: string,
  periodType: PeriodType
): Promise<PeriodicNoteResult> {
  log.info('Periodic notes: opening/creating', { date, periodType });
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');
  try {
    return await invoke<PeriodicNoteResult>('open_or_create_periodic_note', {
      vaultRoot: vault.root_path,
      periodType,
      dateStr: date,
    });
  } catch (error) {
    log.error('Periodic notes: failed to open/create', error as Error, { date, periodType });
    throw new Error(`Failed to open periodic note: ${error}`);
  }
}

/**
 * Gets periodic notes for a date range (used by calendar view).
 */
export async function getPeriodicNotesForRange(
  startDate: string,
  endDate: string,
  periodType: PeriodType
): Promise<string[]> {
  log.debug('Periodic notes: fetching range', { startDate, endDate, periodType });
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');
  try {
    return await invoke<string[]>('get_periodic_notes_for_range', {
      vaultRoot: vault.root_path,
      periodType,
      startDate,
      endDate,
    });
  } catch (error) {
    log.error('Periodic notes: failed to fetch range', error as Error);
    throw new Error(`Failed to get periodic notes: ${error}`);
  }
}

/**
 * Gets the path where a periodic note would be located for a given date.
 * Does not create the file.
 */
export function getPeriodicNotePath(date: string, periodType: PeriodType): string {
  return `Periodic Notes/${periodType}/${date}.md`;
}
