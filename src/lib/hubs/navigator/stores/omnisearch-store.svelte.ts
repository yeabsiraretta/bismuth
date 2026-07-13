/**
 * Omnisearch Store — Reactive wrapper around the search engine.
 * Auto-indexes vault content and provides search state for UI.
 */
import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent, isContentHydrated } from '@/hubs/editor/services/file-ops';
import {
  type InFileMatch,
  OmnisearchEngine,
  type OmnisearchResult,
} from '@/hubs/navigator/services/omnisearch-engine';
import { log } from '@/utils/log/logger';

const searchLog = log.child('omnisearch');

const engine = new OmnisearchEngine();

const RECENT_KEY = 'bismuth:recent-searches';
const RECENT_MAX = 20;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

let recentSearches = $state<string[]>(loadRecent());

let indexed = $state(false);
let indexCount = $state(0);
let searchResults = $state<OmnisearchResult[]>([]);
let inFileResults = $state<InFileMatch[]>([]);
let searching = $state(false);
let lastQuery = $state('');
let modalOpen = $state(false);
let searchMode = $state<'vault' | 'infile'>('vault');
let inFilePath = $state<string | null>(null);

// ── Getters ──────────────────────────────────────────────────────

export function isOmnisearchIndexed(): boolean {
  return indexed;
}
function getOmnisearchCount(): number {
  return indexCount;
}
export function getOmnisearchResults(): OmnisearchResult[] {
  return searchResults;
}
export function getInFileResults(): InFileMatch[] {
  return inFileResults;
}
export function isOmnisearching(): boolean {
  return searching;
}
export function getLastQuery(): string {
  return lastQuery;
}
export function isOmnisearchOpen(): boolean {
  return modalOpen;
}
export function getSearchMode(): 'vault' | 'infile' {
  return searchMode;
}
function getInFilePath(): string | null {
  return inFilePath;
}
export function getRecentSearches(): string[] {
  return recentSearches;
}

// ── Actions ──────────────────────────────────────────────────────

export function openOmnisearch(mode: 'vault' | 'infile' = 'vault', filePath?: string): void {
  searchMode = mode;
  inFilePath = filePath ?? null;
  modalOpen = true;
  searchResults = [];
  inFileResults = [];
  lastQuery = '';
}

export function closeOmnisearch(): void {
  modalOpen = false;
  searchResults = [];
  inFileResults = [];
  lastQuery = '';
}

export function toggleOmnisearch(): void {
  if (modalOpen) closeOmnisearch();
  else openOmnisearch();
}

export function setSearchMode(mode: 'vault' | 'infile', filePath?: string): void {
  searchMode = mode;
  if (filePath) inFilePath = filePath;
  if (lastQuery) performSearch(lastQuery);
}

export function performSearch(query: string): void {
  lastQuery = query;
  if (!query.trim()) {
    searchResults = [];
    inFileResults = [];
    return;
  }

  searching = true;
  try {
    if (searchMode === 'infile' && inFilePath) {
      inFileResults = engine.searchInFile(inFilePath, query);
      searchResults = [];
    } else {
      searchResults = engine.search(query);
      inFileResults = [];
    }
  } finally {
    searching = false;
  }

  addRecentSearch(query);
}

function addRecentSearch(q: string): void {
  const trimmed = q.trim();
  if (!trimmed || trimmed.length < 2) return;
  const filtered = recentSearches.filter((s) => s !== trimmed);
  filtered.unshift(trimmed);
  recentSearches = filtered.slice(0, RECENT_MAX);
  saveRecent(recentSearches);
}

export function removeRecentSearch(q: string): void {
  recentSearches = recentSearches.filter((s) => s !== q);
  saveRecent(recentSearches);
}

export function clearRecentSearches(): void {
  recentSearches = [];
  saveRecent(recentSearches);
}

function getSuggestions(prefix: string): string[] {
  return engine.suggest(prefix);
}

// ── Indexing ─────────────────────────────────────────────────────

export function indexVault(): void {
  if (!isContentHydrated()) {
    searchLog.debug('Content not hydrated yet, skipping index');
    return;
  }

  const notes = getNotes();
  const start = performance.now();
  engine.clear();

  let count = 0;
  for (const note of notes) {
    const content = getCachedContent(note.path);
    if (content !== undefined) {
      engine.addDocument(note.path, note.title, content);
      count++;
    }
  }

  indexCount = count;
  indexed = true;
  const elapsed = Math.round(performance.now() - start);
  searchLog.info(`Indexed ${count} documents in ${elapsed}ms`);
}

function indexDocument(path: string, title: string, content: string): void {
  engine.addDocument(path, title, content);
  indexCount = engine.size;
}

function removeFromIndex(path: string): void {
  engine.removeDocument(path);
  indexCount = engine.size;
}

function clearIndex(): void {
  engine.clear();
  indexed = false;
  indexCount = 0;
}

function getEngine(): OmnisearchEngine {
  return engine;
}
