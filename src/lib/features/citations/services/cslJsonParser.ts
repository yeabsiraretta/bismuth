/**
 * CSL-JSON parser.
 *
 * Parses CSL-JSON bibliography exports (from Zotero, Mendeley, etc.)
 * into normalized CslEntry objects.
 */

import type { CslEntry } from '../types/citation';

/**
 * Parse a CSL-JSON string into CslEntry objects.
 * CSL-JSON is already in the target format, so this mainly validates
 * and normalizes the data.
 */
export function parseCslJson(json: string): CslEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON in CSL-JSON bibliography file');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('CSL-JSON file must contain a JSON array of entries');
  }

  return (parsed as Record<string, unknown>[]).map(normalizeEntry).filter(Boolean) as CslEntry[];
}

function normalizeEntry(raw: Record<string, unknown>): CslEntry | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw['id'] ?? raw['citation-key'] ?? '');
  if (!id) return null;

  const entry: CslEntry = {
    id,
    type: String(raw['type'] ?? 'article'),
  };

  // Copy standard CSL fields
  const stringFields = [
    'title',
    'title-short',
    'container-title',
    'collection-title',
    'publisher',
    'publisher-place',
    'event-place',
    'volume',
    'issue',
    'page',
    'edition',
    'language',
    'DOI',
    'ISBN',
    'ISSN',
    'PMID',
    'PMCID',
    'URL',
    'eprint',
    'eprinttype',
    'abstract',
    'keyword',
    'note',
  ];

  for (const field of stringFields) {
    if (raw[field] != null) {
      (entry as Record<string, unknown>)[field] = String(raw[field]);
    }
  }

  // Copy structured fields
  if (Array.isArray(raw['author'])) entry.author = raw['author'] as CslEntry['author'];
  if (Array.isArray(raw['editor'])) entry.editor = raw['editor'] as CslEntry['editor'];
  if (raw['issued'] && typeof raw['issued'] === 'object') {
    entry.issued = raw['issued'] as CslEntry['issued'];
  }
  if (raw['accessed'] && typeof raw['accessed'] === 'object') {
    entry.accessed = raw['accessed'] as CslEntry['accessed'];
  }

  return entry;
}
