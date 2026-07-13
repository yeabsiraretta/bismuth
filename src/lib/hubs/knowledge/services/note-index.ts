/**
 * Note Index — unified queryable index over all vault notes.
 *
 * Collects file metadata, frontmatter fields, inline fields (Key:: Value),
 * tags, outgoing links, and tasks into a single NoteRecord per note.
 * Powers the Dataview-like query engine.
 */

import type { NoteMeta } from '@/hubs/core/stores/vault-store.svelte';
import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { extractMetadata } from '@/hubs/editor/services/metadata-extractor';
import { extractAllTags } from '@/hubs/knowledge/services/tag-extractor';
import { extractWikilinks } from '@/utils/wikilink';

// ── Types ────────────────────────────────────────────────────────────────────

export interface InlineField {
  key: string;
  value: string;
}

interface FileInfo {
  path: string;
  name: string;
  folder: string;
  ext: string;
  size: number;
  ctime: number;
  mtime: number;
  link: string;
  outlinks: string[];
  inlinks: string[];
  tags: string[];
  day: string | null;
}

export interface TaskItem {
  text: string;
  completed: boolean;
  line: number;
  path: string;
}

export interface NoteRecord {
  file: FileInfo;
  frontmatter: Record<string, unknown>;
  fields: Record<string, unknown>;
  tasks: TaskItem[];
  [key: string]: unknown;
}

// ── Inline field parsing ─────────────────────────────────────────────────────

const INLINE_FIELD_RE = /(?:^|\s)(\w[\w-]*)::[ \t]+(.+?)(?:\s*$)/gm;
const BRACKET_FIELD_RE = /\[(\w[\w-]*)::[ \t]+([^\]]+)\]/g;

export function parseInlineFields(content: string): InlineField[] {
  const fields: InlineField[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;

  INLINE_FIELD_RE.lastIndex = 0;
  while ((match = INLINE_FIELD_RE.exec(content)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    const k = `${key}:${match.index}`;
    if (!seen.has(k)) {
      seen.add(k);
      fields.push({ key, value });
    }
  }

  BRACKET_FIELD_RE.lastIndex = 0;
  while ((match = BRACKET_FIELD_RE.exec(content)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    fields.push({ key, value });
  }

  return fields;
}

export function coerceFieldValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''));
  }
  return value;
}

// ── Task extraction ──────────────────────────────────────────────────────────

const TASK_RE = /^(\s*[-*+]\s)\[([ xX\-/!>])\]\s*(.*)$/;

export function extractTasks(content: string, path: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = TASK_RE.exec(lines[i]);
    if (match) {
      tasks.push({
        text: match[3].trim(),
        completed: match[2].toLowerCase() === 'x',
        line: i + 1,
        path,
      });
    }
  }
  return tasks;
}

// ── Date extraction from filename ────────────────────────────────────────────

const DATE_IN_NAME_RE = /(\d{4}-\d{2}-\d{2})/;

function extractDateFromName(name: string): string | null {
  const match = DATE_IN_NAME_RE.exec(name);
  return match ? match[1] : null;
}

// ── NoteRecord builder ───────────────────────────────────────────────────────

export function buildNoteRecord(meta: NoteMeta, content: string): NoteRecord {
  const name = meta.path.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const folder = meta.path.includes('/') ? meta.path.split('/').slice(0, -1).join('/') : '';
  const ext = meta.path.includes('.') ? (meta.path.split('.').pop() ?? '') : '';

  const extracted = extractMetadata(content);
  const tags = extractAllTags(content);
  const links = extractWikilinks(content, meta.path);
  const inlineFields = parseInlineFields(content);
  const tasks = extractTasks(content, meta.path);

  const frontmatter: Record<string, unknown> = {
    ...(extracted.title ? { title: extracted.title } : {}),
    ...(extracted.tags.length ? { tags: extracted.tags } : {}),
    ...(extracted.aliases.length ? { aliases: extracted.aliases } : {}),
    ...(extracted.created ? { created: extracted.created } : {}),
    ...(extracted.modified ? { modified: extracted.modified } : {}),
    ...extracted.custom,
  };

  const fields: Record<string, unknown> = {};
  for (const f of inlineFields) {
    fields[f.key] = coerceFieldValue(f.value);
  }

  const file: FileInfo = {
    path: meta.path,
    name,
    folder,
    ext,
    size: meta.size,
    ctime: meta.createdAt,
    mtime: meta.modifiedAt,
    link: `[[${name}]]`,
    outlinks: links.map((l) => l.targetTitle),
    inlinks: [],
    tags,
    day: extracted.created || extractDateFromName(name),
  };

  const record: NoteRecord = { file, frontmatter, fields, tasks };

  for (const [k, v] of Object.entries(frontmatter)) {
    if (!(k in record)) record[k] = v;
  }
  for (const [k, v] of Object.entries(fields)) {
    if (!(k in record)) record[k] = v;
  }

  return record;
}

// ── Full vault index ─────────────────────────────────────────────────────────

export function buildNoteIndex(): NoteRecord[] {
  const allNotes = getNotes();
  const records: NoteRecord[] = [];

  for (const note of allNotes) {
    const content = getCachedContent(note.path);
    if (content === undefined) continue;
    records.push(buildNoteRecord(note, content));
  }

  populateInlinks(records);
  return records;
}

function populateInlinks(records: NoteRecord[]): void {
  const byName = new Map<string, NoteRecord>();
  for (const r of records) {
    byName.set(r.file.name.toLowerCase(), r);
  }
  for (const r of records) {
    for (const target of r.file.outlinks) {
      const linked = byName.get(target.toLowerCase());
      if (linked && !linked.file.inlinks.includes(r.file.name)) {
        linked.file.inlinks.push(r.file.name);
      }
    }
  }
}

export function getFieldValue(record: NoteRecord, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = record;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
