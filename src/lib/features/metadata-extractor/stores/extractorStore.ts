/**
 * Metadata Extractor store — config, scheduling, and export triggers.
 *
 * Manages export config in localStorage, provides functions to run
 * each of the four exports, and supports scheduled auto-export.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { showToast } from '@/stores/toast/toast';
import type { ExtractorConfig } from '../types';
import { DEFAULT_EXTRACTOR_CONFIG } from '../types';
import {
  buildTagExport,
  buildMetadataExport,
  buildNonMdExport,
  buildCanvasExport,
} from '../services/extractorService';

const CONFIG_KEY = 'bismuth:metadata-extractor-config';

// ─── Config ────────────────────────────────────────────────────────────────────

function loadConfig(): ExtractorConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_EXTRACTOR_CONFIG, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_EXTRACTOR_CONFIG };
}

function persistConfig(config: ExtractorConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch (e) { log.warn('extractor: config persist failed', { error: String(e) }); }
}

const configStore = writable<ExtractorConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const extractorConfig = derived(configStore, $c => $c);
export const extractorEnabled = derived(configStore, $c => $c.enabled);

export function updateExtractorConfig(partial: Partial<ExtractorConfig>): void {
  configStore.update(c => ({ ...c, ...partial }));
}

export function resetExtractorConfig(): void {
  configStore.set({ ...DEFAULT_EXTRACTOR_CONFIG });
}

export function getExtractorConfig(): ExtractorConfig {
  return get(configStore);
}

// ─── Export status ─────────────────────────────────────────────────────────────

export const lastExportTime = writable<string | null>(null);
export const isExporting = writable(false);

// ─── Schedule ──────────────────────────────────────────────────────────────────

let scheduleTimer: ReturnType<typeof setInterval> | null = null;

export function startSchedule(exportAll: () => Promise<void>): void {
  stopSchedule();
  const config = get(configStore);
  if (config.frequencyMinutes <= 0) return;

  const ms = config.frequencyMinutes * 60 * 1000;
  scheduleTimer = setInterval(() => {
    exportAll().catch(e => log.warn('Scheduled export failed', { error: String(e) }));
  }, ms);

  log.info('Metadata export schedule started', { frequencyMinutes: config.frequencyMinutes });
}

export function stopSchedule(): void {
  if (scheduleTimer !== null) {
    clearInterval(scheduleTimer);
    scheduleTimer = null;
  }
}

// ─── Export runners ────────────────────────────────────────────────────────────

interface VaultAccessors {
  scanNotes: () => Promise<Array<{ path: string; title: string; content: string; frontmatter: Record<string, unknown> }>>;
  listFolders: () => Promise<string[]>;
  listNonMdFiles: () => Promise<Array<{ name: string; relativePath: string }>>;
  listCanvasFiles: () => Promise<Array<{ name: string; relativePath: string }>>;
  writeFile: (path: string, content: string) => Promise<void>;
}

/** Run all four exports. */
export async function runAllExports(accessors: VaultAccessors): Promise<void> {
  const config = get(configStore);
  if (!config.enabled) return;

  isExporting.set(true);
  try {
    const notes = await accessors.scanNotes();

    // 1. Tag export
    const tagData = buildTagExport(notes);
    await accessors.writeFile(config.tagFileName, JSON.stringify(tagData, null, 2));

    // 2. Metadata export
    const metaData = buildMetadataExport(notes);
    await accessors.writeFile(config.metadataFileName, JSON.stringify(metaData, null, 2));

    // 3. Non-MD export
    const folders = await accessors.listFolders();
    const nonMdFiles = await accessors.listNonMdFiles();
    const nonMdData = buildNonMdExport(folders, nonMdFiles);
    await accessors.writeFile(config.nonMdFileName, JSON.stringify(nonMdData, null, 2));

    // 4. Canvas export
    const canvasFiles = await accessors.listCanvasFiles();
    const canvasData = buildCanvasExport(canvasFiles);
    await accessors.writeFile(config.canvasFileName, JSON.stringify(canvasData, null, 2));

    const now = new Date().toISOString();
    lastExportTime.set(now);
    log.info('All metadata exports completed', {
      tags: tagData.length,
      notes: metaData.length,
      folders: folders.length,
    });
    showToast('Metadata exported successfully', 'success');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error('Metadata export failed', { error: msg });
    showToast(`Export failed: ${msg}`, 'error');
  } finally {
    isExporting.set(false);
  }
}

/** Run only the tag export. */
export async function runTagExport(accessors: VaultAccessors): Promise<void> {
  const config = get(configStore);
  isExporting.set(true);
  try {
    const notes = await accessors.scanNotes();
    const data = buildTagExport(notes);
    await accessors.writeFile(config.tagFileName, JSON.stringify(data, null, 2));
    showToast(`Tag export: ${data.length} tags`, 'success');
  } catch (e) {
    showToast(`Tag export failed: ${e instanceof Error ? e.message : e}`, 'error');
  } finally {
    isExporting.set(false);
  }
}

/** Run only the metadata export. */
export async function runMetadataExport(accessors: VaultAccessors): Promise<void> {
  const config = get(configStore);
  isExporting.set(true);
  try {
    const notes = await accessors.scanNotes();
    const data = buildMetadataExport(notes);
    await accessors.writeFile(config.metadataFileName, JSON.stringify(data, null, 2));
    showToast(`Metadata export: ${data.length} notes`, 'success');
  } catch (e) {
    showToast(`Metadata export failed: ${e instanceof Error ? e.message : e}`, 'error');
  } finally {
    isExporting.set(false);
  }
}
