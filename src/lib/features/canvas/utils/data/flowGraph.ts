import type { CanvasElement, FlowLink, FlowTransition } from '@/features/canvas/types';
import { generatePrefixedId } from '@/utils/id';

/** A node in the flow graph (frame element). */
export interface FlowNode {
  frameId: string;
  outgoing: FlowLink[];
  incoming: FlowLink[];
}

/** The flow graph built from a canvas document's flow links. */
export interface FlowGraph {
  nodes: Map<string, FlowNode>;
  links: FlowLink[];
}

/**
 * Builds a flow graph from the canvas document's flow links.
 */
export function buildFlowGraph(
  flowLinks: FlowLink[],
  frames: CanvasElement[]
): FlowGraph {
  const nodes = new Map<string, FlowNode>();

  // Initialize nodes for all frames
  for (const frame of frames) {
    nodes.set(frame.id, {
      frameId: frame.id,
      outgoing: [],
      incoming: [],
    });
  }

  // Populate edges
  for (const link of flowLinks) {
    const fromNode = nodes.get(link.fromFrameId);
    const toNode = nodes.get(link.toFrameId);
    if (fromNode) fromNode.outgoing.push(link);
    if (toNode) toNode.incoming.push(link);
  }

  return { nodes, links: flowLinks };
}

/**
 * Resolves the target frame for a given hotspot click within a source frame.
 * Returns the FlowLink that matches, or null if no flow link exists.
 */
export function resolveFlowTarget(
  graph: FlowGraph,
  sourceFrameId: string,
  clickedElementId?: string
): FlowLink | null {
  const node = graph.nodes.get(sourceFrameId);
  if (!node) return null;

  // First try exact hotspot match
  if (clickedElementId) {
    const hotspotLink = node.outgoing.find(
      (l) => l.hotspotElementId === clickedElementId
    );
    if (hotspotLink) return hotspotLink;
  }

  // Fall back to first outgoing link from this frame without specific hotspot
  const defaultLink = node.outgoing.find((l) => !l.hotspotElementId);
  return defaultLink ?? node.outgoing[0] ?? null;
}

/**
 * Gets all frames reachable from a starting frame (BFS traversal).
 */
export function getReachableFrames(
  graph: FlowGraph,
  startFrameId: string
): string[] {
  const visited = new Set<string>();
  const queue = [startFrameId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current);
    if (node) {
      for (const link of node.outgoing) {
        if (!visited.has(link.toFrameId)) {
          queue.push(link.toFrameId);
        }
      }
    }
  }

  return Array.from(visited);
}

/**
 * Finds the first frame in a flow (entry point) — the frame with incoming=0
 * or falls back to the first frame in document order.
 */
export function findEntryFrame(
  graph: FlowGraph,
  frames: CanvasElement[]
): string | null {
  if (frames.length === 0) return null;

  // Prefer a frame with no incoming links
  for (const frame of frames) {
    const node = graph.nodes.get(frame.id);
    if (node && node.incoming.length === 0 && node.outgoing.length > 0) {
      return frame.id;
    }
  }

  // Fallback to first frame
  return frames[0].id;
}

/**
 * Creates a new flow link between two frames.
 */
export function createFlowLink(
  fromFrameId: string,
  toFrameId: string,
  options?: {
    hotspotElementId?: string;
    transition?: FlowTransition;
    label?: string;
  }
): FlowLink {
  return {
    id: generatePrefixedId('flow'),
    fromFrameId,
    toFrameId,
    hotspotElementId: options?.hotspotElementId,
    transition: options?.transition ?? { type: 'instant', duration: 0 },
    label: options?.label,
  };
}
