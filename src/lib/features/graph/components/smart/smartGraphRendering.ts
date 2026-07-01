/**
 * Smart Graph rendering — draws relevance-based force graph with:
 * - Proportional link thickness based on relevance score
 * - Link labels showing relevance percentage
 * - Highlighted center node
 * - Note preview tooltip on hover + Cmd/Ctrl
 */

import type { GraphEdge, SmartGraphSettings } from '../../types';
import { type SimNode, DEFAULT_NODE_COLORS, getNodeRadius, getNodeColor } from '../../utils/simulation';
import { getRelevanceThickness, truncateLabel } from '../../services/smartConnections';
import type { GraphRenderState, GraphColors } from '../view/graphViewRendering';

export function renderSmartGraph(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  edges: GraphEdge[],
  centerNodeId: string,
  smartSettings: SmartGraphSettings,
  state: GraphRenderState,
  width: number,
  height: number,
  colors?: GraphColors,
) {
  const c = colors ?? {
    bg: '#1a1a2e', edge: '#5a5a7a',
    nodeLabel: 'rgba(200, 200, 220, 0.8)',
    badge: 'rgba(200, 200, 220, 0.5)',
  };

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);

  const nodeMap = new Map<string, SimNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // ── Draw edges with relevance-proportional thickness ──
  for (const edge of edges) {
    const src = nodeMap.get(edge.from);
    const tgt = nodeMap.get(edge.to);
    if (!src || !tgt) continue;

    const relevance = edge.relevance ?? 0.5;
    const thickness = getRelevanceThickness(relevance, smartSettings.minLinkThickness, smartSettings.maxLinkThickness);
    const alpha = 0.3 + relevance * 0.5;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = c.edge;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Link label (relevance score) — show when a connected node is hovered
    if (smartSettings.showLinkLabels && (state.hoveredNode === edge.from || state.hoveredNode === edge.to)) {
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      const pct = `${Math.round(relevance * 100)}%`;
      ctx.font = `${smartSettings.linkLabelSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Background pill
      const tw = ctx.measureText(pct).width + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, mx - tw / 2, my - 8, tw, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(pct, mx, my);
    }
  }

  // ── Draw nodes ──
  for (const node of nodes) {
    const isCenter = node.id === centerNodeId;
    const isHovered = state.hoveredNode === node.id;
    const isSelected = state.selectedNode === node.id;
    const baseRadius = getNodeRadius(node, { nodeSize: 1, linkThickness: 0.5, centerForce: 0, repelForce: 0, linkForce: 0, linkDistance: 0, animate: false, damping: 0, collisionRadius: 0, showTags: false, showAttachments: false, showOrphans: false, showArrows: false, showLabels: true, textFadeThreshold: 0.3 });
    const scale = isCenter ? smartSettings.centerNodeScale : 1;
    const radius = baseRadius * scale * (isHovered || isSelected ? 1.3 : 1);
    const nodeColor = getNodeColor(node, DEFAULT_NODE_COLORS);

    // Glow for center node
    if (isCenter) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74, 158, 255, 0.15)';
      ctx.fill();
    }

    // Hover highlight
    if (isHovered || isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(74, 158, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isCenter ? '#4a9eff' : isSelected ? '#4a9eff' : isHovered ? '#6bb6ff' : nodeColor;
    ctx.fill();

    // Node label
    const showLabel = isHovered || isSelected || isCenter || state.scale > 0.3;
    if (showLabel) {
      const labelText = isHovered || isSelected || isCenter
        ? node.label
        : truncateLabel(node.label, smartSettings.maxLabelChars);
      const fontSize = isCenter
        ? smartSettings.nodeLabelSize + 2
        : isHovered || isSelected
          ? smartSettings.nodeLabelSize + 1
          : smartSettings.nodeLabelSize;
      ctx.fillStyle = isHovered || isSelected || isCenter ? '#ffffff' : c.nodeLabel;
      ctx.font = `${isCenter ? 'bold ' : ''}${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, node.x, node.y + radius + 5);
    }
  }

  ctx.restore();

  // Badge
  ctx.fillStyle = c.badge;
  ctx.font = '11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`${nodes.length} nodes · ${edges.length} connections`, 12, height - 12);
}

/** Draw hover preview tooltip at canvas position. */
export function renderPreviewTooltip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  maxWidth: number = 280,
) {
  if (!text) return;
  ctx.save();
  ctx.font = '11px system-ui, -apple-system, sans-serif';

  const lines = wrapText(ctx, text, maxWidth - 16);
  const lineH = 15;
  const padX = 8;
  const padY = 6;
  const boxW = Math.min(maxWidth, Math.max(...lines.map((l) => ctx.measureText(l).width)) + padX * 2);
  const boxH = lines.length * lineH + padY * 2;

  let drawX = x + 14;
  let drawY = y - boxH - 8;
  if (drawX + boxW > width) drawX = x - boxW - 14;
  if (drawY < 4) drawY = y + 14;

  ctx.fillStyle = 'rgba(20, 20, 30, 0.92)';
  roundRect(ctx, drawX, drawY, boxW, boxH, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 100, 140, 0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, drawX, drawY, boxW, boxH, 6);
  ctx.stroke();

  ctx.fillStyle = 'rgba(220, 220, 240, 0.9)';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], drawX + padX, drawY + padY + i * lineH + 10);
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
    if (lines.length >= 8) { current += '\u2026'; break; }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
