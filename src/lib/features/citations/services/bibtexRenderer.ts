/**
 * Pretty BibTeX Renderer — transforms raw BibTeX code block content
 * into a formatted, readable HTML card for the reading view.
 *
 * Uses the existing parseBibtex() parser to extract structured data,
 * then renders each entry as a styled card with colored header (entry type),
 * formatted authors, title, venue, identifiers, and metadata fields.
 */

import type { CslEntry, CslName, CslDate } from '../types/citation';
import { parseBibtex } from './bibtexParser';

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatName(name: CslName): string {
  if (name.literal) return name.literal;
  const parts: string[] = [];
  if (name.given) parts.push(name.given);
  if (name.family) parts.push(name.family);
  return parts.join(' ');
}

function formatAuthors(authors?: CslName[]): string {
  if (!authors || authors.length === 0) return '';
  if (authors.length === 1) return formatName(authors[0]);
  if (authors.length === 2) return `${formatName(authors[0])} and ${formatName(authors[1])}`;
  return `${authors.slice(0, -1).map(formatName).join(', ')}, and ${formatName(authors[authors.length - 1])}`;
}

function formatDate(date?: CslDate): string {
  if (!date) return '';
  if (date.raw) return date.raw;
  if (date.literal) return date.literal;
  const parts = date['date-parts']?.[0];
  if (!parts || parts.length === 0) return '';
  return parts[0].toString();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Map entry type to a human-readable label. */
function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    'article-journal': 'Article',
    book: 'Book',
    chapter: 'Book Chapter',
    'paper-conference': 'Conference Paper',
    thesis: 'Thesis',
    report: 'Report',
    webpage: 'Web Page',
    dataset: 'Dataset',
    software: 'Software',
    manuscript: 'Manuscript',
    patent: 'Patent',
    article: 'Article',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Entry → HTML ───────────────────────────────────────────────────────────

function renderField(label: string, value: string | undefined): string {
  if (!value) return '';
  return `<div class="bib-field"><span class="bib-label">${escapeHtml(label)}:</span> <span class="bib-value">${escapeHtml(value)}</span></div>`;
}

function renderLinkField(label: string, value: string | undefined, href?: string): string {
  if (!value) return '';
  const url = href ?? value;
  return `<div class="bib-field"><span class="bib-label">${escapeHtml(label)}:</span> <a class="bib-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(value)}</a></div>`;
}

function renderEntry(entry: CslEntry): string {
  const authors = formatAuthors(entry.author);
  const year = formatDate(entry.issued);
  const label = typeLabel(entry.type);

  const title = entry.title || 'Untitled';
  const doiUrl = entry.DOI ? `https://doi.org/${entry.DOI}` : undefined;

  const fields: string[] = [];

  if (authors) fields.push(renderField('Authors', authors));
  if (year) fields.push(renderField('Year', year));
  if (entry['container-title']) fields.push(renderField('Journal', entry['container-title']));
  if (entry.publisher) fields.push(renderField('Publisher', entry.publisher));
  if (entry['publisher-place']) fields.push(renderField('Location', entry['publisher-place']));
  if (entry.volume && entry.issue) {
    fields.push(renderField('Volume', `${entry.volume}(${entry.issue})`));
  } else {
    if (entry.volume) fields.push(renderField('Volume', entry.volume));
    if (entry.issue) fields.push(renderField('Issue', entry.issue));
  }
  if (entry.page) fields.push(renderField('Pages', entry.page.replace(/--/g, '\u2013')));
  if (entry.edition) fields.push(renderField('Edition', entry.edition));
  if (entry.DOI) fields.push(renderLinkField('DOI', entry.DOI, doiUrl));
  if (entry.ISBN) fields.push(renderField('ISBN', entry.ISBN));
  if (entry.URL && entry.URL !== doiUrl) fields.push(renderLinkField('URL', entry.URL));
  if (entry.abstract) {
    const truncated =
      entry.abstract.length > 250 ? entry.abstract.slice(0, 250) + '...' : entry.abstract;
    fields.push(
      `<div class="bib-abstract"><span class="bib-label">Abstract:</span> <span class="bib-value bib-abstract-text">${escapeHtml(truncated)}</span></div>`
    );
  }
  if (entry.keyword) fields.push(renderKeywords(entry.keyword));

  return `<div class="bib-entry"><div class="bib-header"><span class="bib-type">${escapeHtml(label)}</span><span class="bib-citekey">@${escapeHtml(entry.id)}</span></div><div class="bib-title">${escapeHtml(title)}</div><div class="bib-body">${fields.join('')}</div></div>`;
}

function renderKeywords(keywords: string): string {
  const tags = keywords.split(/[,;]\s*/).filter(Boolean);
  const chips = tags
    .map((t) => `<span class="bib-keyword">${escapeHtml(t.trim())}</span>`)
    .join(' ');
  return `<div class="bib-field bib-keywords"><span class="bib-label">Keywords:</span> ${chips}</div>`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render raw BibTeX text into pretty HTML cards.
 * Returns the HTML string, or null if parsing fails / no entries found.
 */
export function renderBibtexBlock(raw: string): string | null {
  try {
    const entries = parseBibtex(raw);
    if (entries.length === 0) return null;
    return `<div class="bib-container">${entries.map(renderEntry).join('')}</div>`;
  } catch {
    return null;
  }
}

/**
 * CSS styles for pretty BibTeX rendering.
 * Injected once into the document when first needed.
 */
export const BIBTEX_STYLES = `
.bib-container { display: flex; flex-direction: column; gap: 10px; margin: 0.8em 0; }
.bib-entry { border: 1px solid var(--border-color); border-radius: var(--radius-m, 8px); overflow: hidden; background: var(--background-primary); font-size: 0.88em; }
.bib-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--interactive-accent); color: white; font-size: 0.8em; font-weight: 600; }
.bib-type { text-transform: uppercase; letter-spacing: 0.05em; }
.bib-citekey { opacity: 0.85; font-family: var(--font-mono, monospace); font-weight: 400; }
.bib-title { padding: 8px 12px 4px; font-size: 1.1em; font-weight: 600; color: var(--text-normal); line-height: 1.35; }
.bib-body { padding: 4px 12px 10px; }
.bib-field { padding: 2px 0; line-height: 1.45; color: var(--text-normal); }
.bib-label { font-weight: 600; color: var(--text-muted); font-size: 0.92em; }
.bib-value { color: var(--text-normal); }
.bib-link { color: var(--interactive-accent); text-decoration: none; }
.bib-link:hover { text-decoration: underline; }
.bib-abstract { padding: 4px 0 2px; }
.bib-abstract-text { font-size: 0.92em; color: var(--text-muted); font-style: italic; }
.bib-keywords { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding-top: 4px; }
.bib-keyword { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 0.82em; background: var(--background-secondary); color: var(--text-muted); border: 1px solid var(--border-color); }
`;
