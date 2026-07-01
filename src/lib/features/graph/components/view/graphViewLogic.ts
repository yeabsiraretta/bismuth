/**
 * Graph View Logic
 * Extracted rendering coordination, filter handling, and simulation lifecycle
 * from GraphView.svelte to keep the component under 300 lines.
 */

import { filterGraphData, initNodes, hitTestNode, tickForces, type SimNode } from '../../utils/simulation';
import { computeGraphLayout } from '../../services/graph';
import { type GraphLayoutWorker } from '../../workers/layoutWorkerManager';
import type { GraphData, GraphEdge, GraphSettings } from '../../types';
export interface FilterParams {
  searchQuery: string;
  showOrphans: boolean;
  isLocal: boolean;
  centerNode: string | null;
  depth: number;
  tags: string[];
  types: string[];
  folder: string;
  hiddenTags: Set<string>;
  width: number;
  height: number;
}

export interface LayoutParams {
  centerForce: number;
  repelForce: number;
  linkForce: number;
  linkDistance: number;
  width: number;
  height: number;
  nodeCount: number;
}

/** Returns filtered nodes and edges based on current filter parameters.
 *  When `bloom` is true, new nodes start at the center for animated expansion. */
export function applyFilters(
  graphData: GraphData,
  params: FilterParams,
  existingNodes: SimNode[],
  bloom = false,
): { nodes: SimNode[]; edges: GraphEdge[] } {
  const filtered = filterGraphData(graphData, {
    searchQuery: params.searchQuery,
    showOrphans: params.showOrphans,
    isLocal: params.isLocal,
    centerNode: params.centerNode,
    depth: params.depth,
    tags: params.tags,
    types: params.types,
    folder: params.folder,
    hiddenTags: params.hiddenTags,
  });
  const nodes = initNodes(filtered.nodes, filtered.edges, params.width ?? 800, params.height ?? 600, existingNodes, bloom);
  return { nodes, edges: filtered.edges };
}

/** Extracts available node types from graph data. */
export function extractAvailableTypes(graphData: GraphData): string[] {
  const typeSet = new Set<string>();
  graphData.nodes.forEach((n) => { if (n.node_type) typeSet.add(n.node_type); });
  return Array.from(typeSet).sort();
}

/** Requests backend Barnes-Hut layout and applies positions to nodes. */
export async function applyBackendLayout(
  nodes: SimNode[],
  params: LayoutParams
): Promise<SimNode[]> {
  const positions = await computeGraphLayout({
    center_force: params.centerForce,
    repel_force: params.repelForce,
    link_force: params.linkForce,
    link_distance: params.linkDistance,
    width: params.width,
    height: params.height,
    iterations: Math.min(100, Math.max(30, params.nodeCount * 2)),
  });
  const posMap = new Map(positions.map(p => [p.id, p]));
  const updated = nodes.map(node => {
    const pos = posMap.get(node.id);
    if (pos) return { ...node, x: pos.x, y: pos.y, vx: 0, vy: 0 };
    return node;
  });
  return updated;
}

/** Runs frontend warmup ticks and optionally uses the layout worker. */
export function runWarmupSimulation(
  nodes: SimNode[],
  edges: GraphEdge[],
  settings: GraphSettings,
  width: number,
  height: number,
  layoutWorker: GraphLayoutWorker | null,
  onComplete: (updated: SimNode[]) => void
): void {
  const warmupTicks = Math.min(100, Math.max(30, nodes.length * 2));
  if (layoutWorker) {
    layoutWorker.warmup(nodes, edges, settings, width, height, warmupTicks, onComplete);
  } else {
    for (let i = 0; i < warmupTicks; i++) tickForces(nodes, edges, settings, width, height);
    onComplete(nodes);
  }
}

/** Runs one animation tick via worker or inline force calculation. */
export function runAnimationTick(
  nodes: SimNode[],
  edges: GraphEdge[],
  settings: GraphSettings,
  width: number,
  height: number,
  layoutWorker: GraphLayoutWorker | null,
  onComplete: (updated: SimNode[]) => void
): void {
  if (layoutWorker) {
    layoutWorker.tick(nodes, edges, settings, width, height, onComplete);
  } else {
    tickForces(nodes, edges, settings, width, height);
    onComplete(nodes);
  }
}

/** Computes graph offset so the node centroid is centred in the viewport. */
export function computeCentreOffset(
  nodes: SimNode[],
  width: number,
  height: number
): { offsetX: number; offsetY: number } {
  if (nodes.length === 0) return { offsetX: 0, offsetY: 0 };
  const avgX = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const avgY = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
  return { offsetX: width / 2 - avgX, offsetY: height / 2 - avgY };
}

/** Hit-tests the canvas position and returns the matching node id, or null. */
export function resolveClickedNode(
  nodes: SimNode[],
  x: number,
  y: number
): string | null {
  const node = hitTestNode(nodes, x, y);
  return node ? node.id : null;
}

export interface ContextMenuActionDetail {
  action: string;
  nodeId: string;
}

/**
 * Dispatches window CustomEvents for context-menu actions on a graph node.
 * Returns the node id to open when action is 'open', null otherwise.
 */
export function dispatchContextMenuAction(
  action: string,
  nodeId: string,
  onShowLocalGraph: (id: string) => void
): string | null {
  switch (action) {
    case 'open': return nodeId;
    case 'open-new-pane':
      window.dispatchEvent(new CustomEvent('open-note-new-pane', { detail: { id: nodeId } }));
      break;
    case 'show-local-graph': onShowLocalGraph(nodeId); break;
    case 'show-backlinks':
      window.dispatchEvent(new CustomEvent('show-backlinks', { detail: { id: nodeId } }));
      break;
    case 'rename':
      window.dispatchEvent(new CustomEvent('rename-note', { detail: { id: nodeId } }));
      break;
    case 'delete':
      window.dispatchEvent(new CustomEvent('delete-note', { detail: { id: nodeId } }));
      break;
  }
  return null;
}

export type { SimNode };
