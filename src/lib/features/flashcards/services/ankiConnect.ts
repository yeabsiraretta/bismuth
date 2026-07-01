/**
 * AnkiConnect service — wraps the AnkiConnect HTTP API (port 8765).
 * All network calls isolated here; components never fetch directly.
 *
 * AnkiConnect reference: https://foosoft.net/projects/anki-connect/
 * Only uses localhost — never makes calls to external servers.
 */

import { get } from 'svelte/store';
import type { Flashcard, CardSyncResult, SyncResult, AnkiConnectionStatus } from '../types/flashcard';
import { log } from '@/utils/logger';
import { settings } from '@/features/settings';

/** A note imported from Anki — raw fields before conversion to Flashcard. */
export interface AnkiImportedNote {
  noteId: number;
  modelName: string;
  fields: Record<string, { value: string }>;
  tags: string[];
}

const ANKI_VERSION = 6;

function getAnkiUrl(): string {
  const port = get(settings).ankiConnectPort ?? 8765;
  return `http://127.0.0.1:${port}`;
}

// ─── Low-level transport ─────────────────────────────────────────────────────

async function ankiRequest<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const body = JSON.stringify({ action, version: ANKI_VERSION, params });
  const res = await fetch(getAnkiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`AnkiConnect HTTP ${res.status}`);
  const json = await res.json() as { error: string | null; result: T };
  if (json.error) throw new Error(json.error);
  return json.result;
}

// ─── Connection ───────────────────────────────────────────────────────────────

export async function checkConnection(): Promise<AnkiConnectionStatus> {
  try {
    const version = await ankiRequest<number>('version');
    if (version < ANKI_VERSION) {
      log.warn('AnkiConnect version too old', { version });
    }
    return 'connected';
  } catch (err) {
    const msg = String(err);
    if (msg.includes('permission') || msg.includes('403')) return 'permission-denied';
    return 'unreachable';
  }
}

// ─── Deck management ──────────────────────────────────────────────────────────

export async function ensureDeck(deckName: string): Promise<void> {
  await ankiRequest('createDeck', { deck: deckName });
}

// ─── Note model management ────────────────────────────────────────────────────

const MODEL_BASIC = 'BismuthBasic';
const MODEL_REVERSED = 'BismuthReversed';
const MODEL_CLOZE = 'BismuthCloze';

async function ensureModels(): Promise<void> {
  const existing = await ankiRequest<string[]>('modelNames');
  const css = `.card { font-family: var(--font-text, system-ui); font-size: 18px; padding: 16px; background: #fff; color: #1a1a1a; }
.front { font-weight: 600; } .back { margin-top: 12px; } .bismuth-tag { font-size: 11px; color: #888; }`;

  if (!existing.includes(MODEL_BASIC)) {
    await ankiRequest('createModel', {
      modelName: MODEL_BASIC,
      inOrderFields: ['Front', 'Back', 'SourcePath'],
      css,
      isCloze: false,
      cardTemplates: [{
        Name: 'Card',
        Front: '<div class="front">{{Front}}</div>',
        Back: '<div class="front">{{Front}}</div><hr><div class="back">{{Back}}</div>',
      }],
    });
  }

  if (!existing.includes(MODEL_REVERSED)) {
    await ankiRequest('createModel', {
      modelName: MODEL_REVERSED,
      inOrderFields: ['Front', 'Back', 'SourcePath'],
      css,
      isCloze: false,
      cardTemplates: [
        { Name: 'Forward', Front: '<div class="front">{{Front}}</div>', Back: '<div class="front">{{Front}}</div><hr><div class="back">{{Back}}</div>' },
        { Name: 'Reverse', Front: '<div class="front">{{Back}}</div>', Back: '<div class="front">{{Back}}</div><hr><div class="back">{{Front}}</div>' },
      ],
    });
  }

  if (!existing.includes(MODEL_CLOZE)) {
    await ankiRequest('createModel', {
      modelName: MODEL_CLOZE,
      inOrderFields: ['Text', 'SourcePath'],
      css,
      isCloze: true,
      cardTemplates: [{
        Name: 'Cloze',
        Front: '{{cloze:Text}}',
        Back: '{{cloze:Text}}',
      }],
    });
  }
}

// ─── Card sync ────────────────────────────────────────────────────────────────

function cardToNote(card: Flashcard) {
  const modelName = card.type === 'cloze' ? MODEL_CLOZE : card.type === 'basic-reversed' ? MODEL_REVERSED : MODEL_BASIC;
  const fields = card.type === 'cloze'
    ? { Text: card.front, SourcePath: card.sourcePath }
    : { Front: card.front, Back: card.back ?? '', SourcePath: card.sourcePath };
  return { deckName: card.deck, modelName, fields, tags: card.tags };
}

export async function syncCards(cards: Flashcard[]): Promise<SyncResult> {
  const results: CardSyncResult[] = [];
  let created = 0, updated = 0, skipped = 0, errors = 0;

  await ensureModels();

  for (const card of cards) {
    const note = cardToNote(card);
    try {
      await ensureDeck(card.deck);

      if (card.ankiNoteId !== null) {
        // Update existing note fields
        await ankiRequest('updateNoteFields', {
          note: { id: card.ankiNoteId, fields: note.fields },
        });
        await ankiRequest('updateNoteTags', {
          note: card.ankiNoteId,
          tags: card.tags.join(' '),
        });
        updated++;
        results.push({ cardId: card.id, action: 'updated', ankiNoteId: card.ankiNoteId });
      } else {
        const noteId = await ankiRequest<number>('addNote', { note: { ...note, options: { allowDuplicate: false } } });
        if (noteId) {
          created++;
          results.push({ cardId: card.id, action: 'created', ankiNoteId: noteId });
        } else {
          skipped++;
          results.push({ cardId: card.id, action: 'skipped' });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn('AnkiConnect: failed to sync card', { cardId: card.id, err: msg });
      errors++;
      results.push({ cardId: card.id, action: 'error', error: msg });
    }
  }

  return {
    syncedAt: new Date().toISOString(),
    created,
    updated,
    skipped,
    errors,
    results,
  };
}

export async function getAnkiNoteIds(cards: Flashcard[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    // Find existing notes by searching for SourcePath field
    const paths = [...new Set(cards.map(c => c.sourcePath))];
    for (const path of paths) {
      const noteIds = await ankiRequest<number[]>('findNotes', { query: `SourcePath:${path}` });
      if (noteIds.length > 0) {
        const infos = await ankiRequest<Array<{ noteId: number; fields: Record<string, { value: string }> }>>('notesInfo', { notes: noteIds });
        for (const info of infos) {
          const front = info.fields['Front']?.value ?? info.fields['Text']?.value ?? '';
          const card = cards.find(c => c.sourcePath === path && (c.front === front || c.front.startsWith(front.slice(0, 20))));
          if (card) map.set(card.id, info.noteId);
        }
      }
    }
  } catch (err) {
    log.warn('AnkiConnect: failed to fetch existing note IDs', { err });
  }
  return map;
}

// ─── Import from Anki ─────────────────────────────────────────────────────────

/**
 * Fetches all Bismuth-managed notes from Anki and converts them to Flashcard objects.
 * Only retrieves notes with the `bismuth` tag — never touches other Anki notes.
 */
export async function importFromAnki(): Promise<Flashcard[]> {
  const noteIds = await ankiRequest<number[]>('findNotes', { query: 'tag:bismuth' });
  if (noteIds.length === 0) return [];

  const infos = await ankiRequest<Array<{
    noteId: number;
    modelName: string;
    fields: Record<string, { value: string }>;
    tags: string[];
  }>>('notesInfo', { notes: noteIds });

  const imported: Flashcard[] = [];
  for (const info of infos) {
    const sourcePath = info.fields['SourcePath']?.value ?? '';
    const tags = info.tags.filter(t => t !== 'bismuth');

    if (info.modelName === 'BismuthCloze') {
      const front = info.fields['Text']?.value ?? '';
      if (!front) continue;
      let h = 0;
      for (let i = 0; i < front.length; i++) h = (Math.imul(31, h) + front.charCodeAt(i)) | 0;
      imported.push({
        id: `anki-${info.noteId}`,
        type: 'cloze',
        front,
        tags: [...tags, 'bismuth'],
        deck: 'Bismuth',
        sourcePath,
        sourceLine: 0,
        ankiNoteId: info.noteId,
      });
    } else {
      const front = info.fields['Front']?.value ?? '';
      const back = info.fields['Back']?.value ?? '';
      if (!front) continue;
      imported.push({
        id: `anki-${info.noteId}`,
        type: info.modelName === 'BismuthReversed' ? 'basic-reversed' : 'basic',
        front,
        back: back || undefined,
        tags: [...tags, 'bismuth'],
        deck: 'Bismuth',
        sourcePath,
        sourceLine: 0,
        ankiNoteId: info.noteId,
      });
    }
  }

  log.info('AnkiConnect: imported notes', { count: imported.length });
  return imported;
}
