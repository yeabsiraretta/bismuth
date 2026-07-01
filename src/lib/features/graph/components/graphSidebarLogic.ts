/**
 * GraphSidebarPanel logic — data fetching and state management.
 * Extracted to keep GraphSidebarPanel.svelte under 300 lines.
 */

import { getGraphData } from '../services/graph';
import type { GraphData, GraphSettings } from '../types';
import { log } from '@/utils/logger';

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  tagCount: number;
  typeBreakdown: Record<string, number>;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  showTags: true,
  showAttachments: true,
  showOrphans: true,
  showArrows: false,
  showLabels: true,
  textFadeThreshold: 0.3,
  nodeSize: 1.0,
  linkThickness: 0.5,
  centerForce: 0.1,
  repelForce: 300,
  linkForce: 0.3,
  linkDistance: 120,
  animate: true,
  damping: 0.85,
  collisionRadius: 20,
};

/** Fetches graph data and computes summary stats. */
export async function loadGraphStats(): Promise<{ data: GraphData; stats: GraphStats }> {
  try {
    const data = await getGraphData() as unknown as GraphData;
    const linkedIds = new Set<string>();
    for (const edge of data.edges) {
      linkedIds.add(edge.from);
      linkedIds.add(edge.to);
    }
    const orphanCount = data.nodes.filter(n => !linkedIds.has(n.id)).length;
    const tagNodes = data.nodes.filter(n => n.node_type === 'tag');
    const typeBreakdown: Record<string, number> = {};
    for (const node of data.nodes) {
      const t = node.node_type || 'unknown';
      typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
    }
    return {
      data,
      stats: {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
        orphanCount,
        tagCount: tagNodes.length,
        typeBreakdown,
      },
    };
  } catch (error) {
    log.error('Failed to load graph data for sidebar', error);
    return {
      data: { nodes: [], edges: [] },
      stats: { nodeCount: 0, edgeCount: 0, orphanCount: 0, tagCount: 0, typeBreakdown: {} },
    };
  }
}

/** Extracts tag-type node labels from graph data. */
export function extractTags(data: GraphData): string[] {
  return data.nodes
    .filter(n => n.node_type === 'tag')
    .map(n => n.label)
    .sort();
}

/** Extracts unique node types from graph data. */
export function extractTypes(data: GraphData): string[] {
  const typeSet = new Set<string>();
  for (const node of data.nodes) {
    if (node.node_type) typeSet.add(node.node_type);
  }
  return Array.from(typeSet).sort();
}
