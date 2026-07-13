/**
 * Flashcard store — reactive state for card scanning, review records, and study sessions.
 * Uses Svelte 5 $state runes and localStorage persistence.
 */

import { FLASHCARD_EVENTS_KEY, FLASHCARD_REVIEWS_KEY } from '@/constants/storage-keys';
import { parseAllCards } from '@/hubs/knowledge/services/flashcard-parser';
import {
  deserializeEvents,
  deserializeRecords,
  getDueCards,
  gradeCardWithAlgorithm,
  serializeEvents,
  serializeRecords,
} from '@/hubs/knowledge/services/flashcard-scheduler';
import { buildDeckTree, computeStats } from '@/hubs/knowledge/services/flashcard-stats';
import type {
  DeckNode,
  Flashcard,
  FlashcardStats,
  ReviewEvent,
  ReviewGrade,
  ReviewRecord,
  SchedulerAlgorithm,
} from '@/hubs/knowledge/types/flashcard-types';
import { log } from '@/utils/log/logger';

const fcLog = log.child('flashcard-store');

let scannedCards = $state<Flashcard[]>([]);
let scanning = $state(false);
let error = $state<string | null>(null);
let reviewRecords = $state<Map<string, ReviewRecord>>(new Map());
let reviewEvents = $state<ReviewEvent[]>([]);

function loadPersisted(): void {
  try {
    const raw = localStorage.getItem(FLASHCARD_REVIEWS_KEY);
    if (raw) reviewRecords = deserializeRecords(raw);
    const evRaw = localStorage.getItem(FLASHCARD_EVENTS_KEY);
    if (evRaw) reviewEvents = deserializeEvents(evRaw);
  } catch (e) {
    fcLog.warn('Failed to load persisted flashcard data', { error: e });
  }
}

function persistRecords(): void {
  localStorage.setItem(FLASHCARD_REVIEWS_KEY, serializeRecords(reviewRecords));
}

function persistEvents(): void {
  localStorage.setItem(FLASHCARD_EVENTS_KEY, serializeEvents(reviewEvents));
}

export function initFlashcardStore(): void {
  loadPersisted();
  fcLog.info('Flashcard store initialized', {
    records: reviewRecords.size,
    events: reviewEvents.length,
  });
}

export function getScannedCards(): Flashcard[] {
  return scannedCards;
}
function getCardCount(): number {
  return scannedCards.length;
}
function isScanning(): boolean {
  return scanning;
}
function getFlashcardError(): string | null {
  return error;
}
function getReviewRecords(): Map<string, ReviewRecord> {
  return reviewRecords;
}
function getReviewEvents(): ReviewEvent[] {
  return reviewEvents;
}

export function getDueCardList(): Flashcard[] {
  return getDueCards(scannedCards, reviewRecords);
}

export function getDeckTree(): DeckNode {
  return buildDeckTree(scannedCards, reviewRecords);
}

export function getStats(): FlashcardStats {
  return computeStats(scannedCards, reviewRecords, reviewEvents);
}

function scanNote(notePath: string, content: string): void {
  scanning = true;
  error = null;
  try {
    scannedCards = parseAllCards(notePath, content);
    fcLog.debug('Scanned note for flashcards', { notePath, count: scannedCards.length });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    fcLog.error('Flashcard scan failed', e as Error);
  } finally {
    scanning = false;
  }
}

export function scanMultipleNotes(notes: Array<{ path: string; content: string }>): void {
  scanning = true;
  error = null;
  const allCards: Flashcard[] = [];
  for (const { path, content } of notes) {
    try {
      allCards.push(...parseAllCards(path, content));
    } catch {
      /* skip notes that fail */
    }
  }
  scannedCards = allCards;
  scanning = false;
  fcLog.info('Multi-note scan complete', { notes: notes.length, cards: allCards.length });
}

export function gradeFlashcard(
  cardId: string,
  grade: ReviewGrade,
  algorithm: SchedulerAlgorithm = 'sm2'
): ReviewRecord {
  const existing = reviewRecords.get(cardId) ?? null;
  const updated = gradeCardWithAlgorithm(existing, cardId, grade, algorithm);
  reviewRecords = new Map(reviewRecords).set(cardId, updated);
  reviewEvents = [
    ...reviewEvents,
    {
      cardId,
      grade,
      timestamp: new Date().toISOString(),
      intervalDays: updated.intervalDays,
      algorithm,
    },
  ];
  persistRecords();
  persistEvents();
  return updated;
}

function clearCards(): void {
  scannedCards = [];
  error = null;
}

function resetReviewData(): void {
  reviewRecords = new Map();
  reviewEvents = [];
  persistRecords();
  persistEvents();
  fcLog.info('Review data reset');
}
