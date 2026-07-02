/**
 * JSON-based converters for Bear, Google Keep, Roam Research, and Notion exports.
 */

import type { ConvertedNote } from '../../types/importer';
import type { ImportSource } from '../../types/importer';
import { htmlToMarkdown } from './htmlToMd';

// ─── Bear ──────────────────────────────────────────────────────────────────────

interface BearNote {
  title?: string;
  text?: string;
  note?: string;
  creationDate?: string;
  modificationDate?: string;
  tags?: string[];
}

export function convertBearNotes(json: string): ConvertedNote[] {
  const data = JSON.parse(json);
  const items: BearNote[] = Array.isArray(data) ? data : [data];

  return items.map((note) => {
    const title = sanitizeTitle(note.title ?? 'Untitled');
    const body = note.text ?? note.note ?? '';
    const tags = note.tags ?? [];

    const fm: string[] = [];
    if (note.creationDate) fm.push(`created: "${note.creationDate}"`);
    if (note.modificationDate) fm.push(`modified: "${note.modificationDate}"`);
    if (tags.length > 0) fm.push(`tags: [${tags.map((t) => `"${t}"`).join(', ')}]`);

    let content = '';
    if (fm.length > 0) content += `---\n${fm.join('\n')}\n---\n\n`;
    content += body.startsWith('#') ? body : `# ${title}\n\n${body}`;

    return { title, content };
  });
}

// ─── Google Keep ───────────────────────────────────────────────────────────────

interface KeepNote {
  title?: string;
  textContent?: string;
  htmlContent?: string;
  createdTimestampUsec?: number;
  userEditedTimestampUsec?: number;
  labels?: Array<{ name: string }>;
  isPinned?: boolean;
  isTrashed?: boolean;
  isArchived?: boolean;
  listContent?: Array<{ text: string; isChecked: boolean }>;
  annotations?: Array<{ title?: string; url?: string; description?: string }>;
}

export function convertGoogleKeepNotes(json: string): ConvertedNote[] {
  const data = JSON.parse(json);
  const items: KeepNote[] = Array.isArray(data) ? data : [data];

  return items
    .filter((n) => !n.isTrashed)
    .map((note) => {
      const title = sanitizeTitle(note.title || 'Untitled Keep Note');

      const fm: string[] = [];
      if (note.createdTimestampUsec) {
        fm.push(`created: "${new Date(note.createdTimestampUsec / 1000).toISOString()}"`);
      }
      if (note.labels && note.labels.length > 0) {
        fm.push(`tags: [${note.labels.map((l) => `"${l.name}"`).join(', ')}]`);
      }
      if (note.isPinned) fm.push('pinned: true');
      if (note.isArchived) fm.push('archived: true');

      let body = '';

      // Checklist notes
      if (note.listContent && note.listContent.length > 0) {
        body = note.listContent
          .map((item) => `- [${item.isChecked ? 'x' : ' '}] ${item.text}`)
          .join('\n');
      } else {
        body = note.textContent ?? note.htmlContent ?? '';
      }

      // Annotations (links)
      if (note.annotations && note.annotations.length > 0) {
        body += '\n\n## Links\n\n';
        body += note.annotations
          .map(
            (a) =>
              `- [${a.title || a.url || 'Link'}](${a.url || ''})${a.description ? ` — ${a.description}` : ''}`
          )
          .join('\n');
      }

      let content = '';
      if (fm.length > 0) content += `---\n${fm.join('\n')}\n---\n\n`;
      content += `# ${title}\n\n${body}\n`;

      return { title, content };
    });
}

// ─── Roam Research ─────────────────────────────────────────────────────────────

interface RoamPage {
  title: string;
  children?: RoamBlock[];
  'create-time'?: number;
  'edit-time'?: number;
}

interface RoamBlock {
  string?: string;
  children?: RoamBlock[];
  'create-time'?: number;
  heading?: number;
}

export function convertRoamNotes(json: string): ConvertedNote[] {
  const pages: RoamPage[] = JSON.parse(json);

  return pages.map((page) => {
    const title = sanitizeTitle(page.title);

    const fm: string[] = [];
    if (page['create-time']) {
      fm.push(`created: "${new Date(page['create-time']).toISOString()}"`);
    }

    let body = `# ${title}\n\n`;
    if (page.children) {
      body += convertRoamBlocks(page.children, 0);
    }

    let content = '';
    if (fm.length > 0) content += `---\n${fm.join('\n')}\n---\n\n`;
    content += body;

    return { title, content };
  });
}

function convertRoamBlocks(blocks: RoamBlock[], depth: number): string {
  return blocks
    .map((block) => {
      let text = block.string ?? '';

      // Convert Roam syntax to standard Markdown
      text = text
        .replace(/\{\{TODO\}\}/g, '- [ ] ')
        .replace(/\{\{DONE\}\}/g, '- [x] ')
        .replace(/\(\((.+?)\)\)/g, '[[$1]]') // block refs → wikilinks
        .replace(/#\[\[(.+?)\]\]/g, '#$1') // Roam tags → standard tags
        .replace(/\^\^(.+?)\^\^/g, '==$1=='); // highlight

      const indent = '  '.repeat(depth);
      let line = '';

      if (block.heading) {
        line = `${'#'.repeat(block.heading)} ${text}\n\n`;
      } else {
        line = `${indent}- ${text}\n`;
      }

      if (block.children) {
        line += convertRoamBlocks(block.children, depth + 1);
      }

      return line;
    })
    .join('');
}

// ─── Evernote ENEX ─────────────────────────────────────────────────────────────

/**
 * Parse Evernote .enex XML into notes.
 * ENEX is XML with <note> elements containing <title>, <content> (XHTML in CDATA),
 * <created>, <updated>, <tag> elements.
 */
export function convertEvernoteEnex(xml: string): ConvertedNote[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const noteElements = doc.querySelectorAll('note');
  const notes: ConvertedNote[] = [];

  noteElements.forEach((noteEl) => {
    const title = sanitizeTitle(noteEl.querySelector('title')?.textContent ?? 'Untitled');
    const contentEl = noteEl.querySelector('content');
    const rawContent = contentEl?.textContent ?? '';
    const created = noteEl.querySelector('created')?.textContent ?? '';
    const updated = noteEl.querySelector('updated')?.textContent ?? '';
    const tags = Array.from(noteEl.querySelectorAll('tag'))
      .map((t) => t.textContent ?? '')
      .filter(Boolean);

    // Parse the inner XHTML content
    let body: string;
    try {
      body = htmlToMarkdown(rawContent);
    } catch {
      // Fallback: strip HTML tags
      body = rawContent.replace(/<[^>]*>/g, '').trim();
    }

    const fm: string[] = [];
    if (created) fm.push(`created: "${formatEvernoteDate(created)}"`);
    if (updated) fm.push(`modified: "${formatEvernoteDate(updated)}"`);
    if (tags.length > 0) fm.push(`tags: [${tags.map((t) => `"${t}"`).join(', ')}]`);

    let content = '';
    if (fm.length > 0) content += `---\n${fm.join('\n')}\n---\n\n`;
    content += `# ${title}\n\n${body}\n`;

    notes.push({ title, content });
  });

  return notes;
}

/** Convert Evernote date format "20130516T054600Z" to ISO. */
function formatEvernoteDate(dateStr: string): string {
  try {
    const m = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────

/** Route JSON content to the appropriate converter based on source type. */
export function convertJsonNotes(json: string, source: ImportSource): ConvertedNote[] {
  switch (source) {
    case 'bear':
      return convertBearNotes(json);
    case 'google-keep':
      return convertGoogleKeepNotes(json);
    case 'roam':
      return convertRoamNotes(json);
    default:
      return [];
  }
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

function sanitizeTitle(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) || 'Untitled'
  );
}
