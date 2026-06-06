/**
 * Canvas element rendering functions.
 * Extracted from CanvasWorkspaceInteractive.svelte for the 300-line limit.
 */

import type { CanvasElement, CanvasSettings } from '@/types/canvas';
import { getComponentById } from '@/stores/canvas/componentLibrary';
import { resolveInstance } from '@/utils/canvas/componentResolver';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  settings: CanvasSettings,
  width: number,
  height: number
) {
  const gridSize = settings.gridSize;
  const startX = Math.floor(-viewport.x / viewport.scale / gridSize) * gridSize;
  const startY = Math.floor(-viewport.y / viewport.scale / gridSize) * gridSize;
  const endX = startX + width / viewport.scale + gridSize;
  const endY = startY + height / viewport.scale + gridSize;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1 / viewport.scale;

  for (let x = startX; x < endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  for (let y = startY; y < endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}

export function drawElements(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  selectedIds: string[],
  viewport: ViewportState
) {
  for (const element of elements) {
    if (!element.visible) continue;
    const isSelected = selectedIds.includes(element.id);
    drawElement(ctx, element, isSelected, viewport);
  }
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  isSelected: boolean = false,
  viewport: ViewportState
) {
  ctx.save();
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));

  switch (element.element_type) {
    case 'rectangle':
      drawRectangle(ctx, element);
      break;
    case 'circle':
      drawCircle(ctx, element);
      break;
    case 'text':
      drawText(ctx, element);
      break;
    case 'frame':
    case 'screen':
      drawFrame(ctx, element);
      break;
    case 'line':
      drawLine(ctx, element);
      break;
    case 'arrow':
      drawArrow(ctx, element);
      break;
    case 'pen':
      drawPen(ctx, element);
      break;
    case 'component_instance':
      drawComponentInstance(ctx, element, viewport);
      break;
  }

  if (isSelected) {
    drawSelectionBox(ctx, element, viewport);
  }

  ctx.restore();
}

function drawRectangle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.fillStyle = element.properties.fill || '#3b82f6';
  ctx.strokeStyle = element.properties.stroke || '#1e40af';
  ctx.lineWidth = element.properties.strokeWidth || 2;
  ctx.globalAlpha = element.properties.opacity || 1;

  ctx.fillRect(element.x, element.y, element.width, element.height);
  ctx.strokeRect(element.x, element.y, element.width, element.height);
}

function drawCircle(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const radius = element.properties.radius || element.width / 2;
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  ctx.fillStyle = element.properties.fill || '#10b981';
  ctx.strokeStyle = element.properties.stroke || '#059669';
  ctx.lineWidth = element.properties.strokeWidth || 2;
  ctx.globalAlpha = element.properties.opacity || 1;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.fillStyle = element.properties.fill || '#000000';
  ctx.font = `${element.properties.fontSize || 16}px ${element.properties.fontFamily || 'Inter, sans-serif'}`;
  ctx.globalAlpha = element.properties.opacity || 1;

  ctx.fillText(
    element.properties.text || '',
    element.x,
    element.y + (element.properties.fontSize || 16)
  );
}

function drawFrame(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.globalAlpha = element.properties.opacity || 1;
  ctx.fillStyle = element.properties.fill || '#ffffff';
  ctx.fillRect(element.x, element.y, element.width, element.height);

  ctx.strokeStyle = element.properties.stroke || '#d4d4d8';
  ctx.lineWidth = element.properties.strokeWidth || 1;
  ctx.strokeRect(element.x, element.y, element.width, element.height);

  ctx.fillStyle = '#71717a';
  ctx.font = `11px Inter, sans-serif`;
  ctx.fillText(element.name || 'Frame', element.x, element.y - 6);
}

function drawLine(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.strokeStyle = element.properties.stroke || '#71717a';
  ctx.lineWidth = element.properties.strokeWidth || 2;
  ctx.globalAlpha = element.properties.opacity || 1;

  if (element.properties.lineStyle === 'dashed') {
    ctx.setLineDash([8, 4]);
  } else if (element.properties.lineStyle === 'dotted') {
    ctx.setLineDash([2, 4]);
  }

  ctx.beginPath();
  ctx.moveTo(element.x + points[0].x, element.y + points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(element.x + points[i].x, element.y + points[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawArrow(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.strokeStyle = element.properties.stroke || '#71717a';
  ctx.lineWidth = element.properties.strokeWidth || 2;
  ctx.globalAlpha = element.properties.opacity || 1;

  ctx.beginPath();
  ctx.moveTo(element.x + points[0].x, element.y + points[0].y);
  const lastPt = points[points.length - 1];
  ctx.lineTo(element.x + lastPt.x, element.y + lastPt.y);
  ctx.stroke();

  if (element.properties.endArrow) {
    const prevPt = points.length > 1 ? points[points.length - 2] : points[0];
    const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
    const headLen = 12;
    const tipX = element.x + lastPt.x;
    const tipY = element.y + lastPt.y;

    ctx.fillStyle = element.properties.stroke || '#71717a';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle - 0.4), tipY - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(tipX - headLen * Math.cos(angle + 0.4), tipY - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }
}

function drawPen(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const points = element.properties.points;
  if (!points || points.length < 2) return;

  ctx.strokeStyle = element.properties.stroke || '#18181b';
  ctx.lineWidth = element.properties.strokeWidth || 2;
  ctx.globalAlpha = element.properties.opacity || 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(element.x + points[0].x, element.y + points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(element.x + points[i].x, element.y + points[i].y);
  }
  ctx.stroke();
}

function drawComponentInstance(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  viewport: ViewportState
) {
  ctx.globalAlpha = element.properties.opacity || 1;

  const defId = element.properties.definitionId as string | undefined;
  if (defId) {
    const definition = getComponentById(defId);
    if (definition) {
      const resolvedElements = resolveInstance(element, definition);
      for (const child of resolvedElements) {
        drawElement(ctx, child, false, viewport);
      }
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      ctx.setLineDash([]);
      return;
    }
  }

  ctx.fillStyle = '#f5f3ff';
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.fillRect(element.x, element.y, element.width, element.height);
  ctx.strokeRect(element.x, element.y, element.width, element.height);

  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const sz = Math.min(element.width, element.height, 24) / 2;
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.moveTo(cx, cy - sz);
  ctx.lineTo(cx + sz, cy);
  ctx.lineTo(cx, cy + sz);
  ctx.lineTo(cx - sz, cy);
  ctx.closePath();
  ctx.fill();
}

function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  viewport: ViewportState
) {
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2 / viewport.scale;
  ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
  ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
  ctx.setLineDash([]);
}
