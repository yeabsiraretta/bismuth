/**
 * Anki sync service — pulls flashcards from Anki via AnkiConnect API
 * and backs them up as markdown files in the vault.
 *
 * AnkiConnect must be running (Anki desktop with the add-on installed).
 * Default port: 8765
 */

import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
import { writeNote } from '@/sal/note-service';
import { log } from '@/utils/log/logger';

const ankiLog = log.child('anki-sync');

// ── AnkiConnect Types ────────────────────────────────────────────────────────

export interface AnkiNote {
  noteId: number;
  modelName: string;
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
}

interface AnkiCard {
  cardId: number;
  noteId: number;
  deckName: string;
  modelName: string;
  fields: Record<string, { value: string; order: number }>;
  tags: string[];
  interval: number;
  due: number;
  reps: number;
  lapses: number;
}

export interface AnkiSyncResult {
  decksImported: number;
  cardsImported: number;
  filesWritten: number;
  errors: string[];
}

// ── AnkiConnect API ──────────────────────────────────────────────────────────

function getAnkiUrl(): string {
  const port = getSettings().integration?.ankiConnectPort ?? 8765;
  return `http://127.0.0.1:${port}`;
}

async function ankiRequest<T>(action: string, params?: Record<string, unknown>): Promise<T> {
  const body = JSON.stringify({ action, version: 6, params: params ?? {} });
  const resp = await fetch(getAnkiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!resp.ok) throw new Error(`AnkiConnect HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.error) throw new Error(`AnkiConnect: ${json.error}`);
  return json.result as T;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function testAnkiConnection(): Promise<boolean> {
  try {
    const version = await ankiRequest<number>('version');
    ankiLog.info('AnkiConnect connected', { version });
    return version >= 6;
  } catch (e) {
    ankiLog.warn('AnkiConnect not reachable', { error: (e as Error).message });
    return false;
  }
}

export async function getAnkiDecks(): Promise<string[]> {
  return ankiRequest<string[]>('deckNames');
}

async function getAnkiDeckCards(deckName: string): Promise<AnkiCard[]> {
  const cardIds = await ankiRequest<number[]>('findCards', { query: `deck:"${deckName}"` });
  if (cardIds.length === 0) return [];
  const cardsInfo = await ankiRequest<AnkiCard[]>('cardsInfo', { cards: cardIds });
  return cardsInfo;
}

async function getAnkiNotesByDeck(deckName: string): Promise<AnkiNote[]> {
  const noteIds = await ankiRequest<number[]>('findNotes', { query: `deck:"${deckName}"` });
  if (noteIds.length === 0) return [];
  const notes = await ankiRequest<AnkiNote[]>('notesInfo', { notes: noteIds });
  return notes;
}

/**
 * Pull all cards from Anki and back them up as markdown files in the vault.
 * Each deck becomes a subfolder, each note becomes a markdown file with flashcard syntax.
 */
export async function syncAnkiToVault(backupFolder?: string): Promise<AnkiSyncResult> {
  const folder = backupFolder ?? getSettings().integration?.ankiDeckPrefix ?? 'anki-backup';
  const result: AnkiSyncResult = {
    decksImported: 0,
    cardsImported: 0,
    filesWritten: 0,
    errors: [],
  };

  try {
    const decks = await getAnkiDecks();
    ankiLog.info('Found Anki decks', { count: decks.length });

    for (const deck of decks) {
      if (deck === 'Default' && decks.length > 1) continue; // Skip empty default deck
      try {
        const notes = await getAnkiNotesByDeck(deck);
        if (notes.length === 0) continue;

        const markdown = ankiDeckToMarkdown(deck, notes);
        const safeName = deck
          .replace(/[:/\\]/g, '-')
          .replace(/\s+/g, ' ')
          .trim();
        const filePath = `${folder}/${safeName}.md`;

        await writeNote(filePath, markdown);
        result.decksImported++;
        result.cardsImported += notes.length;
        result.filesWritten++;
        ankiLog.debug('Wrote deck file', { deck, path: filePath, cards: notes.length });
      } catch (e) {
        const msg = `Failed to sync deck "${deck}": ${(e as Error).message}`;
        result.errors.push(msg);
        ankiLog.warn(msg);
      }
    }
  } catch (e) {
    const msg = `Anki sync failed: ${(e as Error).message}`;
    result.errors.push(msg);
    ankiLog.error(msg);
  }

  ankiLog.info('Anki sync complete', { ...result });
  return result;
}

/**
 * Pull a single deck and return its notes as markdown string.
 */
async function pullAnkiDeck(
  deckName: string
): Promise<{ markdown: string; noteCount: number }> {
  const notes = await getAnkiNotesByDeck(deckName);
  return { markdown: ankiDeckToMarkdown(deckName, notes), noteCount: notes.length };
}

// ── Markdown Conversion ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function ankiNoteToFlashcard(note: AnkiNote): string {
  const fields = Object.entries(note.fields)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([, v]) => stripHtml(v.value));

  const front = fields[0] ?? '';
  const back = fields[1] ?? '';

  if (!front) return '';

  const tagStr = note.tags.length > 0 ? ` #${note.tags.join(' #')}` : '';
  return `${front} :: ${back}${tagStr}`;
}

export function ankiDeckToMarkdown(deckName: string, notes: AnkiNote[]): string {
  const lines: string[] = [
    '---',
    `title: "${deckName}"`,
    `source: anki`,
    `synced_at: "${new Date().toISOString()}"`,
    `card_count: ${notes.length}`,
    '---',
    '',
    `# ${deckName}`,
    '',
  ];

  for (const note of notes) {
    const card = ankiNoteToFlashcard(note);
    if (card) lines.push(`- ${card}`);
  }

  lines.push('');
  return lines.join('\n');
}
