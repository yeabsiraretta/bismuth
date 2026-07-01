/**
 * Note editor logic — extracted from NoteEditor.svelte for 300-line compliance.
 * Contains frontmatter parsing, word counting, formatting, and wikilink navigation.
 */

import { log } from '@/utils/logger';
import type { Note } from '@/types/data/vault';
import { notes as allNotes, refreshNotes } from '@/stores/vault/vault';
import { writeNote as writeNoteService, getNote as getNoteService } from '@/services/vault/vault';
import { openNote } from '@/components/vault/fileTreeLogic';
import { openNoteTab } from '@/stores/editor/tabs';

// ─── Frontmatter parsing ─────────────────────────────────────────────────────

export function parseFrontmatter(raw: string): { fm: string; body: string } {
  if (!raw.startsWith('---')) return { fm: '', body: raw };
  const end = raw.indexOf('---', 3);
  if (end === -1) return { fm: '', body: raw };
  const fmEnd = end + 3;
  const fm = raw.slice(0, fmEnd);
  const remaining = raw.slice(fmEnd).replace(/^\n/, '');
  return { fm, body: remaining };
}

// ─── Content statistics ──────────────────────────────────────────────────────

export function computeStats(content: string) {
  return {
    wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
    charCount: content.length,
    lineCount: content.split('\n').length,
  };
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

const prefixMap: Record<string, string> = {
  bold: '**', italic: '*', underline: '<u>', strikethrough: '~~',
  superscript: '<sup>', subscript: '<sub>',
  code: '`', 'code-block': '```\n',
  highlight: '==',
  heading: '## ', h1: '# ', h2: '## ', h3: '### ', h4: '#### ', h5: '##### ', h6: '###### ',
  quote: '> ', callout: '> [!info]\n> ',
  list: '- ', 'list-ordered': '1. ', ul: '- ', ol: '1. ', checklist: '- [ ] ',
  link: '[[', image: '![',
  table: '| Column 1 | Column 2 |\n|---|---|\n| cell | cell |',
  hr: '---\n',
  'align-left': '<p align="left">', 'align-center': '<center>',
  'align-right': '<p align="right">', 'align-justify': '<p align="justify">',
};

const suffixMap: Record<string, string> = {
  bold: '**', italic: '*', underline: '</u>', strikethrough: '~~',
  superscript: '</sup>', subscript: '</sub>',
  code: '`', 'code-block': '\n```',
  highlight: '==',
  link: ']]', image: '](url)',
  'align-left': '</p>', 'align-center': '</center>',
  'align-right': '</p>', 'align-justify': '</p>',
};

export function getFormatStrings(type: string): { prefix: string; suffix: string } {
  return { prefix: prefixMap[type] || '', suffix: suffixMap[type] || '' };
}

// ─── Wikilink navigation ─────────────────────────────────────────────────────

export async function navigateToWikilink(title: string, vaultRootPath: string): Promise<void> {
  log.debug('Navigate to wikilink', { title });

  let found: Note | null = null;
  const unsub = allNotes.subscribe(list => {
    found = list.find(n => {
      const fileName = n.path.split('/').pop()?.replace(/\.md$/, '') || '';
      return fileName.toLowerCase() === title.toLowerCase();
    }) || null;
  });
  unsub();

  if (found) {
    await openNote(found);
  } else {
    const notePath = `${vaultRootPath}/${title}.md`;
    const noteContent = `# ${title}\n\n`;
    await writeNoteService(notePath, noteContent);
    await refreshNotes();
    const fullNote = await getNoteService(notePath);
    openNoteTab(fullNote);
    log.info('Created new note from wikilink', { title, path: notePath });
  }
}
