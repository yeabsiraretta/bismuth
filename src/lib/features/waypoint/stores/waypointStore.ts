/**
 * Waypoint store — config persistence, toggle all/nothing,
 * hide/reveal, and reactive auto-update triggers.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { notes, getNoteContent } from '@/stores/vault/vault';
import { writeNote } from '@/services/vault/vault';
import type { WaypointConfig, MarkerKind, FolderNoteInfo } from '../types/waypoint';
import { DEFAULT_WAYPOINT_CONFIG } from '../types/waypoint';
import {
  isFolderNote,
  findFolderNotes,
  getMarkerKind,
  collectTocEntries,
  updateNoteContent,
  parentDir,
  folderName,
} from '../services/waypointService';

const STORAGE_KEY = 'bismuth-waypoint';

// ─── Config persistence ─────────────────────────────────────────────────────

function loadConfig(): WaypointConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_WAYPOINT_CONFIG };
    return { ...DEFAULT_WAYPOINT_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_WAYPOINT_CONFIG };
  }
}

function persistConfig(config: WaypointConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    log.warn('Failed to persist Waypoint config');
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const waypointConfig = writable<WaypointConfig>(loadConfig());

/** Whether waypoint-generated content is hidden in the editor. */
export const waypointHidden = writable(false);

/** Processing status. */
export const isProcessing = writable(false);

/** Last scan results: folder notes with their marker info. */
export const folderNoteIndex = writable<FolderNoteInfo[]>([]);

// ─── Derived stores ─────────────────────────────────────────────────────────

export const isEnabled = derived(waypointConfig, ($c) => $c.enabled);
export const hideInEditor = derived(waypointConfig, ($c) => $c.hideInEditor);
export const autoCreateFolderNotes = derived(waypointConfig, ($c) => $c.autoCreateFolderNotes);

export const folderNoteCount = derived(folderNoteIndex, ($idx) => $idx.length);
export const waypointCount = derived(
  folderNoteIndex,
  ($idx) => $idx.filter((f) => f.marker === 'waypoint').length,
);
export const landmarkCount = derived(
  folderNoteIndex,
  ($idx) => $idx.filter((f) => f.marker === 'landmark').length,
);

// ─── Config actions ─────────────────────────────────────────────────────────

function update(fn: (c: WaypointConfig) => WaypointConfig): void {
  waypointConfig.update((c) => {
    const next = fn(c);
    persistConfig(next);
    return next;
  });
}

export function toggleEnabled(): void {
  update((c) => ({ ...c, enabled: !c.enabled }));
}

export function toggleHideInEditor(): void {
  update((c) => ({ ...c, hideInEditor: !c.hideInEditor }));
  waypointHidden.update((v) => !v);
}

export function toggleStopAtFolderNotes(): void {
  update((c) => ({ ...c, stopAtFolderNotes: !c.stopAtFolderNotes }));
}

export function toggleAutoCreateFolderNotes(): void {
  update((c) => ({ ...c, autoCreateFolderNotes: !c.autoCreateFolderNotes }));
}

export function toggleIncludeExtension(): void {
  update((c) => ({ ...c, includeExtension: !c.includeExtension }));
}

export function setWaypointTrigger(trigger: string): void {
  update((c) => ({ ...c, waypointTrigger: trigger.trim() || 'Waypoint' }));
}

export function setLandmarkTrigger(trigger: string): void {
  update((c) => ({ ...c, landmarkTrigger: trigger.trim() || 'Landmark' }));
}

export function setIndentString(indent: string): void {
  update((c) => ({ ...c, indentString: indent }));
}

export function updateConfig(partial: Partial<WaypointConfig>): void {
  update((c) => ({ ...c, ...partial }));
}

// ─── Scanning & updating ────────────────────────────────────────────────────

/**
 * Scan all notes to build the folder note index and detect markers.
 * Returns the marker map for use in TOC generation.
 */
export async function scanFolderNotes(): Promise<Map<string, MarkerKind>> {
  const config = get(waypointConfig);
  if (!config.enabled) return new Map();

  const allNotes = get(notes);
  const fnMap = findFolderNotes(allNotes);
  const markerMap = new Map<string, MarkerKind>();
  const infos: FolderNoteInfo[] = [];

  for (const [fPath, nPath] of fnMap) {
    let marker: MarkerKind | null = null;
    try {
      const content = await getNoteContent(nPath);
      marker = getMarkerKind(content, config);
    } catch {
      // Note content unavailable — skip
    }
    if (marker) markerMap.set(nPath, marker);
    infos.push({
      notePath: nPath,
      folderPath: fPath,
      folderName: folderName(fPath),
      marker,
    });
  }

  folderNoteIndex.set(infos);
  return markerMap;
}

/**
 * Update all waypoints and landmarks in the vault.
 * Scans folder notes, generates TOCs, and writes updated content.
 */
export async function updateAllWaypoints(): Promise<number> {
  const config = get(waypointConfig);
  if (!config.enabled) return 0;

  isProcessing.set(true);
  let updated = 0;

  try {
    const allNotes = get(notes);
    const fnMap = findFolderNotes(allNotes);
    const markerMap = await scanFolderNotes();

    for (const [fPath, nPath] of fnMap) {
      const marker = markerMap.get(nPath);
      if (!marker) continue;

      const content = await getNoteContent(nPath);
      const entries = collectTocEntries(fPath, allNotes, fnMap, markerMap, config);
      const newContent = updateNoteContent(content, marker, entries, config);

      if (newContent !== null && newContent !== content) {
        await writeNote(nPath, newContent);
        updated++;
        log.debug('Waypoint updated', { path: nPath, entries: entries.length });
      }
    }

    log.info('Waypoint scan complete', { updated, total: fnMap.size });
  } catch (error) {
    log.error('Waypoint update failed', error as Error);
  } finally {
    isProcessing.set(false);
  }

  return updated;
}

/**
 * Update a single waypoint for a specific folder note.
 */
export async function updateSingleWaypoint(notePath: string): Promise<boolean> {
  const config = get(waypointConfig);
  if (!config.enabled) return false;
  if (!isFolderNote(notePath)) return false;

  try {
    const content = await getNoteContent(notePath);
    const marker = getMarkerKind(content, config);
    if (!marker) return false;

    const allNotes = get(notes);
    const fnMap = findFolderNotes(allNotes);
    const markerMap = await scanFolderNotes();
    const fPath = parentDir(notePath);
    const entries = collectTocEntries(fPath, allNotes, fnMap, markerMap, config);
    const newContent = updateNoteContent(content, marker, entries, config);

    if (newContent !== null && newContent !== content) {
      await writeNote(notePath, newContent);
      log.debug('Single waypoint updated', { path: notePath });
      return true;
    }
  } catch (error) {
    log.error('Single waypoint update failed', error as Error);
  }
  return false;
}
