/**
 * Flashcard store — card scanning, sync state, and AnkiConnect status.
 * All AnkiConnect calls delegated to services/ankiConnect.ts.
 */

import { writable, derived, get } from 'svelte/store';
import type { Flashcard, FlashcardState, SyncResult } from '../types/flashcard';
import { checkConnection, syncCards, getAnkiNoteIds, importFromAnki } from '../services/ankiConnect';
import { parseAllCards } from '../services/studyParser';
import { log } from '@/utils/logger';

const initial: FlashcardState = {
  connectionStatus: 'unknown',
  lastSyncAt: null,
  lastSyncResult: null,
  syncing: false,
  scanning: false,
  scannedCards: [],
  error: null,
};

const _store = writable<FlashcardState>(initial);

export const flashcardState = { subscribe: _store.subscribe };

export const connectionStatus = derived(_store, s => s.connectionStatus);
export const scannedCards = derived(_store, s => s.scannedCards);
export const isSyncing = derived(_store, s => s.syncing);
export const isScanning = derived(_store, s => s.scanning);
export const lastSyncResult = derived(_store, s => s.lastSyncResult);
export const flashcardError = derived(_store, s => s.error);
export const cardCount = derived(_store, s => s.scannedCards.length);

/** Ping AnkiConnect and update connection status. */
export async function pingAnki(): Promise<void> {
  const status = await checkConnection();
  _store.update(s => ({ ...s, connectionStatus: status }));
  if (status !== 'connected') {
    log.info('AnkiConnect status', { status });
  }
}

/** Scan a single note's content and return its cards (does not update store). */
export function scanNote(notePath: string, content: string): Flashcard[] {
  return parseAllCards(notePath, content);
}

/** Scan the active note and cache results in the store. */
export function scanActiveNote(notePath: string, content: string): void {
  _store.update(s => ({ ...s, scanning: true, error: null }));
  try {
    const cards = parseAllCards(notePath, content);
    _store.update(s => ({ ...s, scanning: false, scannedCards: cards }));
    log.debug('Flashcard scan complete', { notePath, count: cards.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update(s => ({ ...s, scanning: false, error: msg }));
    log.error('Flashcard scan failed', err as Error);
  }
}

/**
 * Scan pre-loaded topic note contents for a course and aggregate cards into the store.
 * The caller provides note content — this keeps the store free of vault service imports
 * per architecture constitution §Layer Boundaries (stores MUST NOT call services/vault).
 */
export function scanCourse(courseFolderPath: string, notes: Array<{ path: string; content: string }>): void {
  _store.update(s => ({ ...s, scanning: true, error: null }));
  const allCards: Flashcard[] = [];
  for (const { path, content } of notes) {
    try {
      const cards = parseAllCards(path, content);
      allCards.push(...cards);
    } catch {
      // Skip notes that fail to parse
    }
  }
  _store.update(s => ({ ...s, scanning: false, scannedCards: allCards }));
  log.info('Course scan complete', { folder: courseFolderPath, total: allCards.length });
}

/** Sync scanned cards to Anki. Must call scanActiveNote first. */
export async function syncToAnki(): Promise<SyncResult | null> {
  const state = get(_store);
  if (state.connectionStatus !== 'connected') {
    await pingAnki();
    if (get(_store).connectionStatus !== 'connected') {
      _store.update(s => ({ ...s, error: 'Anki is not reachable. Make sure Anki is running with AnkiConnect installed.' }));
      return null;
    }
  }

  const cards = state.scannedCards;
  if (cards.length === 0) return null;

  _store.update(s => ({ ...s, syncing: true, error: null }));
  try {
    // Hydrate existing Anki note IDs before sync
    const idMap = await getAnkiNoteIds(cards);
    const hydratedCards = cards.map(c => ({ ...c, ankiNoteId: idMap.get(c.id) ?? null }));
    _store.update(s => ({ ...s, scannedCards: hydratedCards }));

    const result = await syncCards(hydratedCards);
    _store.update(s => ({
      ...s,
      syncing: false,
      lastSyncAt: result.syncedAt,
      lastSyncResult: result,
    }));
    log.info('Flashcard sync complete', { created: result.created, updated: result.updated, errors: result.errors });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update(s => ({ ...s, syncing: false, error: msg }));
    log.error('Flashcard sync failed', err as Error);
    return null;
  }
}

/** Clear scanned cards and reset error state. */
export function clearCards(): void {
  _store.update(s => ({ ...s, scannedCards: [], error: null, lastSyncResult: null }));
}

/**
 * Import all Bismuth-tagged notes from Anki into the scanned cards store.
 * Merges with existing scanned cards, deduplicating by ankiNoteId.
 */
export async function importCardsFromAnki(): Promise<number> {
  const state = get(_store);
  if (state.connectionStatus !== 'connected') {
    await pingAnki();
    if (get(_store).connectionStatus !== 'connected') {
      _store.update(s => ({ ...s, error: 'Anki is not reachable. Make sure Anki is running with AnkiConnect installed.' }));
      return 0;
    }
  }

  _store.update(s => ({ ...s, scanning: true, error: null }));
  try {
    const imported = await importFromAnki();
    // Merge: keep existing scanned cards, append imported ones that aren't already present
    const existing = get(_store).scannedCards;
    const existingNoteIds = new Set(existing.map(c => c.ankiNoteId).filter(Boolean));
    const newCards = imported.filter(c => c.ankiNoteId !== null && !existingNoteIds.has(c.ankiNoteId));
    _store.update(s => ({ ...s, scanning: false, scannedCards: [...s.scannedCards, ...newCards] }));
    log.info('Imported cards from Anki', { count: newCards.length });
    return newCards.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update(s => ({ ...s, scanning: false, error: msg }));
    log.error('Import from Anki failed', err as Error);
    return 0;
  }
}
