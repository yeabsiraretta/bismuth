/**
 * ConnectionsView logic — IPC calls and connection operations.
 * Extracted from ConnectionsView.svelte for 300-line compliance.
 */

import { getSimilarNotes, lookupByText as lookupByTextService } from '@/features/graph';
import { log } from '@/utils/logger';
import type { Note } from '@/types/data/vault';

export interface Connection {
  path: string;
  title: string;
  score: number;
  pinned?: boolean;
}

export type ViewTab = 'connections' | 'lookup';

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export interface FetchSimilarResult {
  connections: Connection[];
  error?: string;
}

export async function fetchSimilarNotes(
  path: string,
  pinnedConnections: Connection[]
): Promise<FetchSimilarResult> {
  try {
    const results = await getSimilarNotes(path, 8);
    return {
      connections: results.map((r) => ({
        path: r.path,
        title: getFileName(r.path),
        score: r.score,
        pinned: pinnedConnections.some((p) => p.path === r.path),
      })),
    };
  } catch (error) {
    log.error('Failed to fetch connections', error);
    return { connections: [], error: 'Embeddings not available' };
  }
}

export async function lookupByText(query: string): Promise<Connection[]> {
  if (!query.trim()) return [];
  try {
    const results = await lookupByTextService(query, 10);
    return results.map((r) => ({
      path: r.path,
      title: getFileName(r.path),
      score: r.score,
    }));
  } catch (error) {
    log.error('Failed to lookup', error);
    return [];
  }
}

export function togglePin(
  connection: Connection,
  pinnedConnections: Connection[],
  connections: Connection[]
): { pinned: Connection[]; connections: Connection[] } {
  let newPinned: Connection[];
  if (pinnedConnections.some((p) => p.path === connection.path)) {
    newPinned = pinnedConnections.filter((p) => p.path !== connection.path);
  } else {
    newPinned = [...pinnedConnections, { ...connection, pinned: true }];
  }
  const newConnections = connections.map((c) => ({
    ...c,
    pinned: newPinned.some((p) => p.path === c.path),
  }));
  return { pinned: newPinned, connections: newConnections };
}

export function copyAsWikilinks(pinnedConnections: Connection[], connections: Connection[]): void {
  const allConnections = [...pinnedConnections, ...connections.filter((c) => !c.pinned)];
  const wikilinks = allConnections.map((c) => `[[${c.title.replace('.md', '')}]]`).join('\n');
  navigator.clipboard.writeText(wikilinks).catch((err) => log.error('Clipboard write failed', err));
}

export function pickRandomConnection(
  connections: Connection[],
  pinnedConnections: Connection[]
): string | null {
  const pool = connections.length > 0 ? connections : pinnedConnections;
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].path;
}

export function buildDragData(connection: Connection): { text: string; wikilinkPath: string } {
  const wikilink = `[[${connection.title.replace('.md', '')}]]`;
  return { text: wikilink, wikilinkPath: connection.path };
}

/** Extract hashtag strings from note content. */
export function extractTags(content: string): string[] {
  const matches = content.match(/#([\w-]+)/g) ?? [];
  return matches.map((t) => t.slice(1).toLowerCase());
}

/** Resolve already-linked paths from wikilinks in content. */
export function extractLinkedPaths(content: string, allNotes: Note[]): Set<string> {
  const wikilinks = content.match(/\[\[([^\]]+)\]\]/g) ?? [];
  const titles = new Set(wikilinks.map((l) => l.slice(2, -2).split('|')[0].trim().toLowerCase()));
  const paths = new Set<string>();
  for (const note of allNotes) {
    if (titles.has(note.title.toLowerCase())) paths.add(note.path);
  }
  return paths;
}

/** Compute up to 5 link suggestions for the active note. */
export function computeLinkSuggestions(
  active: { path: string; title: string; content: string },
  allNotes: Note[]
): Note[] {
  const titleLower = active.title.toLowerCase();
  const tags = extractTags(active.content);
  const linked = extractLinkedPaths(active.content, allNotes);
  return allNotes
    .filter((n) => n.path !== active.path && !linked.has(n.path))
    .filter((n) => {
      const nameLower = n.title.toLowerCase();
      const noteTags = extractTags(n.content);
      const nameOverlap = nameLower.includes(titleLower) || titleLower.includes(nameLower);
      const tagOverlap = tags.some((t) => noteTags.includes(t));
      return nameOverlap || tagOverlap;
    })
    .slice(0, 5);
}
