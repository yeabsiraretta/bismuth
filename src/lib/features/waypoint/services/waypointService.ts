/**
 * Waypoint service — folder note detection, TOC generation,
 * marker scanning, and nested waypoint pruning.
 */

import type { Note } from '@/types/data/vault';
import type {
  MarkerKind,
  MarkerTrigger,
  TocEntry,
  WaypointConfig,
} from '../types/waypoint';
import { beginMarker, endMarker, triggerComment } from '../types/waypoint';

// ─── Path helpers ───────────────────────────────────────────────────────────

/** Extract filename without extension from a path. */
export function stemOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Extract parent folder path from a file path. */
export function parentDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.slice(0, idx) : '';
}

/** Extract the folder name from a folder path. */
export function folderName(folderPath: string): string {
  return folderPath.slice(folderPath.lastIndexOf('/') + 1);
}

// ─── Folder note detection ──────────────────────────────────────────────────

/** Determine whether a note is a folder note (filename matches parent folder). */
export function isFolderNote(notePath: string): boolean {
  const parent = parentDir(notePath);
  if (!parent) return false;
  return stemOf(notePath) === folderName(parent);
}

/**
 * Find all folder notes in a set of notes.
 * Returns a map: folderPath -> notePath.
 */
export function findFolderNotes(notes: Note[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const note of notes) {
    if (isFolderNote(note.path)) {
      map.set(parentDir(note.path), note.path);
    }
  }
  return map;
}

// ─── Marker scanning ────────────────────────────────────────────────────────

/** Scan a note's content for waypoint/landmark trigger markers. */
export function findMarkers(content: string, config: WaypointConfig): MarkerTrigger[] {
  const markers: MarkerTrigger[] = [];
  const lines = content.split('\n');
  const wpTrigger = triggerComment(config.waypointTrigger);
  const lmTrigger = triggerComment(config.landmarkTrigger);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === wpTrigger) {
      markers.push({ kind: 'waypoint', line: i });
    } else if (trimmed === lmTrigger) {
      markers.push({ kind: 'landmark', line: i });
    }
  }
  return markers;
}

/** Check whether a note contains a waypoint or landmark marker. */
export function getMarkerKind(content: string, config: WaypointConfig): MarkerKind | null {
  const markers = findMarkers(content, config);
  if (markers.length === 0) return null;
  // Waypoint takes priority over landmark
  return markers.find((m) => m.kind === 'waypoint')?.kind ?? markers[0].kind;
}

// ─── TOC generation ─────────────────────────────────────────────────────────

/**
 * Collect TOC entries for a folder, respecting nested waypoints.
 *
 * Algorithm:
 * 1. List all notes under `folderPath` (recursively).
 * 2. For each subfolder that has a folder note with a waypoint marker,
 *    prune its contents — only include the folder note itself.
 * 3. Landmarks do NOT prune the parent — they generate their own TOC
 *    but the parent waypoint still sees through them.
 * 4. If `stopAtFolderNotes` is true, stop at any folder note regardless of marker.
 */
export function collectTocEntries(
  folderPath: string,
  allNotes: Note[],
  folderNoteMap: Map<string, string>,
  markerMap: Map<string, MarkerKind>,
  config: WaypointConfig,
): TocEntry[] {
  const entries: TocEntry[] = [];
  const folderDepth = folderPath.split('/').length;

  // Notes inside this folder (recursive)
  const contained = allNotes.filter(
    (n) => n.path.startsWith(folderPath + '/') && n.path !== folderNoteMap.get(folderPath),
  );

  // Identify subfolders with waypoints (pruning boundaries)
  const prunedFolders = new Set<string>();
  for (const [subFolder, subNotePath] of folderNoteMap) {
    if (subFolder === folderPath) continue;
    if (!subFolder.startsWith(folderPath + '/')) continue;
    const marker = markerMap.get(subNotePath);

    if (marker === 'waypoint') {
      prunedFolders.add(subFolder);
    } else if (config.stopAtFolderNotes && marker !== 'landmark') {
      prunedFolders.add(subFolder);
    }
  }

  for (const note of contained) {
    const noteParent = parentDir(note.path);
    const noteIsFolderNote = isFolderNote(note.path);

    // Check if this note is inside a pruned subtree
    let pruned = false;
    for (const pf of prunedFolders) {
      if (noteParent.startsWith(pf + '/') || noteParent === pf) {
        // Inside a pruned folder — only include the folder note itself
        if (!(noteIsFolderNote && noteParent === pf)) {
          pruned = true;
        }
        break;
      }
    }
    if (pruned) continue;

    const depth = parentDir(note.path).split('/').length - folderDepth;
    entries.push({
      name: stemOf(note.path),
      path: note.path,
      depth,
      isFolderNote: noteIsFolderNote,
    });
  }

  // Sort: folders first, then alphabetically within each depth
  return entries.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.isFolderNote !== b.isFolderNote) return a.isFolderNote ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── TOC rendering ──────────────────────────────────────────────────────────

/** Render TOC entries as a markdown list with wikilinks. */
export function renderToc(
  entries: TocEntry[],
  config: WaypointConfig,
): string {
  return entries
    .map((e) => {
      const indent = config.indentString.repeat(e.depth);
      const linkName = config.includeExtension ? e.name + '.md' : e.name;
      return `${indent}- [[${linkName}]]`;
    })
    .join('\n');
}

/**
 * Generate the full waypoint block (begin marker + TOC + end marker).
 */
export function generateWaypointBlock(
  kind: MarkerKind,
  entries: TocEntry[],
  config: WaypointConfig,
): string {
  const trigger = kind === 'waypoint' ? config.waypointTrigger : config.landmarkTrigger;
  const begin = beginMarker(kind, trigger);
  const end = endMarker(kind, trigger);
  const toc = renderToc(entries, config);
  return `${begin}\n${toc}\n${end}`;
}

// ─── Content updating ───────────────────────────────────────────────────────

/**
 * Update a note's content by replacing the generated block between
 * Begin/End markers, or inserting it after the trigger line.
 *
 * Returns the updated content, or null if no trigger was found.
 */
export function updateNoteContent(
  content: string,
  kind: MarkerKind,
  entries: TocEntry[],
  config: WaypointConfig,
): string | null {
  const trigger = kind === 'waypoint' ? config.waypointTrigger : config.landmarkTrigger;
  const triggerLine = triggerComment(trigger);
  const begin = beginMarker(kind, trigger);
  const end = endMarker(kind, trigger);
  const lines = content.split('\n');

  // Find trigger line
  const triggerIdx = lines.findIndex((l) => l.trim() === triggerLine);
  if (triggerIdx === -1) return null;

  // Find existing begin/end block
  const beginIdx = lines.findIndex((l) => l.trim() === begin);
  const endIdx = lines.findIndex((l) => l.trim() === end);

  const block = generateWaypointBlock(kind, entries, config);

  if (beginIdx >= 0 && endIdx > beginIdx) {
    // Replace existing block
    const before = lines.slice(0, beginIdx);
    const after = lines.slice(endIdx + 1);
    return [...before, block, ...after].join('\n');
  }

  // Insert block after trigger line
  const before = lines.slice(0, triggerIdx + 1);
  const after = lines.slice(triggerIdx + 1);
  return [...before, '', block, '', ...after].join('\n');
}

// ─── Folder note creation ───────────────────────────────────────────────────

/** Generate initial content for a new folder note. */
export function folderNoteContent(fName: string, kind: MarkerKind | null): string {
  let content = `# ${fName}\n\n`;
  if (kind === 'waypoint') content += `%% Waypoint %%\n`;
  else if (kind === 'landmark') content += `%% Landmark %%\n`;
  return content;
}

/** Compute the expected folder note path for a given folder. */
export function folderNotePath(fPath: string): string {
  const name = folderName(fPath);
  return `${fPath}/${name}.md`;
}
