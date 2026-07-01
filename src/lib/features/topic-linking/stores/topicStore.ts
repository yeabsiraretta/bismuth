/**
 * Topic Linking store — config persistence and command runners.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { showToast } from '@/stores/toast/toast';
import type { TopicLinkingConfig, TopicLinkingResult } from '../types';
import { DEFAULT_TOPIC_LINKING_CONFIG } from '../types';
import {
  linkTopics,
  generateTopicIndex,
  generateTopicNote,
  getTopicFolderPath,
  extractWebLinks,
  generateWebLinkNote,
} from '../services/topicLinker';

const CONFIG_KEY = 'bismuth:topic-linking-config';

// ─── Config ────────────────────────────────────────────────────────────────────

function loadConfig(): TopicLinkingConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_TOPIC_LINKING_CONFIG, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_TOPIC_LINKING_CONFIG };
}

function persistConfig(config: TopicLinkingConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch (e) { log.warn('topic-linking: config persist failed', { error: String(e) }); }
}

const configStore = writable<TopicLinkingConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const topicConfig = derived(configStore, $c => $c);

export function updateTopicConfig(partial: Partial<TopicLinkingConfig>): void {
  configStore.update(c => ({ ...c, ...partial }));
}

export function resetTopicConfig(): void {
  configStore.set({ ...DEFAULT_TOPIC_LINKING_CONFIG });
}

export function getTopicConfig(): TopicLinkingConfig {
  return get(configStore);
}

// ─── Run state ─────────────────────────────────────────────────────────────────

export const topicResult = writable<TopicLinkingResult | null>(null);
export const topicRunning = writable(false);

// ─── Vault accessors (dependency injection) ────────────────────────────────────

interface VaultAccessors {
  scanNotes: () => Promise<Array<{ path: string; content: string }>>;
  scanFolder: (folder: string) => Promise<Array<{ path: string; content: string }>>;
  writeFile: (path: string, content: string) => Promise<void>;
  createFolder: (path: string) => Promise<void>;
}

// ─── Link Topics command ───────────────────────────────────────────────────────

export async function runLinkTopics(accessors: VaultAccessors): Promise<void> {
  const config = get(configStore);
  topicRunning.set(true);

  try {
    const notes = await accessors.scanNotes();
    log.info('Topic linking: scanning notes', { count: notes.length });

    const result = linkTopics(notes, config);
    topicResult.set(result);

    // Generate output
    const folderPath = getTopicFolderPath(config);
    await accessors.createFolder(folderPath);

    // Write index
    const indexContent = generateTopicIndex(result, folderPath);
    await accessors.writeFile(`${folderPath}/Topic Index.md`, indexContent);

    // Write individual topic notes
    for (const topic of result.topics) {
      const noteContent = generateTopicNote(topic, folderPath);
      await accessors.writeFile(`${folderPath}/Topic ${topic.id + 1}.md`, noteContent);
    }

    log.info('Topic linking: complete', {
      topics: result.topics.length,
      documents: result.documentCount,
    });
    showToast(
      `Generated ${result.topics.length} topics from ${result.documentCount} documents`,
      'success',
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error('Topic linking failed', { error: msg });
    showToast(`Topic linking failed: ${msg}`, 'error');
  } finally {
    topicRunning.set(false);
  }
}

// ─── Extract Web Links command ─────────────────────────────────────────────────

export async function runExtractWebLinks(accessors: VaultAccessors): Promise<void> {
  const config = get(configStore);
  topicRunning.set(true);

  try {
    const notes = await accessors.scanFolder(config.bookmarkFolder);
    const links = extractWebLinks(notes);

    await accessors.createFolder(config.generatedFolder);

    let written = 0;
    for (const link of links) {
      try {
        const hostname = new URL(link.url).hostname.replace(/\./g, '_');
        const slug = (link.displayText || hostname).replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 60).trim();
        const fileName = `${config.generatedFolder}/${slug || hostname}.md`;
        const content = generateWebLinkNote(link);
        await accessors.writeFile(fileName, content);
        written++;
      } catch {
        // Skip invalid URLs
      }
    }

    log.info('Web link extraction: complete', { links: links.length, written });
    showToast(`Extracted ${written} web links from ${notes.length} bookmark files`, 'success');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error('Web link extraction failed', { error: msg });
    showToast(`Web link extraction failed: ${msg}`, 'error');
  } finally {
    topicRunning.set(false);
  }
}
