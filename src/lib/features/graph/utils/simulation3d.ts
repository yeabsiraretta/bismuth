/**
 * 3D force-directed simulation — extends the 2D simulation with Z-axis forces.
 */

import type { GraphNode, GraphEdge } from '../types';
import type { SimNode3D, Graph3DSettings, Camera3D, NodeAppearance3D } from '../types/graph3d';
import { getNodeColor, DEFAULT_NODE_COLORS } from './simulation';

// ─── Init ───────────────────────────────────────────────────────────────────

export function initNodes3D(
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  existing: SimNode3D[] = [],
  bloom = false
): SimNode3D[] {
  const counts = new Map<string, number>();
  edges.forEach((e) => {
    counts.set(e.from, (counts.get(e.from) || 0) + 1);
    counts.set(e.to, (counts.get(e.to) || 0) + 1);
  });
  return graphNodes.map((node) => {
    const ex = existing.find((n) => n.id === node.id);
    if (ex) return { ...ex, ...node, connection_count: counts.get(node.id) || ex.connection_count };
    const spread = bloom ? 20 : 400;
    return {
      ...node,
      connection_count: counts.get(node.id) || 0,
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread,
      vx: 0,
      vy: 0,
      vz: 0,
    };
  });
}

// ─── Force tick ─────────────────────────────────────────────────────────────

export function tickForces3D(
  nodes: SimNode3D[],
  edges: GraphEdge[],
  settings: Graph3DSettings
): void {
  const damping = settings.damping;

  // Center force
  for (const n of nodes) {
    n.vx -= n.x * settings.centerForce * 0.01;
    n.vy -= n.y * settings.centerForce * 0.01;
    n.vz -= n.z * settings.centerForce * 0.01;
  }

  // Repel force (n-body)
  const minDist = 15;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dz = nodes[j].z - nodes[i].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
      const eff = Math.max(dist, minDist);
      const f = settings.repelForce / (eff * eff);
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      const fz = (dz / dist) * f;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[i].vz -= fz;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
      nodes[j].vz += fz;
    }
  }

  // Link force (spring)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const src = nodeMap.get(edge.from);
    const tgt = nodeMap.get(edge.to);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dz = tgt.z - src.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
    const f = (dist - settings.linkDistance) * settings.linkForce * 0.05;
    const fx = (dx / dist) * f;
    const fy = (dy / dist) * f;
    const fz = (dz / dist) * f;
    src.vx += fx;
    src.vy += fy;
    src.vz += fz;
    tgt.vx -= fx;
    tgt.vy -= fy;
    tgt.vz -= fz;
  }

  // Integrate
  const maxV = 12;
  for (const n of nodes) {
    n.vx *= damping;
    n.vy *= damping;
    n.vz *= damping;
    n.vx = Math.max(-maxV, Math.min(maxV, n.vx));
    n.vy = Math.max(-maxV, Math.min(maxV, n.vy));
    n.vz = Math.max(-maxV, Math.min(maxV, n.vz));
    n.x += n.vx;
    n.y += n.vy;
    n.z += n.vz;
  }
}

// ─── Projection ─────────────────────────────────────────────────────────────

export function projectNode(
  node: SimNode3D,
  camera: Camera3D,
  width: number,
  height: number
): { sx: number; sy: number; scale: number; behind: boolean } {
  // Translate to camera-relative
  const rx = node.x - camera.focusX;
  const ry = node.y - camera.focusY;
  const rz = node.z - camera.focusZ;

  // Rotate by theta (Y-axis) then phi (X-axis)
  const cosT = Math.cos(camera.theta),
    sinT = Math.sin(camera.theta);
  const cosP = Math.cos(camera.phi),
    sinP = Math.sin(camera.phi);

  const x1 = rx * cosT + rz * sinT;
  const z1 = -rx * sinT + rz * cosT;
  const y1 = ry * cosP - z1 * sinP;
  const z2 = ry * sinP + z1 * cosP;

  const ez = z2 + camera.distance;
  if (ez < 1) return { sx: -999, sy: -999, scale: 0, behind: true };

  const fov = 800;
  const scale = fov / ez;
  return {
    sx: width / 2 + x1 * scale,
    sy: height / 2 - y1 * scale,
    scale,
    behind: false,
  };
}

export function projectAllNodes(
  nodes: SimNode3D[],
  camera: Camera3D,
  width: number,
  height: number
): void {
  for (const n of nodes) {
    const p = projectNode(n, camera, width, height);
    n.screenX = p.sx;
    n.screenY = p.sy;
    n.screenScale = p.behind ? 0 : p.scale;
  }
}

// ─── Hit testing ────────────────────────────────────────────────────────────

export function hitTestNode3D(
  nodes: SimNode3D[],
  sx: number,
  sy: number,
  hitRadius = 14
): SimNode3D | undefined {
  // Sort by depth (closest to camera first) for correct picking
  const sorted = [...nodes]
    .filter((n) => (n.screenScale ?? 0) > 0)
    .sort((a, b) => (b.screenScale ?? 0) - (a.screenScale ?? 0));
  for (const n of sorted) {
    const dx = (n.screenX ?? 0) - sx;
    const dy = (n.screenY ?? 0) - sy;
    if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return n;
  }
  return undefined;
}

// ─── Node appearance helpers ────────────────────────────────────────────────

export function getAppearanceForType(
  nodeType: string,
  settings: Graph3DSettings
): NodeAppearance3D {
  switch (nodeType) {
    case 'attachment':
      return settings.attachmentAppearance;
    case 'tag':
      return settings.tagAppearance;
    default:
      return settings.noteAppearance;
  }
}

export function getNodeColor3D(node: SimNode3D, settings: Graph3DSettings): string {
  return getNodeColor(node, DEFAULT_NODE_COLORS, settings.colorGroups);
}

export function getNodeRadius3D(node: SimNode3D, appearance: NodeAppearance3D): number {
  const base = 4 * appearance.size;
  const bonus = Math.min((node.connection_count || 0) * 0.4, 5);
  return base + bonus;
}

// ─── Focus / neighbor highlighting ──────────────────────────────────────────

export function getNeighborIds(nodeId: string, edges: GraphEdge[]): Set<string> {
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.from === nodeId) ids.add(e.to);
    if (e.to === nodeId) ids.add(e.from);
  }
  return ids;
}
