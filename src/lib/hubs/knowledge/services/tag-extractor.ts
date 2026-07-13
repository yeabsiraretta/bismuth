import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { extractVaultTagsNative } from '@/sal/perf-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const tagLog = log.child('tag-extractor');

export interface TagCount {
  tag: string;
  count: number;
}

export interface TagNode {
  name: string;
  count: number;
  children: TagNode[];
}

const INLINE_TAG_RE = /(?:^|\s)#([a-zA-Z][\w/-]*)/g;
const FM_FENCE = /^---\r?\n([\s\S]*?)\r?\n---/;

export function extractInlineTags(content: string): string[] {
  const tags: string[] = [];
  for (const m of content.matchAll(INLINE_TAG_RE)) {
    tags.push(m[1]);
  }
  return tags;
}

export function extractFrontmatterTags(content: string): string[] {
  const fmMatch = content.match(FM_FENCE);
  if (!fmMatch) return [];

  const fm = fmMatch[1];

  const tagBlockMatch = fm.match(/^tags:\s*\n((?:[ \t]+-[ \t]+.+\n?)+)/m);
  if (tagBlockMatch) {
    return tagBlockMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }

  const tagLineMatch = fm.match(/^tags:[ \t]+(.+)$/m);
  if (tagLineMatch) {
    const raw = tagLineMatch[1].trim();
    if (raw.startsWith('[')) {
      return raw
        .slice(1, -1)
        .split(',')
        .map((t) => t.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return [];
}

export function extractAllTags(content: string): string[] {
  return [...extractFrontmatterTags(content), ...extractInlineTags(content)];
}

export function aggregateTags(notes: { content: string }[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const note of notes) {
    const tags = extractAllTags(note.content);
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Rust-first async API ─────────────────────────────────────────

export async function getVaultTags(): Promise<TagCount[]> {
  if (isTauriAvailable()) {
    try {
      return await extractVaultTagsNative();
    } catch (err) {
      tagLog.warn('Rust extract_vault_tags failed, falling back to JS', { err });
    }
  }

  const notes = getNotes();
  const docs: { content: string }[] = [];
  for (const note of notes) {
    const content = getCachedContent(note.path);
    if (content) docs.push({ content });
  }
  return aggregateTags(docs);
}

// ── Hierarchy builder ────────────────────────────────────────

export function buildTagHierarchy(tagCounts: TagCount[]): TagNode[] {
  const nodeMap = new Map<string, TagNode>();

  for (const { tag, count } of tagCounts) {
    nodeMap.set(tag, { name: tag, count, children: [] });
  }

  const roots: TagNode[] = [];

  for (const { tag } of tagCounts) {
    const slashIdx = tag.lastIndexOf('/');
    if (slashIdx > 0) {
      const parentName = tag.slice(0, slashIdx);
      const parent = nodeMap.get(parentName);
      if (parent) {
        parent.children.push(nodeMap.get(tag)!);
        continue;
      }
    }
    roots.push(nodeMap.get(tag)!);
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}
