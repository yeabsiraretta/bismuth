/**
 * Citation store — reactive state for the citation library.
 *
 * Loads bibliography from .bib or .json files, provides search,
 * and manages literature note creation.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import * as vaultService from '@/services/vault/vault';
import { currentVault } from '@/stores/vault/vault';
import type { CitationConfig, CitationLibrary, CslEntry, BibFormat } from '../types/citation';
import { DEFAULT_CITATION_CONFIG } from '../types/citation';
import { parseBibtex } from '../services/bibtexParser';
import { parseCslJson } from '../services/cslJsonParser';
import { renderTemplate, renderNoteTitle, buildSearchText } from '../services/templateRenderer';

const STORAGE_KEY = 'bismuth-citation-config';

// ─── Config persistence ─────────────────────────────────────────────────────

function loadConfig(): CitationConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? { ...DEFAULT_CITATION_CONFIG, ...JSON.parse(stored) }
      : { ...DEFAULT_CITATION_CONFIG };
  } catch {
    return { ...DEFAULT_CITATION_CONFIG };
  }
}

function persistConfig(config: CitationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* non-fatal */
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const citationConfig = writable<CitationConfig>(loadConfig());
export const citationLibrary = writable<CitationLibrary | null>(null);
export const citationLoading = writable(false);
export const citationError = writable<string | null>(null);
export const citationSearchQuery = writable('');

/** Derived: entry count. */
export const entryCount = derived(citationLibrary, ($lib) => $lib?.entries.length ?? 0);

/** Derived: filtered entries based on search query. */
export const filteredEntries = derived([citationLibrary, citationSearchQuery], ([$lib, $query]) => {
  if (!$lib) return [];
  if (!$query.trim()) return $lib.entries;
  const q = $query.toLowerCase().trim();
  return $lib.entries.filter((entry) => {
    const text = buildSearchText(entry);
    return q.split(/\s+/).every((term) => text.includes(term));
  });
});

// ─── Actions ────────────────────────────────────────────────────────────────

/** Detect format from file extension. */
function detectFormat(path: string): BibFormat {
  if (path.endsWith('.json')) return 'csl-json';
  return 'bibtex';
}

/** Update citation config and persist. */
export function updateConfig(partial: Partial<CitationConfig>): void {
  citationConfig.update((c) => {
    const next = { ...c, ...partial };
    persistConfig(next);
    return next;
  });
}

/** Load the bibliography file specified in config. */
export async function loadLibrary(): Promise<void> {
  const config = get(citationConfig);
  if (!config.exportPath) {
    citationError.set('No citation export path configured');
    return;
  }

  citationLoading.set(true);
  citationError.set(null);

  try {
    const content = await vaultService.readFileText(config.exportPath);
    const format = config.format || detectFormat(config.exportPath);
    let entries: CslEntry[];

    if (format === 'csl-json') {
      entries = parseCslJson(content);
    } else {
      entries = parseBibtex(content);
    }

    citationLibrary.set({
      entries,
      format,
      loadedAt: Date.now(),
      filePath: config.exportPath,
    });

    log.info('Citation library loaded', { count: entries.length, format });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    citationError.set(msg);
    log.error('Failed to load citation library', err as Error);
  } finally {
    citationLoading.set(false);
  }
}

/** Reload the library (e.g. after file changes). */
export async function reloadLibrary(): Promise<void> {
  return loadLibrary();
}

/** Find an entry by citekey. */
export function findEntry(citekey: string): CslEntry | undefined {
  const lib = get(citationLibrary);
  if (!lib) return undefined;
  return lib.entries.find((e) => e.id === citekey);
}

/** Build the literature note path for an entry. */
export function getLiteratureNotePath(entry: CslEntry): string {
  const config = get(citationConfig);
  const title = renderNoteTitle(config.titleTemplate, entry);
  const folder = config.literatureNoteFolder;
  return folder ? `${folder}/${title}.md` : `${title}.md`;
}

/** Create or open a literature note for the given entry. */
export async function openLiteratureNote(entry: CslEntry): Promise<string> {
  const config = get(citationConfig);
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');

  const notePath = getLiteratureNotePath(entry);

  try {
    // Try to read existing note
    await vaultService.getNote(notePath);
    log.info('Opening existing literature note', { citekey: entry.id, path: notePath });
    return notePath;
  } catch {
    // Note doesn't exist — create it
    const content = renderTemplate(config.contentTemplate, entry);
    await vaultService.createNote(notePath, content);
    log.info('Created literature note', { citekey: entry.id, path: notePath });
    return notePath;
  }
}

/** Generate a Pandoc-style markdown citation for an entry. */
export function getMarkdownCitation(entry: CslEntry): string {
  const config = get(citationConfig);
  return renderTemplate(config.markdownCitationTemplate, entry);
}

/** Generate a wikilink reference to the literature note. */
export function getLiteratureNoteLink(entry: CslEntry): string {
  const config = get(citationConfig);
  const title = renderNoteTitle(config.titleTemplate, entry);
  return `[[${title}]]`;
}

/** Insert rendered content for an entry (for updating existing notes). */
export function getEntryContent(entry: CslEntry): string {
  const config = get(citationConfig);
  return renderTemplate(config.contentTemplate, entry);
}

/** Set the search query. */
export function setSearchQuery(query: string): void {
  citationSearchQuery.set(query);
}
