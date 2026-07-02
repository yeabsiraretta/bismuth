/**
 * Link embed service — fetches URL metadata via Tauri IPC,
 * manages caching, and provides embed creation utilities.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { LinkEmbedData } from '../types';
import { serializeLinkEmbedData } from '../types';

const CACHE_KEY = 'bismuth-link-embed-cache';
const CACHE_MAX = 200;

let cache: Map<string, LinkEmbedData> = new Map();

/** Load cache from localStorage. */
function loadCache(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const entries: [string, LinkEmbedData][] = JSON.parse(raw);
      cache = new Map(entries);
    }
  } catch {
    cache = new Map();
  }
}

/** Save cache to localStorage. */
function saveCache(): void {
  try {
    const entries = Array.from(cache.entries()).slice(-CACHE_MAX);
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    log.warn('Link embed: failed to save cache');
  }
}

loadCache();

/** Fetch metadata for a URL. Uses cache if available. */
export async function fetchLinkMetadata(url: string): Promise<LinkEmbedData> {
  const cached = cache.get(url);
  if (cached) return cached;

  log.info('Link embed: fetching metadata', { url });

  try {
    const result = await invoke<LinkEmbedData>('fetch_url_metadata', { url });
    const data: LinkEmbedData = {
      ...result,
      parser: 'local',
      date: new Date().toISOString().slice(0, 10),
    };
    cache.set(url, data);
    saveCache();
    return data;
  } catch (error) {
    log.error('Link embed: fetch failed', error as Error, { url });
    throw new Error(`Failed to fetch metadata for ${url}`);
  }
}

/** Build a ```link-embed code block string from embed data. */
export function buildEmbedCodeBlock(data: LinkEmbedData): string {
  return '```link-embed\n' + serializeLinkEmbedData(data) + '\n```';
}

/** Build a markdown link from embed data. */
export function buildMarkdownLinkFromEmbed(data: LinkEmbedData): string {
  const title = data.title || data.url;
  return `[${title}](${data.url})`;
}

/** Clear the metadata cache. */
export function clearLinkEmbedCache(): void {
  cache.clear();
  localStorage.removeItem(CACHE_KEY);
}
