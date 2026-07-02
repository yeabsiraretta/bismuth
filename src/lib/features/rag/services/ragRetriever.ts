/**
 * RAG Retriever — assembles context from vault notes using
 * vector similarity search + knowledge graph traversal.
 *
 * Vector search: uses the existing embedding service (lookup_by_text)
 * Graph search: traverses backlinks/outgoing links from top vector hits
 * Hybrid: combines both, deduplicates, ranks by score
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { RagConfig, RagCitation, RagContext } from '../types';

interface SimilarNote {
  path: string;
  score: number;
}

interface GraphLink {
  target: string;
  targetPath: string;
  context: string;
}

/**
 * Perform vector similarity search for a query.
 */
async function vectorSearch(query: string, topK: number): Promise<SimilarNote[]> {
  try {
    return await invoke<SimilarNote[]>('lookup_by_text', { query, topK });
  } catch (err) {
    log.warn('ragRetriever: vector search failed, falling back to empty', { error: String(err) });
    return [];
  }
}

/**
 * Expand results by traversing knowledge graph links from seed notes.
 * Does a BFS walk up to `depth` hops from each seed note.
 */
async function graphExpand(
  seedPaths: string[],
  depth: number,
  maxNodes: number
): Promise<Map<string, number>> {
  const visited = new Map<string, number>();
  const queue: Array<{ path: string; depth: number; score: number }> = [];

  for (const path of seedPaths) {
    queue.push({ path, depth: 0, score: 1.0 });
  }

  while (queue.length > 0 && visited.size < maxNodes) {
    const item = queue.shift();
    if (!item) break;
    if (visited.has(item.path)) continue;

    visited.set(item.path, item.score);

    if (item.depth >= depth) continue;

    try {
      const links = await invoke<GraphLink[]>('get_outgoing_links', { noteId: item.path });
      for (const link of links ?? []) {
        if (!visited.has(link.targetPath)) {
          queue.push({
            path: link.targetPath,
            depth: item.depth + 1,
            score: item.score * 0.6,
          });
        }
      }
    } catch {
      // Note may not exist in graph — skip silently
    }

    try {
      const backlinks = await invoke<Array<{ notePath: string }>>('get_backlinks', {
        noteId: item.path,
      });
      for (const bl of backlinks ?? []) {
        if (!visited.has(bl.notePath)) {
          queue.push({
            path: bl.notePath,
            depth: item.depth + 1,
            score: item.score * 0.5,
          });
        }
      }
    } catch {
      // Skip
    }
  }

  return visited;
}

/**
 * Read a note's content via Tauri IPC.
 */
async function readNoteContent(path: string): Promise<string> {
  try {
    const note = await invoke<{ content: string; title: string }>('read_note', { path });
    return note.content ?? '';
  } catch {
    return '';
  }
}

/**
 * Extract a title from a note path.
 */
function titleFromPath(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name.replace(/\.md$/i, '');
}

/**
 * Estimate token count (rough: ~4 chars per token).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract a relevant excerpt from note content around the query terms.
 */
function extractExcerpt(content: string, query: string, maxLen: number = 300): string {
  const lower = content.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  let bestIdx = 0;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      bestIdx = idx;
      break;
    }
  }

  const start = Math.max(0, bestIdx - 80);
  const end = Math.min(content.length, start + maxLen);
  let excerpt = content.slice(start, end).trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt;
}

/**
 * Retrieve context from the vault for a RAG query.
 * Returns assembled context text and source citations.
 */
export async function retrieveContext(query: string, config: RagConfig): Promise<RagContext> {
  const { searchMode, topK, maxContextTokens, graphDepth, excludeFolders } = config;
  const scoredPaths = new Map<string, { score: number; source: 'vector' | 'graph' }>();

  // 1. Vector search
  if (searchMode === 'vector' || searchMode === 'hybrid') {
    const results = await vectorSearch(query, topK);
    for (const r of results) {
      if (excludeFolders.some((f) => r.path.startsWith(f))) continue;
      scoredPaths.set(r.path, { score: r.score, source: 'vector' });
    }
  }

  // 2. Graph expansion
  if (searchMode === 'graph' || searchMode === 'hybrid') {
    const seeds = searchMode === 'hybrid' ? [...scoredPaths.keys()].slice(0, 3) : [];

    // For pure graph mode, do a vector search just to get seeds
    if (searchMode === 'graph') {
      const seedResults = await vectorSearch(query, 3);
      seeds.push(...seedResults.map((r) => r.path));
    }

    if (seeds.length > 0) {
      const graphNodes = await graphExpand(seeds, graphDepth, topK * 2);
      for (const [path, score] of graphNodes) {
        if (excludeFolders.some((f) => path.startsWith(f))) continue;
        const existing = scoredPaths.get(path);
        if (existing) {
          existing.score = Math.max(existing.score, score * 0.8);
        } else {
          scoredPaths.set(path, { score: score * 0.8, source: 'graph' });
        }
      }
    }
  }

  // 3. Sort by score, take topK
  const ranked = [...scoredPaths.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, topK);

  // 4. Read content and build citations
  const citations: RagCitation[] = [];
  const contextParts: string[] = [];
  let totalTokens = 0;

  for (let i = 0; i < ranked.length; i++) {
    const [path, { score, source }] = ranked[i];
    const content = await readNoteContent(path);
    if (!content) continue;

    const excerpt = extractExcerpt(content, query, 500);
    const tokens = estimateTokens(excerpt);

    if (totalTokens + tokens > maxContextTokens) break;

    totalTokens += tokens;
    const citIdx = citations.length + 1;

    citations.push({
      index: citIdx,
      notePath: path,
      noteTitle: titleFromPath(path),
      excerpt,
      score,
      source,
    });

    contextParts.push(`[${citIdx}] ${titleFromPath(path)}:\n${excerpt}`);
  }

  const contextText = contextParts.join('\n\n');

  log.info('ragRetriever: context assembled', {
    mode: searchMode,
    citations: citations.length,
    tokens: totalTokens,
  });

  return { citations, contextText, tokenEstimate: totalTokens };
}
