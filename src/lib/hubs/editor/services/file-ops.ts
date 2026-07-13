import { SvelteMap } from 'svelte/reactivity';

import { awardNoteCreateXp } from '@/hubs/core/stores/gamification-store.svelte';
import { getGeneral } from '@/hubs/core/stores/settings-store.svelte';
import { setActiveNote } from '@/hubs/core/stores/vault-store.svelte';
import { getActiveTab, markTabDirty, openTab } from '@/hubs/editor/stores/editor-tabs.svelte';
import { readNote as salReadNote } from '@/sal/note-service';
import { createNote, deleteNote, writeNote } from '@/sal/note-service';
import { batchReadNotes } from '@/sal/perf-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const contentCache = new SvelteMap<string, string>();
let hydrated = false;

export function isContentHydrated(): boolean {
  return hydrated;
}

export async function openNoteFile(path: string): Promise<string> {
  const cached = contentCache.get(path);
  if (cached !== undefined) return cached;

  const note = await salReadNote(path);
  contentCache.set(path, note.content);
  setActiveNote(path);
  openTab(path, note.title);
  return note.content;
}

async function saveActiveNote(content: string): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;

  await writeNote(tab.path, content);
  contentCache.set(tab.path, content);
  markTabDirty(tab.id, false);
}

export async function createNewNote(
  title: string,
  folder?: string,
  content?: string
): Promise<string> {
  const resolvedFolder = folder ?? (getGeneral().defaultNoteLocation || undefined);
  const note = await createNote(title, resolvedFolder, content);
  contentCache.set(note.path, note.content);
  openTab(note.path, title);
  setActiveNote(note.path);
  awardNoteCreateXp(title, note.path);
  return note.path;
}

async function deleteNoteFile(path: string): Promise<void> {
  await deleteNote(path);
  contentCache.delete(path);
}

export function getCachedContent(path: string): string | undefined {
  return contentCache.get(path);
}

export function updateCachedContent(path: string, content: string): void {
  contentCache.set(path, content);
}

export function clearFileCache(): void {
  contentCache.clear();
  hydrated = false;
}

const HYDRATE_CHUNK_SIZE = 200;

export async function hydrateVaultContent(notes: { path: string }[]): Promise<void> {
  const start = performance.now();
  const batch = notes.filter((n) => !contentCache.has(n.path));
  if (batch.length === 0) {
    hydrated = true;
    return;
  }

  let failed = 0;

  if (isTauriAvailable()) {
    for (let i = 0; i < batch.length; i += HYDRATE_CHUNK_SIZE) {
      const chunk = batch.slice(i, i + HYDRATE_CHUNK_SIZE);
      try {
        const results = await batchReadNotes(chunk.map((n) => n.path));
        for (const r of results) {
          contentCache.set(r.path, r.content);
        }
        failed += chunk.length - results.length;
      } catch {
        failed += chunk.length;
      }
    }
  } else {
    for (let i = 0; i < batch.length; i += HYDRATE_CHUNK_SIZE) {
      const chunk = batch.slice(i, i + HYDRATE_CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map(async (n) => {
          const resp = await salReadNote(n.path);
          contentCache.set(n.path, resp.content);
        })
      );
      failed += results.filter((r) => r.status === 'rejected').length;
    }
  }

  const elapsed = Math.round(performance.now() - start);
  log.info('Vault content hydrated', {
    total: batch.length,
    failed,
    durationMs: elapsed,
    mode: isTauriAvailable() ? 'rust-batch' : 'js-sequential',
  });
  hydrated = true;
}
