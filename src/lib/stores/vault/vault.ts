import { writable, derived, get } from 'svelte/store';
import type { Vault, Note, NoteMeta } from '@/types/data/vault';
import * as vaultService from '@/services/vault/vault';
import { log } from '@/utils/logger';

export const currentVault = writable<Vault | null>(null);
export const notes = writable<Note[]>([]);
export const activeNote = writable<Note | null>(null);
export const isLoadingVault = writable(false);
export const isLoadingNotes = writable(false);
export const showArchived = writable(false);

export const isVaultOpen = derived(currentVault, ($vault: Vault | null) => $vault !== null);

export const notesByPath = derived(notes, ($notes: Note[]) => {
  const map = new Map<string, Note>();
  $notes.forEach((note: Note) => map.set(note.path, note));
  return map;
});

export const visibleNotes = derived(
  [notes, showArchived],
  ([$notes, $showArchived]: [Note[], boolean]) => {
    if ($showArchived) return $notes;
    return $notes.filter((n: Note) => n.frontmatter?.['archived'] !== true);
  }
);

// --- Note content cache (LRU) ---
const CONTENT_CACHE_MAX = 50;
const contentCache = new Map<string, string>();

/** Load note content on demand — uses LRU cache to avoid repeated IPC calls. */
export async function getNoteContent(path: string): Promise<string> {
  const cached = contentCache.get(path);
  if (cached !== undefined) {
    contentCache.delete(path);
    contentCache.set(path, cached);
    return cached;
  }
  const note = await vaultService.getNote(path);
  if (contentCache.size >= CONTENT_CACHE_MAX) {
    const oldest = contentCache.keys().next().value;
    if (oldest !== undefined) contentCache.delete(oldest);
  }
  contentCache.set(path, note.content);
  return note.content;
}

/** Invalidate a single path in the content cache (e.g. after write). */
export function invalidateContentCache(path: string): void {
  contentCache.delete(path);
}

/** Clear the entire content cache (e.g. on vault switch). */
export function clearContentCache(): void {
  contentCache.clear();
}

export async function initializeVault() {
  log.info('Initializing vault store');
  isLoadingVault.set(true);
  try {
    currentVault.set(null);
    log.info('Vault store initialized');
  } catch (error) {
    log.error('Failed to initialize vault store', error as Error);
  } finally {
    isLoadingVault.set(false);
  }
}

/** Refresh notes list using metadata-only scan (no content in payload). */
export async function refreshNotes() {
  log.debug('Refreshing notes list');
  isLoadingNotes.set(true);
  try {
    const vault = get(currentVault);
    if (!vault) return;
    const metaNotes = await vaultService.scanVaultMeta();
    const asNotes: Note[] = metaNotes.map((m: NoteMeta) => ({ ...m, content: '' }));
    notes.set(asNotes);
    log.info('Notes refreshed', { count: asNotes.length });
  } catch (error) {
    log.error('Failed to refresh notes', error as Error);
  } finally {
    isLoadingNotes.set(false);
  }
}

/** Full scan with content — used by features that need to index all note content. */
export async function refreshNotesWithContent(): Promise<Note[]> {
  log.debug('Refreshing notes list (with content)');
  isLoadingNotes.set(true);
  try {
    const vault = get(currentVault);
    if (!vault) return [];
    const allNotes = await vaultService.scanVault();
    notes.set(allNotes);
    for (const n of allNotes) {
      if (contentCache.size >= CONTENT_CACHE_MAX) break;
      contentCache.set(n.path, n.content);
    }
    log.info('Notes refreshed (with content)', { count: allNotes.length });
    return allNotes;
  } catch (error) {
    log.error('Failed to refresh notes with content', error as Error);
    return [];
  } finally {
    isLoadingNotes.set(false);
  }
}

export function setActiveNote(note: Note | null) {
  activeNote.set(note);
}

export function updateNoteInStore(updatedNote: Note) {
  notes.update(($notes: Note[]) => {
    const index = $notes.findIndex((n: Note) => n.path === updatedNote.path);
    if (index >= 0) {
      $notes[index] = updatedNote;
    } else {
      $notes.push(updatedNote);
    }
    return $notes;
  });
  if (updatedNote.content) {
    contentCache.set(updatedNote.path, updatedNote.content);
  }
  activeNote.update(($active: Note | null) =>
    $active && $active.path === updatedNote.path ? updatedNote : $active
  );
}

export function removeNoteFromStore(path: string) {
  notes.update(($notes: Note[]) => $notes.filter((n: Note) => n.path !== path));
  contentCache.delete(path);
  activeNote.update(($active: Note | null) => ($active && $active.path === path ? null : $active));
}

export async function openVault(path: string): Promise<void> {
  log.info('Opening vault');
  isLoadingVault.set(true);
  clearContentCache();
  try {
    const vault = await vaultService.openVault(path);
    log.info('Vault opened successfully', { name: vault.name });
    currentVault.set(vault);

    // Phase 1 — Fast: metadata-only scan for instant UI render
    await Promise.all([
      refreshNotes(),
      import('@/features/canvas/stores/componentLibrary')
        .then(({ loadLibrary }) => loadLibrary())
        .then(() => log.debug('Component library loaded'))
        .catch((e) => log.warn('Component library load failed (non-fatal)', { error: e })),
      import('@/features/template/services/template')
        .then(({ initializeTemplateService }) => initializeTemplateService(vault.root_path))
        .then(() => log.debug('Template service initialized'))
        .catch((e) => log.warn('Template service init failed (non-fatal)', { error: e })),
    ]);

    startPolling();

    // Phase 2 — Deferred: load full content for features that need it
    // (dataview, backlinks, search, tags). Runs after UI is interactive.
    const deferContent =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 100);
    deferContent(() => {
      refreshNotesWithContent()
        .then((allNotes) => {
          if (allNotes.length > 0) {
            import('@/features/dataview/stores/dataviewStore')
              .then(({ initDataviewIndex }) => initDataviewIndex())
              .then(() => log.debug('Dataview index initialized'))
              .catch((e) => log.warn('Dataview index init failed (non-fatal)', { error: e }));
          }
        })
        .catch((e) => log.warn('Deferred content load failed (non-fatal)', { error: e }));
    });
  } catch (error) {
    log.error('Failed to open vault', error as Error);
    throw error;
  } finally {
    isLoadingVault.set(false);
  }
}

// --- Polling-based refresh (replaces dead Tauri event listeners) ---
let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 5000;
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const vault = get(currentVault);
      if (!vault) return;
      const metaNotes = await vaultService.scanVaultMeta();
      const currentNotes = get(notes);
      if (metaNotes.length !== currentNotes.length || hasChanges(metaNotes, currentNotes)) {
        const asNotes: Note[] = metaNotes.map((m: NoteMeta) => ({ ...m, content: '' }));
        notes.set(asNotes);
        log.debug('Poll: notes updated', { count: asNotes.length });
      }
    } catch {
      // Polling failures are non-fatal
    }
  }, POLL_INTERVAL_MS);
}

function hasChanges(meta: NoteMeta[], current: Note[]): boolean {
  if (meta.length !== current.length) return true;
  const currentPaths = new Set(current.map((n) => n.path));
  for (const m of meta) {
    if (!currentPaths.has(m.path)) return true;
  }
  return false;
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function cleanupVaultListeners() {
  stopPolling();
}
