/**
 * BibTeX / BibLaTeX parser.
 *
 * Parses .bib files into normalized CslEntry objects.
 * Handles standard BibTeX fields, LaTeX accent commands,
 * and Zotero Better BibTeX extensions (file attachments, keywords).
 */

import type { CslEntry, CslEntryType, CslName, CslDate } from '../types/citation';

// ─── BibTeX type → CSL type mapping ─────────────────────────────────────────

const TYPE_MAP: Record<string, CslEntryType> = {
  article: 'article-journal',
  book: 'book',
  inbook: 'chapter',
  incollection: 'chapter',
  inproceedings: 'paper-conference',
  conference: 'paper-conference',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  thesis: 'thesis',
  techreport: 'report',
  report: 'report',
  misc: 'article',
  unpublished: 'manuscript',
  online: 'webpage',
  software: 'software',
  dataset: 'dataset',
  patent: 'patent',
};

// ─── LaTeX cleanup ──────────────────────────────────────────────────────────

const LATEX_ACCENTS: Record<string, string> = {
  '`': '\u0300', "'": '\u0301', '^': '\u0302', '"': '\u0308',
  '~': '\u0303', '=': '\u0304', '.': '\u0307', 'u': '\u0306',
  'v': '\u030C', 'H': '\u030B', 'c': '\u0327', 'd': '\u0323',
};

function cleanLatex(str: string): string {
  if (!str) return '';
  let s = str;
  // Remove outer braces
  s = s.replace(/^\{|\}$/g, '');
  // {\'{e}} or \'{e} → é
  s = s.replace(/\\([`'^"~=.uvHcd])\{([a-zA-Z])\}/g, (_, accent, ch) => {
    const combining = LATEX_ACCENTS[accent];
    return combining ? ch + combining : ch;
  });
  // \'{e} without outer braces
  s = s.replace(/\\([`'^"~=.uvHcd])([a-zA-Z])/g, (_, accent, ch) => {
    const combining = LATEX_ACCENTS[accent];
    return combining ? ch + combining : ch;
  });
  // Remaining braces
  s = s.replace(/[{}]/g, '');
  // \\textit, \\textbf, \\emph
  s = s.replace(/\\(?:textit|textbf|emph)\s*/g, '');
  // \& → &
  s = s.replace(/\\&/g, '&');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s.normalize('NFC');
}

// ─── Name parsing ───────────────────────────────────────────────────────────

function parseNames(raw: string): CslName[] {
  if (!raw) return [];
  return raw.split(/\s+and\s+/i).map((name) => {
    const cleaned = cleanLatex(name.trim());
    if (!cleaned) return { literal: '' };
    // "Last, First" format
    if (cleaned.includes(',')) {
      const [family, ...rest] = cleaned.split(',');
      return { family: family.trim(), given: rest.join(',').trim() };
    }
    // "First Last" format
    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return { family: parts[0] };
    return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
  }).filter((n) => n.family || n.given || n.literal);
}

// ─── Date parsing ───────────────────────────────────────────────────────────

function parseDate(year?: string, month?: string, day?: string): CslDate | undefined {
  if (!year) return undefined;
  const y = parseInt(year, 10);
  if (isNaN(y)) return { raw: year };
  const parts: number[] = [y];
  if (month) {
    const m = parseInt(month, 10);
    if (!isNaN(m)) parts.push(m);
    if (day) { const d = parseInt(day, 10); if (!isNaN(d)) parts.push(d); }
  }
  return { 'date-parts': [parts] };
}

// ─── Main parser ────────────────────────────────────────────────────────────

interface RawBibEntry {
  type: string;
  citekey: string;
  fields: Record<string, string>;
}

function tokenizeEntries(bib: string): RawBibEntry[] {
  const ENTRY_RE = /@(\w+)\s*\{([^,}]*),/g;
  const entries: RawBibEntry[] = [];
  // Remove comments
  const cleaned = bib.replace(/%.*$/gm, '');

  let match: RegExpExecArray | null;
  while ((match = ENTRY_RE.exec(cleaned)) !== null) {
    const type = match[1].toLowerCase();
    const citekey = match[2].trim();
    if (type === 'comment' || type === 'preamble' || type === 'string') continue;

    // Find matching closing brace
    let depth = 1;
    let pos = ENTRY_RE.lastIndex;
    while (pos < cleaned.length && depth > 0) {
      if (cleaned[pos] === '{') depth++;
      else if (cleaned[pos] === '}') depth--;
      pos++;
    }
    const body = cleaned.slice(ENTRY_RE.lastIndex, pos - 1);

    // Parse fields
    const fields: Record<string, string> = {};
    const fieldRe = /(\w[\w-]*)\s*=\s*/g;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body)) !== null) {
      const key = fm[1].toLowerCase();
      let vi = fieldRe.lastIndex;
      let value = '';

      if (body[vi] === '{') {
        let d = 1; vi++;
        const start = vi;
        while (vi < body.length && d > 0) {
          if (body[vi] === '{') d++;
          else if (body[vi] === '}') d--;
          vi++;
        }
        value = body.slice(start, vi - 1);
      } else if (body[vi] === '"') {
        vi++;
        const start = vi;
        while (vi < body.length && body[vi] !== '"') {
          if (body[vi] === '\\') vi++;
          vi++;
        }
        value = body.slice(start, vi);
        vi++;
      } else {
        const end = body.indexOf(',', vi);
        value = end >= 0 ? body.slice(vi, end).trim() : body.slice(vi).trim();
      }

      fields[key] = value.trim();
      fieldRe.lastIndex = vi;
    }

    entries.push({ type, citekey, fields });
  }

  return entries;
}

function rawToEntry(raw: RawBibEntry): CslEntry {
  const f: Record<string, string> = raw.fields;
  const g = (key: string): string => f[key] || '';

  const entry: CslEntry = {
    id: raw.citekey,
    type: TYPE_MAP[raw.type] || raw.type,
    title: cleanLatex(g('title')),
    'title-short': cleanLatex(g('shorttitle')),
    author: parseNames(g('author')),
    editor: parseNames(g('editor')),
    issued: parseDate(g('year') || g('date'), g('month'), g('day')),
    'container-title': cleanLatex(g('journal') || g('booktitle') || g('journaltitle')),
    'collection-title': cleanLatex(g('series')),
    publisher: cleanLatex(g('publisher') || g('organization') || g('institution')),
    'publisher-place': cleanLatex(g('address') || g('location')),
    'event-place': cleanLatex(g('venue')),
    volume: g('volume') || undefined,
    issue: g('number') || g('issue') || undefined,
    page: g('pages') || g('page') || undefined,
    edition: g('edition') || undefined,
    language: g('language') || g('langid') || undefined,
    DOI: g('doi') || undefined,
    ISBN: g('isbn') || undefined,
    ISSN: g('issn') || undefined,
    URL: g('url') || g('howpublished') || undefined,
    eprint: g('eprint') || undefined,
    eprinttype: g('eprinttype') || g('archiveprefix') || undefined,
    abstract: cleanLatex(g('abstract')),
    keyword: g('keywords') || g('keyword') || undefined,
    note: cleanLatex(g('note') || g('annote')),
  };

  // Zotero Better BibTeX: file attachments
  if (f['file']) {
    entry.attachments = f['file']
      .split(';')
      .map((p) => p.replace(/^.*:/, '').replace(/:.*$/, '').trim())
      .filter(Boolean);
  }

  // Zotero select URI
  const zotUri = f['zoteroselecturi'] || f['zotero-select-uri'];
  if (zotUri) {
    entry.zoteroSelectURI = zotUri;
  }

  return entry;
}

/**
 * Parse a BibTeX/BibLaTeX string into normalized CslEntry objects.
 */
export function parseBibtex(bib: string): CslEntry[] {
  const raw = tokenizeEntries(bib);
  return raw.map(rawToEntry);
}
