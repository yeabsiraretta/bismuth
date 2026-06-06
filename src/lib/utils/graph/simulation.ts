import type { GraphData, GraphNode, GraphEdge, GraphSettings, NodeColors } from '@/types/graph';

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

/** Initialise SimNode array with random positions and connection counts. */
export function initNodes(
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  existingNodes?: SimNode[]
): SimNode[] {
  const counts = new Map<string, number>();
  edges.forEach((e) => {
    counts.set(e.from, (counts.get(e.from) || 0) + 1);
    counts.set(e.to, (counts.get(e.to) || 0) + 1);
  });

  return graphNodes.map((node) => {
    const existing = existingNodes?.find((n) => n.id === node.id);
    return (
      existing || {
        ...node,
        connection_count: counts.get(node.id) || 0,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
      }
    );
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

  // Center force
  nodes.forEach((n) => {
    n.vx += (cx - n.x) * settings.centerForce * 0.01;
    n.vy += (cy - n.y) * settings.centerForce * 0.01;
  });

  // Repel force (n-body)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = settings.repelForce / (dist * dist);
      nodes[i].vx -= (dx / dist) * f;
      nodes[i].vy -= (dy / dist) * f;
      nodes[j].vx += (dx / dist) * f;
      nodes[j].vy += (dy / dist) * f;
    }
  }

  // Link force
  edges.forEach((edge) => {
    const src = nodes.find((n) => n.id === edge.from);
    const tgt = nodes.find((n) => n.id === edge.to);
    if (!src || !tgt) return;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (dist - settings.linkDistance) * settings.linkForce * 0.01;
    src.vx += (dx / dist) * f;
    src.vy += (dy / dist) * f;
    tgt.vx -= (dx / dist) * f;
    tgt.vy -= (dy / dist) * f;
  });

  // Integrate + damping
  nodes.forEach((n) => {
    n.x += n.vx;
    n.y += n.vy;
    n.vx *= 0.9;
    n.vy *= 0.9;
  });
}

/** Get the display radius for a node based on connections and settings. */
export function getNodeRadius(node: SimNode, settings: GraphSettings): number {
  const base = 4 * settings.nodeSize;
  const bonus = Math.min((node.connection_count || 0) * 0.5, 6);
  return base + bonus;
}

/** Get node fill color from type, with optional custom color groups. */
export function getNodeColor(
  node: GraphNode,
  colors: NodeColors,
  colorGroups: Array<{ query: string; color: string }> = []
): string {
  for (const g of colorGroups) {
    if (node.label.toLowerCase().includes(g.query.toLowerCase())) return g.color;
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
