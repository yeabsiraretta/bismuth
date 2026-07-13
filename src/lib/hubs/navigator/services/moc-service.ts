/**
 * MOC (Map of Content) service inspired by IdreesInc/Waypoint.
 *
 * Provides automatic table-of-contents generation for folder notes:
 *
 * - **Waypoint** (%% Waypoint %%) — generates linked TOC of all notes in folder
 *   and subfolders. A child waypoint stops the parent from listing that subtree.
 * - **Landmark** (%% Landmark %%) — like a waypoint but does NOT stop parent
 *   waypoints from listing child files (intermediary index).
 *
 * Folder note = a note whose filename matches its parent folder name.
 *
 * All functions are pure (no side effects, no store dependencies).
 */

// ── Types ─────────────────────────────────────────────────────────

export interface NotePath {
  path: string;
  title: string;
}

export type MarkerType = 'waypoint' | 'landmark';

export interface MocMarker {
  type: MarkerType;
  /** Line index of the trigger comment */
  line: number;
}

interface FolderTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  isFolderNote: boolean;
  children: FolderTreeNode[];
}

// ── Constants ─────────────────────────────────────────────────────

export const WAYPOINT_TRIGGER = '%% Waypoint %%';
export const LANDMARK_TRIGGER = '%% Landmark %%';
export const BEGIN_WAYPOINT = '%% Begin Waypoint %%';
export const END_WAYPOINT = '%% End Waypoint %%';
export const BEGIN_LANDMARK = '%% Begin Landmark %%';
export const END_LANDMARK = '%% End Landmark %%';

// ── Detection ─────────────────────────────────────────────────────

/**
 * Check if a note is a folder note (filename === parent folder name).
 * e.g. "projects/ML/ML.md" → true, "projects/ML/notes.md" → false
 */
export function isFolderNote(notePath: string): boolean {
  const parts = notePath.replace(/\\/g, '/').split('/');
  if (parts.length < 2) return false;
  const filename = parts[parts.length - 1].replace(/\.md$/i, '');
  const folder = parts[parts.length - 2];
  return filename === folder;
}

/**
 * Get the parent folder path of a note.
 */
export function getFolder(notePath: string): string {
  const idx = notePath.replace(/\\/g, '/').lastIndexOf('/');
  return idx >= 0 ? notePath.slice(0, idx) : '';
}

/**
 * Find all MOC markers in a note's content.
 */
export function findMarkers(content: string): MocMarker[] {
  const lines = content.split('\n');
  const markers: MocMarker[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === WAYPOINT_TRIGGER) {
      markers.push({ type: 'waypoint', line: i });
    } else if (trimmed === LANDMARK_TRIGGER) {
      markers.push({ type: 'landmark', line: i });
    }
  }
  return markers;
}

/**
 * Check if content has begin/end markers for waypoint or landmark.
 */
export function hasGeneratedBlock(content: string, type: MarkerType): boolean {
  const begin = type === 'waypoint' ? BEGIN_WAYPOINT : BEGIN_LANDMARK;
  const end = type === 'waypoint' ? END_WAYPOINT : END_LANDMARK;
  return content.includes(begin) && content.includes(end);
}

/**
 * Find all folder notes in a list of note paths.
 */
export function findFolderNotes(notes: NotePath[]): NotePath[] {
  return notes.filter((n) => isFolderNote(n.path));
}

/**
 * Find notes that contain waypoint or landmark triggers.
 */
function findWaypointNotes(
  notes: NotePath[],
  contentLookup: (path: string) => string
): { path: string; markers: MocMarker[] }[] {
  const results: { path: string; markers: MocMarker[] }[] = [];
  for (const note of notes) {
    const content = contentLookup(note.path);
    const markers = findMarkers(content);
    if (markers.length > 0) {
      results.push({ path: note.path, markers });
    }
  }
  return results;
}

// ── Tree Building ─────────────────────────────────────────────────

/**
 * Get all notes within a folder (and subfolders).
 */
export function getNotesInFolder(folderPath: string, allNotes: NotePath[]): NotePath[] {
  const prefix = folderPath ? `${folderPath}/` : '';
  return allNotes.filter((n) => {
    if (!prefix) return true; // root folder = all notes
    return n.path.startsWith(prefix);
  });
}

/**
 * Build a sorted link tree for a folder.
 *
 * - Lists all notes in the folder (not subfolders) as direct items
 * - Lists subfolders: if a subfolder has a waypoint, link only to its
 *   folder note (the waypoint handles the rest). Otherwise, list the
 *   subfolder's contents recursively.
 * - Landmarks don't stop parent expansion.
 */
export function buildLinkTree(
  folderPath: string,
  allNotes: NotePath[],
  waypointFolders: Set<string>,
  currentType: MarkerType = 'waypoint'
): string[] {
  const prefix = folderPath ? `${folderPath}/` : '';
  const links: string[] = [];
  const subfolders = new Map<string, NotePath[]>();

  for (const note of allNotes) {
    if (!note.path.startsWith(prefix) && prefix) continue;

    const relative = prefix ? note.path.slice(prefix.length) : note.path;
    const slashIdx = relative.indexOf('/');

    if (slashIdx < 0) {
      // Direct child note (not in a subfolder)
      // Skip the folder note itself
      if (isFolderNote(note.path) && getFolder(note.path) === folderPath) continue;
      links.push(`- [[${note.path}|${note.title}]]`);
    } else {
      // In a subfolder
      const subName = relative.slice(0, slashIdx);
      const subPath = prefix ? `${prefix}${subName}` : subName;
      if (!subfolders.has(subPath)) subfolders.set(subPath, []);
      subfolders.get(subPath)!.push(note);
    }
  }

  // Process subfolders
  const sortedSubs = Array.from(subfolders.keys()).sort();
  for (const subPath of sortedSubs) {
    const subName = subPath.split('/').pop() || subPath;

    // Check if this subfolder has a waypoint (not landmark)
    if (currentType === 'waypoint' && waypointFolders.has(subPath)) {
      // Link only to the folder note — the waypoint handles the rest
      const folderNotePath = `${subPath}/${subName}.md`;
      links.push(`- **[[${folderNotePath}|${subName}]]**`);
    } else {
      // Expand subfolder contents
      links.push(`- **${subName}**`);
      const childLinks = buildLinkTree(subPath, allNotes, waypointFolders, currentType);
      for (const cl of childLinks) {
        links.push(`  ${cl}`); // indent
      }
    }
  }

  return links.sort((a, b) => {
    // Bold folders first, then alphabetical
    const aIsFolder = a.includes('**');
    const bIsFolder = b.includes('**');
    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
    return a.localeCompare(b);
  });
}

// ── Content Generation ────────────────────────────────────────────

/**
 * Generate the MOC content block (the text between Begin/End markers).
 */
export function generateMocContent(
  folderPath: string,
  allNotes: NotePath[],
  waypointFolders: Set<string>,
  type: MarkerType = 'waypoint'
): string {
  const links = buildLinkTree(folderPath, allNotes, waypointFolders, type);
  if (links.length === 0) return '*No notes found in this folder.*';
  return links.join('\n');
}

/**
 * Update a note's content by replacing/inserting the generated MOC block.
 *
 * If the note contains `%% Waypoint %%` (trigger), it replaces the trigger
 * with begin/end markers and the generated content.
 *
 * If begin/end markers already exist, replaces content between them.
 */
export function updateMocInContent(
  content: string,
  folderPath: string,
  allNotes: NotePath[],
  waypointFolders: Set<string>,
  type: MarkerType = 'waypoint'
): string {
  const trigger = type === 'waypoint' ? WAYPOINT_TRIGGER : LANDMARK_TRIGGER;
  const begin = type === 'waypoint' ? BEGIN_WAYPOINT : BEGIN_LANDMARK;
  const end = type === 'waypoint' ? END_WAYPOINT : END_LANDMARK;
  const generated = generateMocContent(folderPath, allNotes, waypointFolders, type);

  const lines = content.split('\n');

  // Case 1: Begin/End markers exist — replace content between them
  const beginIdx = lines.findIndex((l) => l.trim() === begin);
  const endIdx = lines.findIndex((l) => l.trim() === end);
  if (beginIdx >= 0 && endIdx > beginIdx) {
    const before = lines.slice(0, beginIdx + 1);
    const after = lines.slice(endIdx);
    return [...before, generated, ...after].join('\n');
  }

  // Case 2: Trigger exists — replace with begin + content + end
  const triggerIdx = lines.findIndex((l) => l.trim() === trigger);
  if (triggerIdx >= 0) {
    lines.splice(triggerIdx, 1, begin, generated, end);
    return lines.join('\n');
  }

  // Case 3: Nothing found — append
  return `${content}\n\n${begin}\n${generated}\n${end}`;
}

/**
 * Build a set of folder paths that contain waypoint markers.
 * Used to determine where parent waypoints should stop expanding.
 */
export function findWaypointFolderSet(
  notes: NotePath[],
  contentLookup: (path: string) => string
): Set<string> {
  const folders = new Set<string>();
  for (const note of notes) {
    if (!isFolderNote(note.path)) continue;
    const content = contentLookup(note.path);
    const markers = findMarkers(content);
    if (markers.some((m) => m.type === 'waypoint')) {
      folders.add(getFolder(note.path));
    }
  }
  return folders;
}

/**
 * Build a basic MOC (Map of Content) for a folder without any waypoint logic.
 * Simple flat list of all notes in the folder, sorted alphabetically.
 */
export function buildSimpleMoc(folderPath: string, allNotes: NotePath[]): string {
  const notes = getNotesInFolder(folderPath, allNotes)
    .filter((n) => !isFolderNote(n.path) || getFolder(n.path) !== folderPath)
    .sort((a, b) => a.title.localeCompare(b.title));

  if (notes.length === 0) return '*No notes found.*';
  return notes.map((n) => `- [[${n.path}|${n.title}]]`).join('\n');
}

/**
 * Generate frontmatter + content for a new folder note with a waypoint.
 */
export function buildFolderNoteContent(
  folderName: string,
  folderPath: string,
  allNotes: NotePath[],
  waypointFolders: Set<string>
): string {
  const mocContent = generateMocContent(folderPath, allNotes, waypointFolders);
  return [
    '---',
    `tags: [moc]`,
    '---',
    '',
    `# ${folderName}`,
    '',
    BEGIN_WAYPOINT,
    mocContent,
    END_WAYPOINT,
    '',
  ].join('\n');
}
