/**
 * Marginalia store — parsed notes, settings, active recall state, explorer state.
 * Persists settings to localStorage.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  MarginNote,
  MarginaliaSettings,
  ExplorerState,
  ExplorerTab,
  ExplorerGrouping,
  PrefixConfig,
  MarginDirection,
} from '../types';
import { DEFAULT_MARGINALIA_SETTINGS } from '../types';
import { parseMarginNotes, groupByColor, groupByFile } from '../services/marginParser';
import type { FileMarginNotes } from '../services/marginParser';

// ─── Storage ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'bismuth-marginalia-settings';

function loadSettings(): MarginaliaSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? { ...DEFAULT_MARGINALIA_SETTINGS, ...JSON.parse(s) } : DEFAULT_MARGINALIA_SETTINGS;
  } catch {
    return DEFAULT_MARGINALIA_SETTINGS;
  }
}

// ─── Core stores ─────────────────────────────────────────────────────────────

export const marginaliaSettings = writable<MarginaliaSettings>(loadSettings());
export const currentNotes = writable<MarginNote[]>([]);
export const vaultNotes = writable<FileMarginNotes[]>([]);
export const activeRecall = writable(false);

export const explorerState = writable<ExplorerState>({
  tab: 'current',
  grouping: 'color',
  searchQuery: '',
  collapsed: new Set(),
});

// Persist settings
marginaliaSettings.subscribe((v) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
});

// ─── Derived ─────────────────────────────────────────────────────────────────

export const filteredNotes = derived([currentNotes, explorerState], ([$notes, $state]) => {
  if (!$state.searchQuery) return $notes;
  const q = $state.searchQuery.toLowerCase();
  return $notes.filter(
    (n) => n.text.toLowerCase().includes(q) || (n.prefix?.label.toLowerCase().includes(q) ?? false)
  );
});

export const groupedNotes = derived([filteredNotes, explorerState], ([$notes, $state]) => {
  if ($state.grouping === 'color') return groupByColor($notes);
  if ($state.grouping === 'file') return groupByFile($notes);
  return new Map([['All', $notes]]);
});

export const noteCount = derived(currentNotes, ($n) => $n.length);

export const blurCount = derived(currentNotes, ($n) => $n.filter((n) => n.isBlur).length);

// ─── Actions ─────────────────────────────────────────────────────────────────

export function parseCurrentNote(content: string, filePath: string): void {
  const settings = get(marginaliaSettings);
  const notes = parseMarginNotes(content, filePath, settings.prefixes);
  currentNotes.set(notes);
  log.debug('Parsed margin notes', { count: notes.length, file: filePath });
}

export async function scanVaultNotes(): Promise<void> {
  try {
    const { scanVaultMeta } = await import('@/services/vault/vault');
    const meta = await scanVaultMeta();
    const settings = get(marginaliaSettings);

    const results: FileMarginNotes[] = [];
    for (const note of meta) {
      if (!note.path.endsWith('.md')) continue;
      try {
        const { getNote } = await import('@/services/vault/vault');
        const full = await getNote(note.path);
        if (!full?.content) continue;
        const marginNotes = parseMarginNotes(full.content, note.path, settings.prefixes);
        if (marginNotes.length > 0) {
          results.push({
            filePath: note.path,
            title: note.path.split('/').pop()?.replace('.md', '') ?? note.path,
            notes: marginNotes,
          });
        }
      } catch {
        /* skip unreadable files */
      }
    }
    vaultNotes.set(results);
    log.info('Scanned vault for marginalia', { files: results.length });
  } catch (error) {
    log.error('Failed to scan vault for marginalia', error as Error);
  }
}

export function toggleActiveRecall(): void {
  activeRecall.update((v) => !v);
}

export function setExplorerTab(tab: ExplorerTab): void {
  explorerState.update((s) => ({ ...s, tab }));
}

export function setExplorerGrouping(grouping: ExplorerGrouping): void {
  explorerState.update((s) => ({ ...s, grouping }));
}

export function setExplorerSearch(query: string): void {
  explorerState.update((s) => ({ ...s, searchQuery: query }));
}

export function toggleGroup(key: string): void {
  explorerState.update((s) => {
    const next = new Set(s.collapsed);
    next.has(key) ? next.delete(key) : next.add(key);
    return { ...s, collapsed: next };
  });
}

// ─── Settings mutations ──────────────────────────────────────────────────────

export function setAlignment(alignment: 'left' | 'right'): void {
  marginaliaSettings.update((s) => ({ ...s, alignment }));
}

export function setMarginWidth(width: number): void {
  marginaliaSettings.update((s) => ({ ...s, marginWidth: Math.max(15, Math.min(60, width)) }));
}

export function setFontSize(size: number): void {
  marginaliaSettings.update((s) => ({ ...s, fontSize: Math.max(8, Math.min(24, size)) }));
}

export function setFontFamily(fontFamily: string): void {
  marginaliaSettings.update((s) => ({ ...s, fontFamily }));
}

export function toggleReadingView(): void {
  marginaliaSettings.update((s) => ({ ...s, showInReadingView: !s.showInReadingView }));
}

export function updatePrefix(index: number, updates: Partial<PrefixConfig>): void {
  marginaliaSettings.update((s) => {
    const prefixes = [...s.prefixes];
    if (index >= 0 && index < prefixes.length) {
      prefixes[index] = { ...prefixes[index], ...updates };
    }
    return { ...s, prefixes };
  });
}

export function addPrefix(config: PrefixConfig): void {
  marginaliaSettings.update((s) => ({ ...s, prefixes: [...s.prefixes, config] }));
}

export function removePrefix(index: number): void {
  marginaliaSettings.update((s) => ({
    ...s,
    prefixes: s.prefixes.filter((_, i) => i !== index),
  }));
}

export function setDefaultDirection(direction: MarginDirection): void {
  marginaliaSettings.update((s) => ({ ...s, defaultDirection: direction }));
}

export function setLastCaptureDestination(path: string): void {
  marginaliaSettings.update((s) => ({ ...s, lastCaptureDestination: path }));
}
