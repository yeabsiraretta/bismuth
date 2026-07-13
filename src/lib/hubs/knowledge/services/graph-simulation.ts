import type { GraphEdge, GraphNode } from '@/hubs/knowledge/services/graph-builder';

export interface GraphPhysics {
  linkDistance: number;
  repulsion: number;
  attraction: number;
  damping: number;
  centerGravity: number;
  nodeRadius: number;
}

export const DEFAULT_PHYSICS: GraphPhysics = {
  linkDistance: 80,
  repulsion: 500,
  attraction: 0.005,
  damping: 0.85,
  centerGravity: 0.01,
  nodeRadius: 5,
};

// Prevent explosive forces when nodes are very close together.
// Without this, force = repulsion / dist² produces enormous values at tiny distances.
const MIN_DIST = 10;
// Prevent any single node from moving faster than this per tick.
// Catches edge cases where accumulated forces overwhelm damping.
const MAX_SPEED = 15;

export function simulateStep3D(
  nodes: GraphNode[],
  edges: GraphEdge[],
  draggingId: string | null,
  p: GraphPhysics = DEFAULT_PHYSICS,
  alpha: number = 1
): void {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    a.vx += -a.x * p.centerGravity * alpha;
    a.vy += -a.y * p.centerGravity * alpha;
    a.vz += -a.z * p.centerGravity * alpha;

    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dz = a.z - b.z;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1) {
        const angle = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        dx = Math.sin(phi) * Math.cos(angle);
        dy = Math.sin(phi) * Math.sin(angle);
        dz = Math.cos(phi);
        dist = 1;
      }
      const safeDist = Math.max(dist, MIN_DIST);
      const force = (p.repulsion / (safeDist * safeDist)) * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      a.vx += fx;
      a.vy += fy;
      a.vz += fz;
      b.vx -= fx;
      b.vy -= fy;
      b.vz -= fz;
    }
  }

  const nodeMap3D = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = nodeMap3D.get(edge.source);
    const b = nodeMap3D.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const force = (dist - p.linkDistance) * p.attraction * alpha;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    const fz = (dz / dist) * force;
    a.vx += fx;
    a.vy += fy;
    a.vz += fz;
    b.vx -= fx;
    b.vy -= fy;
    b.vz -= fz;
  }

  for (const node of nodes) {
    if (node.id === draggingId) continue;
    node.vx *= p.damping;
    node.vy *= p.damping;
    node.vz *= p.damping;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy + node.vz * node.vz);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      node.vx *= scale;
      node.vy *= scale;
      node.vz *= scale;
    }
    node.x += node.vx;
    node.y += node.vy;
    node.z += node.vz;
  }
}

export function simulateStep2D(
  nodes: GraphNode[],
  edges: GraphEdge[],
  draggingId: string | null,
  p: GraphPhysics = DEFAULT_PHYSICS,
  alpha: number = 1
): void {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    a.vx += -a.x * p.centerGravity * alpha;
    a.vy += -a.y * p.centerGravity * alpha;

    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        dist = 1;
      }
      const safeDist = Math.max(dist, MIN_DIST);
      const force = (p.repulsion / (safeDist * safeDist)) * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  const nodeMap2D = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = nodeMap2D.get(edge.source);
    const b = nodeMap2D.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - p.linkDistance) * p.attraction * alpha;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  for (const node of nodes) {
    if (node.id === draggingId) continue;
    node.vx *= p.damping;
    node.vy *= p.damping;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      node.vx *= scale;
      node.vy *= scale;
    }
    node.x += node.vx;
    node.y += node.vy;
  }
}
