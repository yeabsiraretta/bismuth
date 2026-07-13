/**
 * Topic Link store — reactive state for unlinked mention detection.
 * Persists the ignore list via localStorage. Mentions are computed on demand.
 */

import { TOPIC_LINK_IGNORE_KEY } from '@/constants/storage-keys';
import { getKnowledge } from '@/hubs/core/stores/settings-store.svelte';
import { getActiveNotePath, getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
import {
  buildTitleMap,
  detectUnlinkedMentions,
  linkAllMentions,
  linkMention,
  type UnlinkedMention,
} from '@/hubs/knowledge/services/topic-linking-service';
import { writeNote } from '@/sal/note-service';
import { log } from '@/utils/log/logger';

const tlLog = log.child('topic-link-store');

// ── Persisted state ──────────────────────────────────────────────────────────

let ignoreList = $state<string[]>([]);

function loadIgnoreList(): void {
  try {
    const raw = localStorage.getItem(TOPIC_LINK_IGNORE_KEY);
    if (raw) ignoreList = JSON.parse(raw);
  } catch (e) {
    tlLog.warn('Failed to load topic-link ignore list', { error: e });
  }
}

function persistIgnoreList(): void {
  localStorage.setItem(TOPIC_LINK_IGNORE_KEY, JSON.stringify(ignoreList));
}

// ── Public API ───────────────────────────────────────────────────────────────

function getIgnoreSet(): Set<string> {
  return new Set(ignoreList.map((t) => t.toLowerCase()));
}

export function getIgnoreList(): string[] {
  return ignoreList;
}

function addToIgnoreList(title: string): void {
  const lower = title.toLowerCase();
  if (!ignoreList.some((t) => t.toLowerCase() === lower)) {
    ignoreList = [...ignoreList, title];
    persistIgnoreList();
    tlLog.debug('Added to ignore list', { title });
  }
}

export function removeFromIgnoreList(title: string): void {
  const lower = title.toLowerCase();
  ignoreList = ignoreList.filter((t) => t.toLowerCase() !== lower);
  persistIgnoreList();
  tlLog.debug('Removed from ignore list', { title });
}

export function clearIgnoreList(): void {
  ignoreList = [];
  persistIgnoreList();
  tlLog.debug('Cleared ignore list');
}

/**
 * Compute unlinked mentions for the currently active note.
 * Returns empty array if no note is active or content is unavailable.
 */
export function computeMentionsForActiveNote(): UnlinkedMention[] {
  const settings = getKnowledge();
  if (!settings.topicLinkingEnabled) return [];

  const notePath = getActiveNotePath();
  if (!notePath) return [];

  const content = getCachedContent(notePath);
  if (!content) return [];

  const allPaths = getNotes().map((n) => n.path);
  const titleMap = buildTitleMap(allPaths, settings.topicLinkMinTitleLength);
  const result = detectUnlinkedMentions(content, notePath, titleMap, getIgnoreSet());

  return result.mentions;
}

/**
 * Link a single mention in the active note, writing the result to disk.
 * Re-detects the mention in the current content to handle stale positions.
 */
export async function applyLink(mention: UnlinkedMention): Promise<void> {
  const notePath = getActiveNotePath();
  if (!notePath) return;

  const content = getCachedContent(notePath);
  if (!content) return;

  // Verify the mention still exists at the expected position; re-detect if stale
  const lines = content.split('\n');
  const line = lines[mention.line];
  const textAtPos = line?.slice(mention.column, mention.column + mention.length) ?? '';
  let target = mention;
  if (textAtPos.toLowerCase() !== mention.targetTitle.toLowerCase()) {
    const titleMap = new Map<string, string>();
    titleMap.set(mention.targetTitle.toLowerCase(), mention.targetTitle);
    const fresh = detectUnlinkedMentions(content, notePath, titleMap, getIgnoreSet());
    if (fresh.mentions.length === 0) {
      tlLog.warn('Mention no longer found in content', { target: mention.targetTitle });
      return;
    }
    target = fresh.mentions[0];
  }

  const updated = linkMention(content, target);
  await writeNote(notePath, updated);
  updateCachedContent(notePath, updated);
  notifyEditorContentChanged(notePath);
  tlLog.info('Linked mention', { target: mention.targetTitle, path: notePath });
}

/**
 * Link all provided mentions in the active note at once.
 * Re-detects mentions using fresh content to handle stale positions.
 */
export async function applyLinkAll(mentions: UnlinkedMention[]): Promise<void> {
  const notePath = getActiveNotePath();
  if (!notePath) return;

  const content = getCachedContent(notePath);
  if (!content) return;

  // Re-detect with fresh content — positions may have shifted since panel rendered
  const settings = getKnowledge();
  const wantedTitles = new Set(mentions.map((m) => m.targetTitle.toLowerCase()));
  const allPaths = getNotes().map((n) => n.path);
  const fullMap = buildTitleMap(allPaths, settings.topicLinkMinTitleLength);
  const filteredMap = new Map<string, string>();
  for (const [key, val] of fullMap) {
    if (wantedTitles.has(key)) filteredMap.set(key, val);
  }
  const fresh = detectUnlinkedMentions(content, notePath, filteredMap, getIgnoreSet());
  if (fresh.mentions.length === 0) return;

  const updated = linkAllMentions(content, fresh.mentions);
  await writeNote(notePath, updated);
  updateCachedContent(notePath, updated);
  notifyEditorContentChanged(notePath);
  tlLog.info('Linked all mentions', { count: fresh.mentions.length, path: notePath });
}

/**
 * Ignore a mention title so it no longer appears in results.
 */
export function ignoreMention(mention: UnlinkedMention): void {
  addToIgnoreList(mention.targetTitle);
}

// ── Editor notification ──────────────────────────────────────────────────────

function notifyEditorContentChanged(path: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('content-externally-updated', { detail: { path } }));
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

export function initTopicLinkStore(): void {
  loadIgnoreList();
  tlLog.debug('Topic link store initialized');
}

export function destroyTopicLinkStore(): void {
  ignoreList = [];
  tlLog.debug('Topic link store destroyed');
}
