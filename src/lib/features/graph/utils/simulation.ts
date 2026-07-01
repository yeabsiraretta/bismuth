import type { GraphData, GraphNode, GraphEdge, GraphSettings, NodeColors } from '../types';

export interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const DEFAULT_NODE_COLORS: NodeColors = {
  note: '#a8a8a8',
  attachment: '#d4a843',
  tag: '#6c9bcf',
  unresolved: '#555555',
};

/** Filter graph data based on search, settings, and local-graph mode. */
export function filterGraphData(
  data: GraphData,
  opts: {
    searchQuery?: string;
    showOrphans: boolean;
    isLocal: boolean;
    centerNode: string | null;
    depth: number;
    tags?: string[];
    types?: string[];
    folder?: string;
    hiddenTags?: Set<string>;
  }
): GraphData {
  let filteredNodes = data.nodes;

  // Exclude hidden tag nodes from graph
  if (opts.hiddenTags && opts.hiddenTags.size > 0) {
    filteredNodes = filteredNodes.filter((n) => {
      if (n.node_type === 'tag') {
        return !opts.hiddenTags!.has(n.label);
      }
      return true;
    });
  }

  if (opts.searchQuery) {
    const q = opts.searchQuery.toLowerCase();
    filteredNodes = filteredNodes.filter((n) => n.label.toLowerCase().includes(q));
  }

  if (opts.types && opts.types.length > 0) {
    filteredNodes = filteredNodes.filter((n) => opts.types!.includes(n.node_type));
  }

  if (opts.folder) {
    const prefix = opts.folder.toLowerCase();
    filteredNodes = filteredNodes.filter((n) => n.id.toLowerCase().startsWith(prefix));
  }

  if (!opts.showOrphans) {
    const connected = new Set<string>();
    data.edges.forEach((e) => {
      connected.add(e.from);
      connected.add(e.to);
    });
    filteredNodes = filteredNodes.filter((n) => connected.has(n.id));
  }

  if (opts.isLocal && opts.centerNode) {
    const ids = new Set<string>([opts.centerNode]);
    for (let d = 0; d < opts.depth; d++) {
      const current = Array.from(ids);
      data.edges.forEach((e) => {
        if (current.includes(e.from)) ids.add(e.to);
        if (current.includes(e.to)) ids.add(e.from);
      });
    }
    filteredNodes = filteredNodes.filter((n) => ids.has(n.id));
  }

  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = data.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
  return { nodes: filteredNodes, edges: filteredEdges };
}

/** Initialise SimNode array with positions and connection counts.
 *  When `bloom` is true, new nodes start at the center with slight jitter
 *  so the force simulation creates an animated expansion effect. */
export function initNodes(
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  existingNodes?: SimNode[],
  bloom = false
): SimNode[] {
  const counts = new Map<string, number>();
  edges.forEach((e) => {
    counts.set(e.from, (counts.get(e.from) || 0) + 1);
    counts.set(e.to, (counts.get(e.to) || 0) + 1);
  });

  const cx = width / 2;
  const cy = height / 2;

  return graphNodes.map((node) => {
    const existing = existingNodes?.find((n) => n.id === node.id);
    if (existing) return existing;
    const jitter = bloom ? 8 : 0;
    return {
      ...node,
      connection_count: counts.get(node.id) || 0,
      x: bloom ? cx + (Math.random() - 0.5) * jitter : Math.random() * width,
      y: bloom ? cy + (Math.random() - 0.5) * jitter : Math.random() * height,
      vx: 0,
      vy: 0,
    };
  });
}

/** One tick of the force simulation. Mutates nodes in place. */
export function tickForces(
  nodes: SimNode[],
  edges: GraphEdge[],
  settings: GraphSettings,
  width: number,
  height: number
): void {
  const cx = width / 2;
  const cy = height / 2;
  const collisionRadius = settings.collisionRadius ?? 20;
  const damping = settings.damping ?? 0.85;

  // Center force — gentle pull to keep graph in view
  for (const n of nodes) {
    n.vx += (cx - n.x) * settings.centerForce * 0.01;
    n.vy += (cy - n.y) * settings.centerForce * 0.01;
  }

  // Repel force (n-body) — Coulomb-style with minimum distance floor
  // Uses 1/d (not 1/d^2) so repulsion reaches further and nodes spread out
  const minDist = Math.max(collisionRadius, 10);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 0.1;
      // Floor distance to prevent extreme forces at close range
      const effectiveDist = Math.max(dist, minDist);
      const f = settings.repelForce / (effectiveDist * effectiveDist);
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Collision resolution — hard push apart when overlapping
  if (collisionRadius > 0) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (dist < collisionRadius * 2) {
          const overlap = (collisionRadius * 2 - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          nodes[i].x -= nx * overlap * 0.5;
          nodes[i].y -= ny * overlap * 0.5;
          nodes[j].x += nx * overlap * 0.5;
          nodes[j].y += ny * overlap * 0.5;
        }
      }
    }
  }

  // Link force — spring toward ideal distance
  const nodeMap = new Map<string, SimNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  for (const edge of edges) {
    const src = nodeMap.get(edge.from);
    const tgt = nodeMap.get(edge.to);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
    const f = (dist - settings.linkDistance) * settings.linkForce * 0.05;
    const fx = (dx / dist) * f;
    const fy = (dy / dist) * f;
    src.vx += fx;
    src.vy += fy;
    tgt.vx -= fx;
    tgt.vy -= fy;
  }

  // Integrate + damping
  for (const n of nodes) {
    n.vx *= damping;
    n.vy *= damping;
    // Cap max velocity to prevent nodes flying offscreen
    const maxV = 15;
    n.vx = Math.max(-maxV, Math.min(maxV, n.vx));
    n.vy = Math.max(-maxV, Math.min(maxV, n.vy));
    n.x += n.vx;
    n.y += n.vy;
  }
}

/** Get the display radius for a node based on connections and settings. */
export function getNodeRadius(node: SimNode, settings: GraphSettings): number {
  const base = 4 * settings.nodeSize;
  const bonus = Math.min((node.connection_count || 0) * 0.5, 6);
  return base + bonus;
}

/** Match a color group query against a node. Supports prefix syntax: path:, file:, tag: */
function matchesColorQuery(node: GraphNode, query: string): boolean {
  const q = query.trim();
  if (q.startsWith('path:')) {
    return node.id.toLowerCase().includes(q.slice(5).toLowerCase());
  }
  if (q.startsWith('file:')) {
    const filename = node.id.split('/').pop() || '';
    return filename.toLowerCase().includes(q.slice(5).toLowerCase());
  }
  if (q.startsWith('tag:')) {
    return node.node_type === 'tag' && node.label.toLowerCase().includes(q.slice(4).toLowerCase());
  }
  return node.label.toLowerCase().includes(q.toLowerCase());
}

/** Get node fill color from type, with optional custom color groups. */
export function getNodeColor(
  node: GraphNode,
  colors: NodeColors,
  colorGroups: Array<{ query: string; color: string }> = []
): string {
  for (const g of colorGroups) {
    if (matchesColorQuery(node, g.query)) return g.color;
  }
  switch (node.node_type) {
    case 'attachment':
      return colors.attachment;
    case 'tag':
      return colors.tag;
    case 'unresolved':
      return colors.unresolved;
    default:
      return colors.note;
  }
}

/** Find a node at screen coordinates (accounting for pan/zoom). */
export function hitTestNode(
  nodes: SimNode[],
  x: number,
  y: number,
  hitRadius = 10
): SimNode | undefined {
  return nodes.find((n) => {
    const dx = n.x - x;
    const dy = n.y - y;
    return Math.sqrt(dx * dx + dy * dy) < hitRadius;
  });
}
