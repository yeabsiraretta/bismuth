/**
 * Smart Connections — find semantically related notes.
 *
 * Primary path: Rust TF-IDF via Tauri IPC (faster, reads from disk).
 * Fallback: JS TF-IDF in-browser (for `vite dev` without Tauri).
 *
 * Zero-setup, local, private. No API keys.
 */

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import {
  buildEmbeddingIndex,
  type EmbeddingIndex,
  findSimilar,
  findSimilarToText,
  type SimilarityResult,
} from '@/hubs/knowledge/services/embedding-service';
import { extractInlineTags } from '@/hubs/knowledge/services/tag-extractor';
import {
  findSimilarNotesNative,
  findSimilarToTextNative,
  type NativeSmartConnection,
} from '@/sal/embedding-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const scLog = log.child('smart-connections');

// ── Types ────────────────────────────────────────────────────────────────────

export interface SmartConnection {
  path: string;
  title: string;
  score: number;
  snippet: string;
  folder: string;
  tags: string[];
}

// ── Native → SmartConnection adapter ─────────────────────────────────────────

function nativeToSmart(results: NativeSmartConnection[]): SmartConnection[] {
  const notes = getNotes();
  const noteMap = new Map(notes.map((n) => [n.path, n]));

  return results.map((r) => {
    const note = noteMap.get(r.path);
    const content = getCachedContent(r.path) ?? '';
    return {
      path: r.path,
      title: note?.title ?? r.title,
      score: r.score,
      snippet: r.snippet,
      folder: r.path.includes('/') ? r.path.split('/').slice(0, -1).join('/') : '',
      tags: extractInlineTags(content),
    };
  });
}

// ── JS fallback index (browser-only) ─────────────────────────────────────────

let cachedIndex: EmbeddingIndex | null = null;
let indexVersion = 0;
let lastNoteCount = 0;

function invalidateConnectionsIndex(): void {
  cachedIndex = null;
  indexVersion++;
}

function getConnectionsIndexVersion(): number {
  return indexVersion;
}

function getOrBuildIndex(): EmbeddingIndex {
  const notes = getNotes();

  if (cachedIndex && notes.length === lastNoteCount) {
    return cachedIndex;
  }

  const start = performance.now();
  const documents: { id: string; content: string }[] = [];

  for (const note of notes) {
    const content = getCachedContent(note.path);
    if (content !== undefined && content.length > 0) {
      documents.push({ id: note.path, content });
    }
  }

  cachedIndex = buildEmbeddingIndex(documents);
  lastNoteCount = notes.length;
  indexVersion++;

  const elapsed = Math.round(performance.now() - start);
  scLog.info('Connections index built (JS fallback)', {
    documents: documents.length,
    durationMs: elapsed,
  });

  return cachedIndex;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SNIPPET_LENGTH = 120;

function extractSnippet(content: string): string {
  const stripped = content
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/^#+\s+.+$/m, '')
    .trim();

  if (stripped.length <= SNIPPET_LENGTH) return stripped;
  return stripped.slice(0, SNIPPET_LENGTH).trimEnd() + '…';
}

function resultToConnection(result: SimilarityResult): SmartConnection | null {
  const notes = getNotes();
  const note = notes.find((n) => n.path === result.id);
  if (!note) return null;

  const content = getCachedContent(note.path) ?? '';
  const folder = note.path.includes('/') ? note.path.split('/').slice(0, -1).join('/') : '';

  return {
    path: note.path,
    title: note.title,
    score: Math.round(result.score * 100) / 100,
    snippet: extractSnippet(content),
    folder,
    tags: extractInlineTags(content),
  };
}

// ── Public API (async — Rust first, JS fallback) ─────────────────────────────

export async function findConnections(
  notePath: string,
  limit = 20,
  minScore = 0.05
): Promise<SmartConnection[]> {
  if (isTauriAvailable()) {
    try {
      const native = await findSimilarNotesNative(notePath, limit, minScore);
      return nativeToSmart(native);
    } catch (err) {
      scLog.warn('Rust find_similar_notes failed, falling back to JS', { err });
    }
  }

  const index = getOrBuildIndex();
  const results = findSimilar(index, notePath, limit, minScore);
  return results.map(resultToConnection).filter((c): c is SmartConnection => c !== null);
}

export async function lookupConnections(
  query: string,
  limit = 20,
  minScore = 0.05
): Promise<SmartConnection[]> {
  if (isTauriAvailable()) {
    try {
      const native = await findSimilarToTextNative(query, limit, minScore);
      return nativeToSmart(native);
    } catch (err) {
      scLog.warn('Rust find_similar_to_text failed, falling back to JS', { err });
    }
  }

  const index = getOrBuildIndex();
  const results = findSimilarToText(index, query, limit, minScore);
  return results.map(resultToConnection).filter((c): c is SmartConnection => c !== null);
}

export function getRandomConnection(): SmartConnection | null {
  const notes = getNotes();
  if (notes.length === 0) return null;

  const idx = Math.floor(Math.random() * notes.length);
  const note = notes[idx];
  const content = getCachedContent(note.path) ?? '';
  const folder = note.path.includes('/') ? note.path.split('/').slice(0, -1).join('/') : '';

  return {
    path: note.path,
    title: note.title,
    score: 0,
    snippet: extractSnippet(content),
    folder,
    tags: extractInlineTags(content),
  };
}
