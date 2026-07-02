/**
 * Project store — series management, scene archive, corkboard, research, snapshots.
 */

import { writable, derived, get } from 'svelte/store';
import type {
  Series,
  ArchivedScene,
  CorkboardNote,
  ResearchPost,
  ViewSnapshot,
  CodexCategory,
} from '../types/project';
import { BUILTIN_CODEX_CATEGORIES } from '../types/project';
import { activeStoryId } from './storyStore';

const SERIES_KEY = 'bismuth-storyteller-series';
const ARCHIVE_KEY = 'bismuth-storyteller-archive';
const CORKBOARD_KEY = 'bismuth-storyteller-corkboard';
const RESEARCH_KEY = 'bismuth-storyteller-research';
const SNAPSHOTS_KEY = 'bismuth-storyteller-snapshots';
const CODEX_KEY = 'bismuth-storyteller-codex-categories';

function load<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* */
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const allSeries = writable<Series[]>(load(SERIES_KEY, []));
export const archivedScenes = writable<ArchivedScene[]>(load(ARCHIVE_KEY, []));
export const corkboardNotes = writable<CorkboardNote[]>(load(CORKBOARD_KEY, []));
export const researchPosts = writable<ResearchPost[]>(load(RESEARCH_KEY, []));
export const viewSnapshots = writable<ViewSnapshot[]>(load(SNAPSHOTS_KEY, []));
export const codexCategories = writable<CodexCategory[]>(load(CODEX_KEY, BUILTIN_CODEX_CATEGORIES));

export const storyCorkboardNotes = derived([corkboardNotes, activeStoryId], ([$notes, $id]) =>
  $id ? $notes.filter((n) => n.storyId === $id) : []
);
export const storyResearchPosts = derived([researchPosts, activeStoryId], ([$posts, $id]) =>
  $id ? $posts.filter((p) => p.storyId === $id) : []
);
export const storySnapshots = derived([viewSnapshots, activeStoryId], ([$snaps, $id]) =>
  $id ? $snaps.filter((s) => s.storyId === $id) : []
);

// ─── Series actions ─────────────────────────────────────────────────────────

export function createSeries(name: string): Series {
  const s: Series = {
    id: crypto.randomUUID(),
    name,
    bookIds: [],
    sharedCodexPath: `StorytellerSuite/Series/${name}/Codex`,
    createdAt: new Date().toISOString(),
  };
  allSeries.update((list) => {
    const next = [...list, s];
    save(SERIES_KEY, next);
    return next;
  });
  return s;
}

export function addBookToSeries(seriesId: string, bookId: string): void {
  allSeries.update((list) => {
    const next = list.map((s) =>
      s.id === seriesId && !s.bookIds.includes(bookId)
        ? { ...s, bookIds: [...s.bookIds, bookId] }
        : s
    );
    save(SERIES_KEY, next);
    return next;
  });
}

export function removeBookFromSeries(seriesId: string, bookId: string): void {
  allSeries.update((list) => {
    const next = list.map((s) =>
      s.id === seriesId ? { ...s, bookIds: s.bookIds.filter((id) => id !== bookId) } : s
    );
    save(SERIES_KEY, next);
    return next;
  });
}

// ─── Archive actions ────────────────────────────────────────────────────────

export function archiveScene(entityId: string, chapterId: string | null, sortOrder: number): void {
  const entry: ArchivedScene = {
    entityId,
    archivedAt: new Date().toISOString(),
    originalChapterId: chapterId,
    originalSortOrder: sortOrder,
  };
  archivedScenes.update((list) => {
    const next = [...list, entry];
    save(ARCHIVE_KEY, next);
    return next;
  });
}

export function restoreScene(entityId: string): ArchivedScene | undefined {
  let restored: ArchivedScene | undefined;
  archivedScenes.update((list) => {
    restored = list.find((a) => a.entityId === entityId);
    const next = list.filter((a) => a.entityId !== entityId);
    save(ARCHIVE_KEY, next);
    return next;
  });
  return restored;
}

// ─── Corkboard actions ──────────────────────────────────────────────────────

export function addCorkboardNote(
  text: string,
  x: number,
  y: number,
  color = '#fef08a'
): CorkboardNote {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const note: CorkboardNote = {
    id: crypto.randomUUID(),
    storyId,
    text,
    color,
    x,
    y,
    width: 200,
    height: 150,
    isImage: false,
  };
  corkboardNotes.update((list) => {
    const next = [...list, note];
    save(CORKBOARD_KEY, next);
    return next;
  });
  return note;
}

export function addImageNote(imagePath: string, x: number, y: number, caption = ''): CorkboardNote {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const note: CorkboardNote = {
    id: crypto.randomUUID(),
    storyId,
    text: '',
    color: '#fff',
    x,
    y,
    width: 220,
    height: 180,
    isImage: true,
    imagePath,
    caption,
  };
  corkboardNotes.update((list) => {
    const next = [...list, note];
    save(CORKBOARD_KEY, next);
    return next;
  });
  return note;
}

export function updateCorkboardNote(updated: CorkboardNote): void {
  corkboardNotes.update((list) => {
    const next = list.map((n) => (n.id === updated.id ? updated : n));
    save(CORKBOARD_KEY, next);
    return next;
  });
}

export function removeCorkboardNote(noteId: string): void {
  corkboardNotes.update((list) => {
    const next = list.filter((n) => n.id !== noteId);
    save(CORKBOARD_KEY, next);
    return next;
  });
}

export function convertNoteToScene(noteId: string, sceneId: string): void {
  corkboardNotes.update((list) => {
    const next = list.map((n) => (n.id === noteId ? { ...n, convertedToSceneId: sceneId } : n));
    save(CORKBOARD_KEY, next);
    return next;
  });
}

// ─── Research actions ───────────────────────────────────────────────────────

export function addResearchPost(
  type: ResearchPost['type'],
  title: string,
  content: string,
  tags: string[] = []
): ResearchPost {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const post: ResearchPost = {
    id: crypto.randomUUID(),
    storyId,
    type,
    title,
    content,
    tags,
    createdAt: new Date().toISOString(),
  };
  researchPosts.update((list) => {
    const next = [...list, post];
    save(RESEARCH_KEY, next);
    return next;
  });
  return post;
}

export function removeResearchPost(postId: string): void {
  researchPosts.update((list) => {
    const next = list.filter((p) => p.id !== postId);
    save(RESEARCH_KEY, next);
    return next;
  });
}

// ─── Snapshot actions ───────────────────────────────────────────────────────

export function saveSnapshot(
  name: string,
  corkboardPositions: Record<string, { x: number; y: number }>,
  sceneOrdering: string[]
): ViewSnapshot {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const snap: ViewSnapshot = {
    id: crypto.randomUUID(),
    name,
    storyId,
    createdAt: new Date().toISOString(),
    corkboardPositions,
    plotgridState: {},
    sceneOrdering,
  };
  viewSnapshots.update((list) => {
    const next = [...list, snap];
    save(SNAPSHOTS_KEY, next);
    return next;
  });
  return snap;
}

export function deleteSnapshot(snapId: string): void {
  viewSnapshots.update((list) => {
    const next = list.filter((s) => s.id !== snapId);
    save(SNAPSHOTS_KEY, next);
    return next;
  });
}

// ─── Codex category actions ─────────────────────────────────────────────────

export function addCodexCategory(name: string, icon: string, color: string): CodexCategory {
  const cat: CodexCategory = {
    id: crypto.randomUUID(),
    name,
    folderName: name.replace(/\s+/g, ''),
    icon,
    color,
    isBuiltIn: false,
  };
  codexCategories.update((list) => {
    const next = [...list, cat];
    save(CODEX_KEY, next);
    return next;
  });
  return cat;
}

export function removeCodexCategory(catId: string): void {
  codexCategories.update((list) => {
    const next = list.filter((c) => c.id !== catId || c.isBuiltIn);
    save(CODEX_KEY, next);
    return next;
  });
}
