/**
 * ConnectionsView logic — IPC calls and connection operations.
 * Extracted from ConnectionsView.svelte for 300-line compliance.
 */

import { invoke } from '@tauri-apps/api/core';

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

export async function fetchSimilarNotes(
  path: string,
  pinnedConnections: Connection[]
): Promise<Connection[]> {
  try {
    const results = await invoke<Array<{ path: string; score: number }>>('get_similar_notes', {
      path,
      topK: 8,
    });
    return results.map((r) => ({
      path: r.path,
      title: getFileName(r.path),
      score: r.score,
      pinned: pinnedConnections.some((p) => p.path === r.path),
    }));
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return [];
  }
}

export async function lookupByText(query: string): Promise<Connection[]> {
  if (!query.trim()) return [];
  try {
    const results = await invoke<Array<{ path: string; score: number }>>('lookup_by_text', {
      query,
      topK: 10,
    });
    return results.map((r) => ({
      path: r.path,
      title: getFileName(r.path),
      score: r.score,
    }));
  } catch (error) {
    console.error('Failed to lookup:', error);
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
  navigator.clipboard.writeText(wikilinks).catch(console.error);
}

export function pickRandomConnection(connections: Connection[], pinnedConnections: Connection[]): string | null {
  const pool = connections.length > 0 ? connections : pinnedConnections;
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].path;
}

export function buildDragData(connection: Connection): { text: string; wikilinkPath: string } {
  const wikilink = `[[${connection.title.replace('.md', '')}]]`;
  return { text: wikilink, wikilinkPath: connection.path };
}
