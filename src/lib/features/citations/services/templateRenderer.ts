/**
 * Template renderer for citation literature notes.
 *
 * Takes a CslEntry and a template string with {{variable}} placeholders
 * and returns the rendered content.
 */

import type { CslEntry, CslName, CslDate, TemplateVariables } from '../types/citation';

// ─── Name formatting ────────────────────────────────────────────────────────

function formatName(name: CslName): string {
  if (name.literal) return name.literal;
  const parts: string[] = [];
  if (name.given) parts.push(name.given);
  if (name.family) parts.push(name.family);
  return parts.join(' ');
}

function formatNames(names?: CslName[]): string {
  if (!names || names.length === 0) return '';
  if (names.length === 1) return formatName(names[0]);
  if (names.length === 2) return `${formatName(names[0])} and ${formatName(names[1])}`;
  return (
    names.slice(0, -1).map(formatName).join(', ') + ', and ' + formatName(names[names.length - 1])
  );
}

function formatNameList(names?: CslName[]): string[] {
  return (names || []).map(formatName);
}

// ─── Date formatting ────────────────────────────────────────────────────────

function extractYear(date?: CslDate): string {
  if (!date) return '';
  if (date['date-parts'] && date['date-parts'][0] && date['date-parts'][0][0]) {
    return String(date['date-parts'][0][0]);
  }
  if (date.raw) {
    const m = date.raw.match(/\d{4}/);
    return m ? m[0] : date.raw;
  }
  return date.literal || '';
}

// ─── Variable extraction ────────────────────────────────────────────────────

/**
 * Extract all template variables from a CslEntry.
 */
export function extractVariables(entry: CslEntry): TemplateVariables {
  return {
    citekey: entry.id,
    title: entry.title || '',
    titleShort: entry['title-short'] || '',
    authorString: formatNames(entry.author),
    authors: formatNameList(entry.author),
    year: extractYear(entry.issued),
    abstract: entry.abstract || '',
    containerTitle: entry['container-title'] || '',
    publisher: entry.publisher || '',
    publisherPlace: entry['publisher-place'] || '',
    eventPlace: entry['event-place'] || '',
    page: entry.page || '',
    volume: entry.volume || '',
    issue: entry.issue || '',
    DOI: entry.DOI || '',
    URL: entry.URL || '',
    ISBN: entry.ISBN || '',
    eprint: entry.eprint || '',
    eprinttype: entry.eprinttype || '',
    zoteroSelectURI: entry.zoteroSelectURI || '',
    keywords: entry.keyword || '',
    type: entry.type || '',
  };
}

// ─── Template rendering ─────────────────────────────────────────────────────

/**
 * Render a template string by substituting {{variable}} placeholders
 * with values from the given CslEntry.
 */
export function renderTemplate(template: string, entry: CslEntry): string {
  const vars = extractVariables(entry);
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  });
}

/**
 * Generate a literature note title from a template and entry.
 * Strips characters invalid for filenames.
 */
export function renderNoteTitle(template: string, entry: CslEntry): string {
  const raw = renderTemplate(template, entry);
  return raw
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build search text for fuzzy matching an entry.
 */
export function buildSearchText(entry: CslEntry): string {
  const vars = extractVariables(entry);
  return [vars.citekey, vars.title, vars.authorString, vars.year, vars.containerTitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
