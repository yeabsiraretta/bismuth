/**
 * Attachment management store — global config, per-path overrides,
 * and original-name storage keyed by MD5.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  AttachmentConfig, AttachmentOverride, OriginalNameEntry,
} from '../types';
import { DEFAULT_ATTACHMENT_CONFIG } from '../types';

const CONFIG_KEY = 'bismuth:attachment-config';
const OVERRIDES_KEY = 'bismuth:attachment-overrides';
const ORIGNAMES_KEY = 'bismuth:attachment-orignames';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
}

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { log.warn('attachmentStore: persist failed', { key, error: String(e) }); }
}

const configInternal = writable<AttachmentConfig>(
  loadJson(CONFIG_KEY, DEFAULT_ATTACHMENT_CONFIG),
);
const overridesInternal = writable<AttachmentOverride[]>(
  loadArray<AttachmentOverride>(OVERRIDES_KEY),
);
const origNamesInternal = writable<OriginalNameEntry[]>(
  loadArray<OriginalNameEntry>(ORIGNAMES_KEY),
);

configInternal.subscribe(v => persist(CONFIG_KEY, v));
overridesInternal.subscribe(v => persist(OVERRIDES_KEY, v));
origNamesInternal.subscribe(v => persist(ORIGNAMES_KEY, v));

/** Current global attachment configuration. */
export const attachmentConfig = derived(configInternal, $c => $c);

/** Per-file/folder/extension overrides. */
export const attachmentOverrides = derived(overridesInternal, $o => $o);

/** Original name storage keyed by MD5. */
export const originalNames = derived(origNamesInternal, $n => $n);

/** Update the global attachment config. */
export function updateAttachmentConfig(patch: Partial<AttachmentConfig>): void {
  configInternal.update(c => ({ ...c, ...patch }));
}

/** Reset config to defaults. */
export function resetAttachmentConfig(): void {
  configInternal.set({ ...DEFAULT_ATTACHMENT_CONFIG });
}

/** Add or update an override rule. */
export function setOverride(override: AttachmentOverride): void {
  overridesInternal.update(list => {
    const idx = list.findIndex(o => o.id === override.id);
    if (idx >= 0) return list.map((o, i) => i === idx ? override : o);
    return [...list, override];
  });
}

/** Remove an override by ID. */
export function removeOverride(id: string): void {
  overridesInternal.update(list => list.filter(o => o.id !== id));
}

/** Clear all overrides for a specific path. */
export function resetOverridesForPath(path: string): void {
  overridesInternal.update(list => list.filter(o => o.targetPath !== path));
}

/** Clear all overrides. */
export function clearOverrides(): void {
  overridesInternal.set([]);
}

/** Clear all original name entries. */
export function clearOriginalNames(): void {
  origNamesInternal.set([]);
}

/** Record an original name for an attachment (keyed by MD5). */
export function recordOriginalName(md5: string, originalName: string): void {
  origNamesInternal.update(entries => {
    if (entries.some(e => e.md5 === md5)) return entries;
    return [...entries, { md5, originalName, addedAt: Date.now() }];
  });
}

/** Look up the original name for a given MD5. */
export function getOriginalName(md5: string): string | null {
  return get(origNamesInternal).find(e => e.md5 === md5)?.originalName ?? null;
}

/** Remove entries whose files are no longer referenced. */
export function pruneOriginalNames(activeMd5s: Set<string>): number {
  const before = get(origNamesInternal).length;
  origNamesInternal.update(entries => entries.filter(e => activeMd5s.has(e.md5)));
  const after = get(origNamesInternal).length;
  const pruned = before - after;
  if (pruned > 0) log.info('attachmentStore: pruned original names', { pruned });
  return pruned;
}
