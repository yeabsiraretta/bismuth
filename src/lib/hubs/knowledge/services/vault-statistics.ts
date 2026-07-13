/**
 * Pure computation functions for vault-wide statistics.
 * Inspired by bkyle/obsidian-vault-statistics-plugin.
 *
 * Primary path: Rust `compute_vault_stats` via Tauri IPC.
 * Fallback: JS computation in-browser (for `vite dev` without Tauri).
 *
 * All pure functions remain side-effect-free and testable.
 */

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { computeVaultStatsNative } from '@/sal/stats-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const statsLog = log.child('vault-statistics');

// ── Types ─────────────────────────────────────────────────────────

export interface VaultStats {
  notes: number;
  folders: number;
  attachments: number;
  totalFiles: number;
  totalWords: number;
  totalChars: number;
  totalSize: number;
  totalLinks: number;
  orphanNotes: number;
  avgWordsPerNote: number;
  avgLinksPerNote: number;
  tags: TagCount[];
  fileTypes: FileTypeCount[];
  longestNote: NoteStatEntry | null;
  shortestNote: NoteStatEntry | null;
  newestNote: NoteStatEntry | null;
  oldestNote: NoteStatEntry | null;
  lastModified: NoteStatEntry | null;
}

interface NoteStatEntry {
  path: string;
  title: string;
  value: number;
}

interface TagCount {
  tag: string;
  count: number;
}

interface FileTypeCount {
  ext: string;
  count: number;
  size: number;
}

export interface NoteInput {
  path: string;
  title: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
}

// ── Tokenizer ─────────────────────────────────────────────────────

const COMMENT_RE = /%%[\s\S]*?%%|<!--[\s\S]*?-->/g;
const CODE_BLOCK_RE = /```[\s\S]*?```/g;
const WORD_RE = /[^\s]+/g;
const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;
const MD_LINK_RE = /\[([^\]]+)\]\([^)]+\)/g;
const TAG_RE = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_/-]*)/g;
const FM_RE = /^---\s*\n([\s\S]*?)\n---/;

/**
 * Strip comment blocks (Obsidian %% ... %% and HTML <!-- ... -->)
 * so they don't count toward statistics.
 */
export function stripComments(content: string): string {
  return content.replace(COMMENT_RE, '');
}

export function countWords(content: string): number {
  const cleaned = stripComments(content).replace(CODE_BLOCK_RE, '').replace(FM_RE, '');
  const matches = cleaned.match(WORD_RE);
  return matches ? matches.length : 0;
}

export function countChars(content: string): number {
  return stripComments(content).replace(FM_RE, '').replace(/\s/g, '').length;
}

export function extractLinks(content: string): string[] {
  const links: string[] = [];
  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    links.push(m[1].trim().toLowerCase());
  }
  MD_LINK_RE.lastIndex = 0;
  while ((m = MD_LINK_RE.exec(content)) !== null) {
    links.push(m[1].trim().toLowerCase());
  }
  return links;
}

export function extractTags(content: string): string[] {
  const tags: string[] = [];
  const cleaned = stripComments(content).replace(CODE_BLOCK_RE, '');

  // Frontmatter tags
  const fmMatch = cleaned.match(FM_RE);
  if (fmMatch) {
    const tagLine = fmMatch[1].match(/^tags:\s*(.+)/m);
    if (tagLine) {
      const inline = tagLine[1].trim();
      if (inline.startsWith('[') && inline.endsWith(']')) {
        tags.push(
          ...inline
            .slice(1, -1)
            .split(',')
            .map((t) => t.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        );
      } else {
        tags.push(
          ...inline
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        );
      }
    }
    // Multiline tags
    const multiMatch = fmMatch[1].match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (multiMatch) {
      const items = multiMatch[1].matchAll(/^\s+-\s+(.+)/gm);
      for (const item of items) tags.push(item[1].trim());
    }
  }

  // Inline #tags
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(cleaned)) !== null) {
    tags.push(m[1]);
  }

  return tags;
}

// ── File classification ───────────────────────────────────────────

const NOTE_EXTENSIONS = new Set(['md', 'markdown', 'txt']);
const ATTACHMENT_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'bmp',
  'ico',
  'pdf',
  'mp3',
  'mp4',
  'wav',
  'ogg',
  'webm',
  'mov',
  'zip',
  'tar',
  'gz',
  'csv',
  'json',
  'xml',
]);

export function getExtension(path: string): string {
  return path.split('.').pop()?.toLowerCase() ?? '';
}

export function isNote(path: string): boolean {
  return NOTE_EXTENSIONS.has(getExtension(path));
}

export function isAttachment(path: string): boolean {
  return ATTACHMENT_EXTENSIONS.has(getExtension(path));
}

// ── Size formatting ───────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Folder extraction ─────────────────────────────────────────────

export function extractFolders(paths: string[]): string[] {
  const dirs = new Set<string>();
  for (const p of paths) {
    const parts = p.split('/');
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
  }
  return [...dirs];
}

// ── Main computation ──────────────────────────────────────────────

// ── Rust-first async API ─────────────────────────────────────────

export async function getVaultStats(): Promise<VaultStats> {
  if (isTauriAvailable()) {
    try {
      return await computeVaultStatsNative();
    } catch (err) {
      statsLog.warn('Rust compute_vault_stats failed, falling back to JS', { err });
    }
  }

  const notes = getNotes();
  return computeVaultStats(notes, (p) => getCachedContent(p) ?? null);
}

export function computeVaultStats(
  notes: NoteInput[],
  contentLookup: (path: string) => string | null
): VaultStats {
  let totalWords = 0;
  let totalChars = 0;
  let totalLinks = 0;
  let totalSize = 0;
  let attachments = 0;
  const tagMap = new Map<string, number>();
  const extMap = new Map<string, { count: number; size: number }>();
  const linkedNames = new Set<string>();
  const allNoteNames = new Map<string, string>();

  let longestNote: NoteStatEntry | null = null;
  let shortestNote: NoteStatEntry | null = null;
  let newestNote: NoteStatEntry | null = null;
  let oldestNote: NoteStatEntry | null = null;
  let lastModified: NoteStatEntry | null = null;

  for (const note of notes) {
    totalSize += note.size;

    const ext = getExtension(note.path);
    const existing = extMap.get(ext) ?? { count: 0, size: 0 };
    extMap.set(ext, { count: existing.count + 1, size: existing.size + note.size });

    if (!isNote(note.path)) {
      if (isAttachment(note.path)) attachments++;
      continue;
    }

    const name = note.path.split('/').pop()?.replace(/\.md$/i, '').toLowerCase() ?? '';
    allNoteNames.set(name, note.path);

    const content = contentLookup(note.path);
    if (content) {
      const wc = countWords(content);
      const cc = countChars(content);
      totalWords += wc;
      totalChars += cc;

      const links = extractLinks(content);
      totalLinks += links.length;
      for (const l of links) linkedNames.add(l);

      const tags = extractTags(content);
      for (const t of tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);

      if (!longestNote || wc > longestNote.value)
        longestNote = { path: note.path, title: note.title, value: wc };
      if (!shortestNote || wc < shortestNote.value)
        shortestNote = { path: note.path, title: note.title, value: wc };
    }

    if (!newestNote || note.createdAt > newestNote.value)
      newestNote = { path: note.path, title: note.title, value: note.createdAt };
    if (!oldestNote || note.createdAt < oldestNote.value)
      oldestNote = { path: note.path, title: note.title, value: note.createdAt };
    if (!lastModified || note.modifiedAt > lastModified.value)
      lastModified = { path: note.path, title: note.title, value: note.modifiedAt };
  }

  const noteCount = [...allNoteNames].length;
  let orphanNotes = 0;
  for (const [name] of allNoteNames) {
    if (!linkedNames.has(name)) orphanNotes++;
  }

  const folders = extractFolders(notes.map((n) => n.path));

  const tags: TagCount[] = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const fileTypes: FileTypeCount[] = [...extMap.entries()]
    .map(([ext, data]) => ({ ext, count: data.count, size: data.size }))
    .sort((a, b) => b.count - a.count);

  return {
    notes: noteCount,
    folders: folders.length,
    attachments,
    totalFiles: notes.length,
    totalWords,
    totalChars,
    totalSize,
    totalLinks,
    orphanNotes,
    avgWordsPerNote: noteCount > 0 ? Math.round(totalWords / noteCount) : 0,
    avgLinksPerNote: noteCount > 0 ? Math.round((totalLinks / noteCount) * 10) / 10 : 0,
    tags,
    fileTypes,
    longestNote,
    shortestNote,
    newestNote,
    oldestNote,
    lastModified,
  };
}
