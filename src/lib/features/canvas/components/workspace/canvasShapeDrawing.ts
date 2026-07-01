/**
 * Canvas shape drawing primitives — individual element type renderers.
 * Extracted from canvasRendering.ts for 300-line compliance.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type { FeatureCardData } from '@/features/canvas/types/elements';
import { getComponentById } from '@/features/canvas/stores';
import { resolveInstance } from '@/features/canvas/utils/data/componentResolver';
import { isDarkTheme, type ViewportState } from './canvasRendering';
import { traceNodeShape, cylinderTopPath, predefinedProcessDividers } from './shapes/nodeShapes';
import { drawArrowHead, getDashPattern, computeEdgePath, drawEdgeLabel } from './shapes/edgeStyles';

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function drawRectangle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.save();
  ctx.fillStyle = element.properties.fill || '#3b82f6';
  ctx.strokeStyle = element.properties.stroke || '#2563eb';
  ctx.lineWidth = element.properties.strokeWidth ?? 1.5;
  ctx.globalAlpha = element.properties.opacity ?? 1;

  const br = element.properties.borderRadius;
  const radius: number = element.properties.radius ?? (br ? br.topLeft : 6);
  const shape = element.properties.nodeShape;
  const dashPattern = getDashPattern(element.properties.borderStyle);
  if (dashPattern.length > 0) ctx.setLineDash(dashPattern);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  traceNodeShape(ctx, shape, element.x, element.y, element.width, element.height, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  traceNodeShape(ctx, shape, element.x, element.y, element.width, element.height, radius);
  ctx.stroke();

  // Extra passes for composite shapes
  if (shape === 'cylinder') {
    cylinderTopPath(ctx, element.x, element.y, element.width, element.height);
    ctx.fill();
    ctx.stroke();
  } else if (shape === 'predefined-process') {
    predefinedProcessDividers(ctx, element.x, element.y, element.width, element.height);
  }
  ctx.restore();
}

export function drawCircle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const radius = element.properties.radius || element.width / 2;
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  ctx.fillStyle = element.properties.fill || '#10b981';
  ctx.strokeStyle = element.properties.stroke || '#059669';
  ctx.lineWidth = element.properties.strokeWidth ?? 2;
  ctx.globalAlpha = element.properties.opacity ?? 1;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawText(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.fillStyle = element.properties.fill || '#000000';
  ctx.font = `${element.properties.fontSize || 16}px ${element.properties.fontFamily || 'Inter, sans-serif'}`;
  ctx.globalAlpha = element.properties.opacity ?? 1;

  ctx.fillText(
    element.properties.text || '',
    element.x,
    element.y + (element.properties.fontSize || 16)
  );
}

export function drawFrame(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.save();
  ctx.globalAlpha = element.properties.opacity ?? 1;
  ctx.fillStyle = element.properties.fill || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, element.x, element.y, element.width, element.height, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = element.properties.stroke || '#e4e4e7';
  ctx.lineWidth = element.properties.strokeWidth ?? 1;
  roundedRect(ctx, element.x, element.y, element.width, element.height, 8);
  ctx.stroke();

  ctx.fillStyle = isDarkTheme() ? '#a1a1aa' : '#71717a';
  ctx.font = `600 11px Inter, sans-serif`;
  ctx.fillText(element.name || 'Frame', element.x + 8, element.y - 8);
  ctx.restore();
}

export function drawLine(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.save();
  const color = element.properties.stroke || '#71717a';
  ctx.strokeStyle = color;
  ctx.lineWidth = element.properties.strokeWidth ?? 2;
  ctx.globalAlpha = element.properties.opacity ?? 1;
  ctx.setLineDash(getDashPattern(element.properties.lineStyle ?? element.properties.borderStyle));

  const pathPts = computeEdgePath(
    element.properties.pathfinding,
    points[0], points[points.length - 1],
  );

  ctx.beginPath();
  ctx.moveTo(element.x + pathPts[0].x, element.y + pathPts[0].y);
  if (element.properties.pathfinding === 'curved' && pathPts.length === 4) {
    ctx.bezierCurveTo(
      element.x + pathPts[1].x, element.y + pathPts[1].y,
      element.x + pathPts[2].x, element.y + pathPts[2].y,
      element.x + pathPts[3].x, element.y + pathPts[3].y,
    );
  } else {
    for (let i = 1; i < pathPts.length; i++) {
      ctx.lineTo(element.x + pathPts[i].x, element.y + pathPts[i].y);
    }
  }
  ctx.stroke();

  if (element.properties.edgeLabel) {
    drawEdgeLabel(ctx, element.properties.edgeLabel, pathPts, element.x, element.y);
  }
  ctx.restore();
}

export function drawArrow(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.save();
  const color = element.properties.stroke || '#71717a';
  ctx.strokeStyle = color;
  ctx.lineWidth = element.properties.strokeWidth ?? 2;
  ctx.globalAlpha = element.properties.opacity ?? 1;
  ctx.setLineDash(getDashPattern(element.properties.lineStyle ?? element.properties.borderStyle));

  const pathPts = computeEdgePath(
    element.properties.pathfinding,
    points[0], points[points.length - 1],
  );

  ctx.beginPath();
  ctx.moveTo(element.x + pathPts[0].x, element.y + pathPts[0].y);
  if (element.properties.pathfinding === 'curved' && pathPts.length === 4) {
    ctx.bezierCurveTo(
      element.x + pathPts[1].x, element.y + pathPts[1].y,
      element.x + pathPts[2].x, element.y + pathPts[2].y,
      element.x + pathPts[3].x, element.y + pathPts[3].y,
    );
  } else {
    for (let i = 1; i < pathPts.length; i++) {
      ctx.lineTo(element.x + pathPts[i].x, element.y + pathPts[i].y);
    }
  }
  ctx.stroke();

  // End arrow head
  if (element.properties.endArrow !== false) {
    const lastPt = pathPts[pathPts.length - 1];
    const prevPt = pathPts.length > 1 ? pathPts[pathPts.length - 2] : pathPts[0];
    const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
    drawArrowHead(ctx, element.properties.endArrowStyle ?? 'triangle',
      element.x + lastPt.x, element.y + lastPt.y, angle, 12, color);
  }

  // Start arrow head
  if (element.properties.startArrow) {
    const firstPt = pathPts[0];
    const nextPt = pathPts.length > 1 ? pathPts[1] : pathPts[0];
    const angle = Math.atan2(firstPt.y - nextPt.y, firstPt.x - nextPt.x);
    drawArrowHead(ctx, element.properties.startArrowStyle ?? 'triangle',
      element.x + firstPt.x, element.y + firstPt.y, angle, 12, color);
  }

  if (element.properties.edgeLabel) {
    drawEdgeLabel(ctx, element.properties.edgeLabel, pathPts, element.x, element.y);
  }
  ctx.restore();
}

export function drawPen(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = element.properties.stroke || '#18181b';
  ctx.lineWidth = element.properties.strokeWidth ?? 2;
  ctx.globalAlpha = element.properties.opacity ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(element.x + points[0].x, element.y + points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(element.x + points[i].x, element.y + points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawComponentInstance(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  viewport: ViewportState,
  drawElementFn: (ctx: CanvasRenderingContext2D, el: CanvasElement, sel: boolean, vp: ViewportState) => void
) {
  ctx.globalAlpha = element.properties.opacity ?? 1;

  const defId = element.properties['definitionId'] as string | undefined;
  if (defId) {
    const definition = getComponentById(defId);
    if (definition) {
      const resolvedElements = resolveInstance(element, definition);
      for (const child of resolvedElements) {
        drawElementFn(ctx, child, false, viewport);
      }
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      ctx.setLineDash([]);
      return;
    }
  }

  ctx.fillStyle = '#f5f3ff';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.fillRect(element.x, element.y, element.width, element.height);
  ctx.strokeRect(element.x, element.y, element.width, element.height);

  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const sz = Math.min(element.width, element.height, 24) / 2;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(cx, cy - sz);
  ctx.lineTo(cx + sz, cy);
  ctx.lineTo(cx, cy + sz);
  ctx.lineTo(cx - sz, cy);
  ctx.closePath();
  ctx.fill();
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  viewport: ViewportState
) {
  const pad = 3;
  const r = 4;
  ctx.strokeStyle = isDarkTheme() ? '#ef4444' : '#dc2626';
  ctx.lineWidth = 1.5 / viewport.scale;
  ctx.setLineDash([]);
  roundedRect(ctx, element.x - pad, element.y - pad, element.width + pad * 2, element.height + pad * 2, r);
  ctx.stroke();

  const handleSize = 6 / viewport.scale;
  ctx.fillStyle = isDarkTheme() ? '#27272a' : '#ffffff';
  ctx.strokeStyle = isDarkTheme() ? '#ef4444' : '#dc2626';
  ctx.lineWidth = 1.5 / viewport.scale;
  const corners = [
    [element.x - pad, element.y - pad],
    [element.x + element.width + pad - handleSize, element.y - pad],
    [element.x - pad, element.y + element.height + pad - handleSize],
    [element.x + element.width + pad - handleSize, element.y + element.height + pad - handleSize],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillRect(cx, cy, handleSize, handleSize);
    ctx.strokeRect(cx, cy, handleSize, handleSize);
  }
}

const FEATURE_CARD_STATUS_COLORS: Record<string, string> = {
  idea: '#71717a',
  planned: '#3b82f6',
  'in-progress': '#dc2626',
  done: '#16a34a',
  deferred: '#d97706',
};

/**
 * Renders a feature_card element as a rounded rectangle with a status-colored
 * top border and title text. Used on the main canvas layer.
 */
export function drawFeatureCard(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const data = element.properties.featureCardData as FeatureCardData | undefined;
  const title = data?.title ?? 'Untitled';
  const status = data?.status ?? 'idea';
  const statusColor = FEATURE_CARD_STATUS_COLORS[status] ?? '#71717a';
  const h = Math.max(element.height, 40);

  ctx.globalAlpha = element.properties.opacity ?? 1;

  const dark = isDarkTheme();

  // Background
  ctx.fillStyle = dark ? '#27272a' : '#ffffff';
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, element.x, element.y, element.width, h, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Border
  ctx.strokeStyle = dark ? '#3f3f46' : '#e4e4e7';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, element.x, element.y, element.width, h, 8);
  ctx.stroke();

  // Status accent top bar (4px)
  ctx.fillStyle = statusColor;
  roundedRect(ctx, element.x, element.y, element.width, 4, 4);
  ctx.fill();

  // Title text
  ctx.fillStyle = dark ? '#fafafa' : '#18181b';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.fillText(title, element.x + 10, element.y + 20, element.width - 20);

  // Status label
  ctx.fillStyle = statusColor;
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText(status, element.x + 10, element.y + 34, element.width - 20);
}
