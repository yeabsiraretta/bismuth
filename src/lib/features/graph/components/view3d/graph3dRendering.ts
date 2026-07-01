/**
 * 3D Graph rendering — perspective-projected canvas rendering for the 3D graph.
 * Draws nodes as shaped primitives, links as depth-faded lines, and labels.
 */

import type { GraphEdge } from '../../types';
import type { SimNode3D, Camera3D, Graph3DSettings, FocusState3D, NodeShape3D } from '../../types/graph3d';
import { projectNode, getAppearanceForType, getNodeColor3D, getNodeRadius3D } from '../../utils/simulation3d';

export interface Graph3DColors {
  bg: string;
  edge: string;
  label: string;
  badge: string;
}

export function resolve3DColors(el: HTMLElement): Graph3DColors {
  const s = getComputedStyle(el);
  return {
    bg: s.getPropertyValue('--graph-bg').trim() || '#0d0d1a',
    edge: s.getPropertyValue('--graph-edge').trim() || '#3a3a5a',
    label: s.getPropertyValue('--graph-node-label').trim() || 'rgba(200,200,220,0.8)',
    badge: s.getPropertyValue('--graph-text').trim() || 'rgba(200,200,220,0.5)',
  };
}

export function render3DGraph(
  ctx: CanvasRenderingContext2D, nodes: SimNode3D[], edges: GraphEdge[],
  camera: Camera3D, settings: Graph3DSettings, focus: FocusState3D,
  width: number, height: number, colors: Graph3DColors,
): void {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Sort nodes by depth for painter's algorithm (far first)
  const projected = nodes.map(n => {
    const p = projectNode(n, camera, width, height);
    return { node: n, ...p };
  }).filter(p => !p.behind).sort((a, b) => a.scale - b.scale);

  // ── Draw edges ──
  for (const edge of edges) {
    const src = nodeMap.get(edge.from);
    const tgt = nodeMap.get(edge.to);
    if (!src || !tgt) continue;
    const ps = projectNode(src, camera, width, height);
    const pt = projectNode(tgt, camera, width, height);
    if (ps.behind || pt.behind) continue;

    const dimmed = focus.focusedNodeId !== null
      && focus.focusedNodeId !== edge.from && focus.focusedNodeId !== edge.to;

    ctx.beginPath();
    ctx.moveTo(ps.sx, ps.sy);
    ctx.lineTo(pt.sx, pt.sy);
    ctx.strokeStyle = colors.edge;
    ctx.globalAlpha = dimmed ? 0.05 : Math.min(settings.linkOpacity * Math.min(ps.scale, pt.scale) * 0.8, 0.6);
    ctx.lineWidth = settings.linkThickness * Math.min(ps.scale, pt.scale) * 0.6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ── Draw nodes ──
  for (const p of projected) {
    const { node, sx, sy, scale } = p;
    const appearance = getAppearanceForType(node.node_type, settings);
    const radius = getNodeRadius3D(node, appearance) * scale * 0.8;
    if (radius < 0.5) continue;

    const isFocused = focus.focusedNodeId === node.id;
    const isNeighbor = focus.highlightedNeighborIds.has(node.id);
    const dimmed = focus.focusedNodeId !== null && !isFocused && !isNeighbor;
    const nodeColor = getNodeColor3D(node, settings);

    ctx.globalAlpha = dimmed ? 0.15 : appearance.opacity;

    // Focus glow
    if (isFocused) {
      ctx.beginPath();
      ctx.arc(sx, sy, radius + 6 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74,158,255,0.2)';
      ctx.fill();
    }

    drawShape(ctx, appearance.shape, sx, sy, radius, nodeColor, isFocused);

    // Label
    if (settings.showLabels && !dimmed && scale > 0.25) {
      const fontSize = Math.max(8, Math.min(13, 10 * scale * settings.labelScale));
      ctx.font = `${isFocused ? 'bold ' : ''}${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isFocused ? '#ffffff' : colors.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = node.label.length > 24 ? node.label.slice(0, 22) + '\u2026' : node.label;
      ctx.fillText(label, sx, sy + radius + 3);
    }
  }
  ctx.globalAlpha = 1;

  // Badge
  ctx.fillStyle = colors.badge;
  ctx.font = '11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`3D \u00B7 ${nodes.length} nodes \u00B7 ${edges.length} links`, 12, height - 12);
}

// ─── Shape drawing ──────────────────────────────────────────────────────────

function drawShape(
  ctx: CanvasRenderingContext2D, shape: NodeShape3D,
  x: number, y: number, r: number, color: string, highlighted: boolean,
): void {
  ctx.fillStyle = highlighted ? '#4a9eff' : color;

  switch (shape) {
    case 'cube':
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      break;
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'cylinder': {
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.4, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 1.4);
      ctx.beginPath();
      ctx.ellipse(x, y + r, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cone': {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y + r * 0.8);
      ctx.lineTo(x - r, y + r * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'octahedron': {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 0.9, y);
      ctx.lineTo(x, y + r * 1.2);
      ctx.lineTo(x - r * 0.9, y);
      ctx.closePath();
      ctx.fill();
      // Midline for 3D illusion
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.9, y);
      ctx.lineTo(x + r * 0.9, y);
      ctx.stroke();
      break;
    }
    default: // sphere
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // 3D highlight
      if (r > 3) {
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
      break;
  }
}
