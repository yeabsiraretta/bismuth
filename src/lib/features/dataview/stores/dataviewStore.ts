/**
 * Dataview index store — builds and maintains a vault-wide metadata index.
 *
 * Subscribes to the vault notes store and rebuilds page metadata on changes.
 * Provides the query execution entry point used by the CodeMirror extension.
 */

import { writable, derived, get } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import type {
  DvPage,
  DvResult,
  DvLink,
  DvTask,
  DvSection,
} from '@/features/dataview/types/dataview';
import {
  parseDocumentInlineFields,
  parseDocumentTasks,
  parseLineInlineFields,
} from '@/features/dataview/services/inlineFieldParser';
import { parseQuery } from '@/features/dataview/services/queryParser';
import { executeQuery } from '@/features/dataview/services/queryEngine';
import { queryCache } from '@/features/dataview/services/queryCache';
import { notes } from '@/stores/vault/vault';
import { log } from '@/utils/logger';

/** The full vault-wide page index. */
export const dataviewPages = writable<DvPage[]>([]);

/** Whether the index is currently rebuilding. */
export const dataviewIndexing = writable(false);

/** Derived: page count for status display. */
export const dataviewPageCount = derived(dataviewPages, ($pages) => $pages.length);

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const TASK_RE = /^[\s>]*- \[([ xX])\]\s*(.*)$/;
const TAG_RE = /#([\w/-]+)/g;

function parseSections(content: string, path: string): DvSection[] {
  const lines = content.split('\n');
  const sections: DvSection[] = [];
  let currentHeading = '';
  let currentLevel = 0;
  let currentLine = 1;
  let currentLines: string[] = [];
  let inFrontmatter = false;

  function flush() {
    const body = currentLines.join('\n');
    const fields: Record<string, any> = {};
    for (const line of currentLines) {
      for (const f of parseLineInlineFields(line, 0)) fields[f.key] = f.value;
    }
    const tasks: DvTask[] = [];
    for (let j = 0; j < currentLines.length; j++) {
      const tm = TASK_RE.exec(currentLines[j]);
      if (!tm) continue;
      const text = tm[2].trim();
      const tags: string[] = [];
      TAG_RE.lastIndex = 0;
      let tg: RegExpExecArray | null;
      while ((tg = TAG_RE.exec(text)) !== null) tags.push(tg[1]);
      tasks.push({ text, completed: tm[1] !== ' ', line: currentLine + j, path, tags });
    }
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      line: currentLine,
      content: body,
      fields,
      tasks,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && lines[i] === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (lines[i] === '---') inFrontmatter = false;
      continue;
    }
    const hm = HEADING_RE.exec(lines[i]);
    if (hm) {
      flush();
      currentHeading = hm[2];
      currentLevel = hm[1].length;
      currentLine = i + 1;
      currentLines = [];
    } else {
      currentLines.push(lines[i]);
    }
  }
  flush();
  return sections;
}

/**
 * Build a DvPage from a vault Note.
 */
function noteToPage(note: Note): DvPage {
  const pathParts = note.path.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const folder = pathParts.slice(0, -1).join('/');
  const ext = fileName.includes('.') ? fileName.split('.').pop()! : '';
  const nameWithoutExt = ext ? fileName.slice(0, -(ext.length + 1)) : fileName;

  // Extract date from file name (YYYY-MM-DD pattern)
  const dayMatch = /\d{4}-\d{2}-\d{2}/.exec(nameWithoutExt);
  const day = dayMatch ? new Date(dayMatch[0]) : null;
  const fileDay = day && !isNaN(day.getTime()) ? day : null;

  // Parse inline fields from content
  const inlineFields = parseDocumentInlineFields(note.content ?? '');

  // Parse tasks from content
  const tasks: DvTask[] = parseDocumentTasks(note.content ?? '', note.path);

  // Extract tags from frontmatter + body
  const rawTags = note.frontmatter?.['tags'];
  const fmTags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
      ? [rawTags]
      : [];
  const bodyTagRe = /(?:^|\s)#([\w/-]+)/g;
  const bodyTags: string[] = [];
  let tm: RegExpExecArray | null;
  bodyTagRe.lastIndex = 0;
  const content = note.content ?? '';
  while ((tm = bodyTagRe.exec(content)) !== null) bodyTags.push(tm[1]);
  const allTags = [...new Set([...fmTags, ...bodyTags])];

  // Extract outgoing wikilinks
  const linkRe = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const outlinks: DvLink[] = [];
  let lm: RegExpExecArray | null;
  linkRe.lastIndex = 0;
  while ((lm = linkRe.exec(content)) !== null) {
    outlinks.push({ type: 'link', path: lm[1] });
  }

  // Merge frontmatter + inline fields into a flat field map
  const fields: Record<string, any> = { ...note.frontmatter };
  for (const f of inlineFields) {
    fields[f.key] = f.value;
  }

  // Parse sections
  const sections = parseSections(content, note.path);

  return {
    path: note.path,
    file: {
      name: nameWithoutExt,
      path: note.path,
      folder,
      ext,
      link: { type: 'link', path: note.path, display: nameWithoutExt },
      ctime: note.created_at,
      mtime: note.modified_at,
      size: content.length,
      tags: allTags,
      outlinks,
      tasks,
      day: fileDay,
    },
    fields,
    inlineFields,
    tags: allTags,
    sections,
  };
}

/**
 * Rebuild the entire page index from vault notes.
 */
export function rebuildIndex(): void {
  dataviewIndexing.set(true);
  try {
    const allNotes = get(notes);
    const pages = allNotes.map(noteToPage);
    dataviewPages.set(pages);
    queryCache.invalidate();
    log.debug('Dataview index rebuilt', { pageCount: pages.length });
  } catch (error) {
    log.error('Failed to rebuild dataview index', error as Error);
  } finally {
    dataviewIndexing.set(false);
  }
}

/** Subscribe to note changes and auto-rebuild the index (debounced). */
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
const REBUILD_DEBOUNCE_MS = 500;

export function initDataviewIndex(): () => void {
  const unsub = notes.subscribe(() => {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuildIndex, REBUILD_DEBOUNCE_MS);
  });
  rebuildIndex();
  return unsub;
}

/**
 * Execute a DQL query string against the current index.
 * This is the primary entry point used by the CodeMirror extension.
 */
export function runDataviewQuery(queryStr: string): DvResult {
  const cached = queryCache.get(queryStr);
  if (cached) return cached;
  const query = parseQuery(queryStr);
  const pages = get(dataviewPages);
  const result = executeQuery(query, pages);
  queryCache.set(queryStr, result);
  return result;
}
