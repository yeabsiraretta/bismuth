import { writable, derived, get } from 'svelte/store';
import {
  scanPublishableNotes,
  publishSite,
  togglePublishFlag as serviceTogglePublishFlag,
} from '../services/publishing';
import type {
  DeployTarget,
  PublishableNote,
  PublishConfig,
  PublishResult,
  PublishStatus,
  PublishHistoryEntry,
  SiteSettings,
} from '../types';
import { log } from '@/utils/logger';

const SETTINGS_KEY = 'bismuth-publish-settings';
const HISTORY_KEY = 'bismuth-publish-history';

export const publishableNotes = writable<PublishableNote[]>([]);
export const publishLoading = writable(false);
export const lastPublishResult = writable<PublishResult | null>(null);
export const publishHistory = writable<PublishHistoryEntry[]>(loadHistory());
export const siteSettings = writable<SiteSettings>(loadSiteSettings());
export const deployTarget = writable<DeployTarget>('local');
export const deployStatus = writable<'idle' | 'deploying' | 'success' | 'error'>('idle');

/** Derived: counts by status */
export const publishStats = derived(publishableNotes, ($notes) => ({
  total: $notes.length,
  published: $notes.filter(
    (n) => (n as PublishableNote & { status?: PublishStatus }).status === 'published'
  ).length,
  draft: $notes.filter(
    (n) => (n as PublishableNote & { status?: PublishStatus }).status !== 'published'
  ).length,
}));

/** Refreshes the list of publishable notes. */
export async function refreshPublishableNotes(): Promise<void> {
  publishLoading.set(true);
  try {
    const notes = await scanPublishableNotes();
    publishableNotes.set(notes);
  } catch {
    publishableNotes.set([]);
  } finally {
    publishLoading.set(false);
  }
}

/** Triggers a full publish operation. */
export async function triggerPublish(config: PublishConfig): Promise<PublishResult> {
  publishLoading.set(true);
  try {
    const result = await publishSite(config);
    lastPublishResult.set(result);
    const entry: PublishHistoryEntry = {
      timestamp: new Date().toISOString(),
      noteCount: get(publishableNotes).length,
      status: 'success',
      message: `Published ${get(publishableNotes).length} notes`,
    };
    publishHistory.update((h) => [entry, ...h].slice(0, 50));
    persistHistory();
    log.info('Site published', { noteCount: entry.noteCount });
    return result;
  } catch (error) {
    const entry: PublishHistoryEntry = {
      timestamp: new Date().toISOString(),
      noteCount: 0,
      status: 'error',
      message: `Publish failed: ${error}`,
    };
    publishHistory.update((h) => [entry, ...h].slice(0, 50));
    persistHistory();
    throw error;
  } finally {
    publishLoading.set(false);
  }
}

/** Toggle publish flag on a note's frontmatter */
export async function togglePublishFlag(notePath: string): Promise<boolean> {
  try {
    const result = await serviceTogglePublishFlag(notePath);
    await refreshPublishableNotes();
    log.info('Publish flag toggled', { path: notePath, publish: result });
    return result;
  } catch (error) {
    log.error('Failed to toggle publish flag', error as Error);
    throw error;
  }
}

/** Set publish: true on every note in the vault that has a markdown file. */
export async function publishAll(): Promise<void> {
  const notes = get(publishableNotes);
  if (notes.length === 0) return;
  publishLoading.set(true);
  try {
    for (const note of notes) {
      await serviceTogglePublishFlag(note.path);
    }
    await refreshPublishableNotes();
    const entry: PublishHistoryEntry = {
      timestamp: new Date().toISOString(),
      noteCount: notes.length,
      status: 'success',
      message: `Published all ${notes.length} notes`,
    };
    publishHistory.update((h) => [entry, ...h].slice(0, 50));
    persistHistory();
    log.info('Bulk publish all', { noteCount: notes.length });
  } catch (error) {
    log.error('Bulk publish all failed', error as Error);
    throw error;
  } finally {
    publishLoading.set(false);
  }
}

/** Remove publish: true from every currently-publishable note. */
export async function unpublishAll(): Promise<void> {
  const notes = get(publishableNotes);
  if (notes.length === 0) return;
  publishLoading.set(true);
  try {
    for (const note of notes) {
      await serviceTogglePublishFlag(note.path);
    }
    await refreshPublishableNotes();
    const entry: PublishHistoryEntry = {
      timestamp: new Date().toISOString(),
      noteCount: notes.length,
      status: 'success',
      message: `Unpublished all ${notes.length} notes`,
    };
    publishHistory.update((h) => [entry, ...h].slice(0, 50));
    persistHistory();
    log.info('Bulk unpublish all', { noteCount: notes.length });
  } catch (error) {
    log.error('Bulk unpublish all failed', error as Error);
    throw error;
  } finally {
    publishLoading.set(false);
  }
}

/** Update site settings */
export function updateSiteSettings(updates: Partial<SiteSettings>): void {
  siteSettings.update((s) => {
    const next = { ...s, ...updates };
    persistSiteSettings(next);
    return next;
  });
}

function loadSiteSettings(): SiteSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    log.warn('Failed to load site settings from localStorage', { error: String(e) });
  }
  return {
    title: 'My Site',
    description: '',
    outputFormat: 'html',
    theme: 'default',
    outputDir: '.bismuth/publish/output',
  };
}

function persistSiteSettings(s: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    log.warn('Failed to persist site settings', { error: String(e) });
  }
}

function loadHistory(): PublishHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    log.warn('Failed to load publish history from localStorage', { error: String(e) });
    return [];
  }
}

function persistHistory(): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(get(publishHistory)));
  } catch (e) {
    log.warn('Failed to persist publish history', { error: String(e) });
  }
}
