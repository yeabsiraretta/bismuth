/**
 * Smart Connections service — semantic similarity-based connections.
 * Uses the existing embedding backend to find related notes/blocks
 * and builds graph data structures for the Smart Graph Visualizer.
 */

import { getSimilarNotes } from './graph';
import type {
  GraphNode,
  GraphEdge,
  SmartConnection,
  SmartGraphSettings,
  ConnectionMode,
} from '../types';
import { log } from '@/utils/logger';
import { notes } from '@/stores/vault/vault';
import { get } from 'svelte/store';

export const DEFAULT_SMART_SETTINGS: SmartGraphSettings = {
  minRelevance: 0.3,
  connectionMode: 'note',
  minLinkThickness: 1,
  maxLinkThickness: 6,
  nodeLabelSize: 11,
  linkLabelSize: 9,
  maxLabelChars: 30,
  showLinkLabels: true,
  showPreviewOnHover: true,
  centerNodeScale: 2.0,
};

/**
 * Fetches smart connections for a single note using the embeddings backend.
 * Returns scored connection results.
 */
export async function getSmartConnections(
  notePath: string,
  topK: number = 20,
  mode: ConnectionMode = 'note'
): Promise<SmartConnection[]> {
  try {
    const results = await getSimilarNotes(notePath, topK);
    const allNotes = get(notes);

    return results
      .filter((r) => r.path !== notePath)
      .map((r) => {
        const note = allNotes.find((n) => n.path === r.path);
        const isBlock = r.path.includes('#');
        const label = note?.title ?? extractLabel(r.path);
        return {
          path: r.path,
          score: r.score,
          isBlock,
          label,
          excerpt: note?.content?.slice(0, 200),
        };
      })
      .filter((c) => mode === 'block' || !c.isBlock);
  } catch (error) {
    log.warn('Smart connections lookup failed', { notePath, error: String(error) });
    return [];
  }
}

/**
 * Builds graph nodes and edges from smart connections for the visualizer.
 * The center note is the primary node; connections become satellite nodes.
 * Edge relevance is set so layout distance is proportional to similarity.
 */
export function buildSmartGraph(
  centerPath: string,
  centerLabel: string,
  connections: SmartConnection[],
  settings: SmartGraphSettings
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const filtered = connections.filter((c) => c.score >= settings.minRelevance);

  if (settings.connectionMode === 'note') {
    // Deduplicate: keep highest-scored connection per base note path
    const byNote = new Map<string, SmartConnection>();
    for (const c of filtered) {
      const basePath = c.path.split('#')[0];
      const existing = byNote.get(basePath);
      if (!existing || c.score > existing.score) {
        byNote.set(basePath, { ...c, path: basePath, isBlock: false });
      }
    }
    return buildGraphFromConnections(centerPath, centerLabel, Array.from(byNote.values()));
  }

  return buildGraphFromConnections(centerPath, centerLabel, filtered);
}

function buildGraphFromConnections(
  centerPath: string,
  centerLabel: string,
  connections: SmartConnection[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    {
      id: centerPath,
      label: centerLabel,
      node_type: 'note',
      connection_count: connections.length,
    },
  ];

  const edges: GraphEdge[] = [];

  for (const conn of connections) {
    nodes.push({
      id: conn.path,
      label: conn.label,
      node_type: conn.isBlock ? 'attachment' : 'note',
      connection_count: 1,
    });

    edges.push({
      from: centerPath,
      to: conn.path,
      edge_type: 'smart',
      relevance: conn.score,
    });
  }

  return { nodes, edges };
}

/** Compute link thickness based on relevance score and min/max settings. */
export function getRelevanceThickness(
  relevance: number,
  minThickness: number,
  maxThickness: number
): number {
  const clamped = Math.max(0, Math.min(1, relevance));
  return minThickness + clamped * (maxThickness - minThickness);
}

/** Compute ideal link distance inversely proportional to relevance. */
export function getRelevanceDistance(relevance: number, baseLinkDistance: number): number {
  const clamped = Math.max(0.1, Math.min(1, relevance));
  return baseLinkDistance * (1.2 - clamped);
}

/** Truncate label to max chars, adding ellipsis if needed. */
export function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return label.slice(0, maxChars - 1) + '\u2026';
}

/** Extract a display label from a file path. */
function extractLabel(path: string): string {
  const name = path.split('/').pop() ?? path;
  return name.replace(/\.md$/, '').replace(/#/g, ' > ');
}

/** Get a short preview excerpt for a note. */
export function getNoteExcerpt(notePath: string, maxLen: number = 200): string {
  const allNotes = get(notes);
  const note = allNotes.find((n) => n.path === notePath);
  if (!note?.content) return '';
  const clean = note.content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^#+\s+.*$/gm, '')
    .trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1) + '\u2026';
}
