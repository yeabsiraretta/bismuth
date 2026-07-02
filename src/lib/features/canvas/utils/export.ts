import type { CanvasDocument, CanvasElement } from '@/features/canvas/types';
import { log } from '@/utils/logger';

/**
 * Export canvas to PNG image
 */
export async function exportToPNG(
  canvas: CanvasDocument,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> {
  log.info('Exporting canvas to PNG', { canvasId: canvas.id, width, height });

  // Create offscreen canvas
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Calculate bounds
  const bounds = calculateCanvasBounds(canvas.elements);
  const scale = calculateFitScale(bounds, width, height, 0.9); // 90% of canvas size

  // Center the content
  const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Draw all elements
  for (const element of canvas.elements) {
    if (!element.visible) continue;
    drawElementToContext(ctx, element);
  }

  ctx.restore();

  // Convert to blob
  return new Promise((resolve, reject) => {
    offscreenCanvas.toBlob((blob) => {
      if (blob) {
        log.info('PNG export successful', { size: blob.size });
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
}

/**
 * Export canvas to SVG
 */
export function exportToSVG(canvas: CanvasDocument): string {
  log.info('Exporting canvas to SVG', { canvasId: canvas.id });

  const bounds = calculateCanvasBounds(canvas.elements);
  const padding = 20;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${bounds.width + padding * 2}" 
     height="${bounds.height + padding * 2}" 
     viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}">
  <rect x="${bounds.minX - padding}" y="${bounds.minY - padding}" 
        width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" 
        fill="white"/>
`;

  // Draw all elements
  for (const element of canvas.elements) {
    if (!element.visible) continue;
    svg += elementToSVG(element);
  }

  svg += '</svg>';

  log.info('SVG export successful', { length: svg.length });
  return svg;
}

/**
 * Download file to user's system
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  log.info('File downloaded', { filename });
}

/**
 * Download SVG string as file
 */
export function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadFile(blob, filename);
}

// Helper functions

function calculateCanvasBounds(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    if (!element.visible) continue;
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function calculateFitScale(
  bounds: { width: number; height: number },
  targetWidth: number,
  targetHeight: number,
  fillRatio: number = 1.0
): number {
  const scaleX = (targetWidth * fillRatio) / bounds.width;
  const scaleY = (targetHeight * fillRatio) / bounds.height;
  return Math.min(scaleX, scaleY);
}

function drawElementToContext(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  ctx.save();

  // Apply rotation
  if (element.rotation !== 0) {
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));
  }

  ctx.globalAlpha = element.properties.opacity || 1;

  switch (element.element_type) {
    case 'rectangle':
      ctx.fillStyle = element.properties.fill || '#3b82f6';
      ctx.strokeStyle = element.properties.stroke || '#1e40af';
      ctx.lineWidth = element.properties.strokeWidth || 2;
      ctx.fillRect(element.x, element.y, element.width, element.height);
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      break;

    case 'circle': {
      const radius = element.properties.radius || element.width / 2;
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      ctx.fillStyle = element.properties.fill || '#10b981';
      ctx.strokeStyle = element.properties.stroke || '#059669';
      ctx.lineWidth = element.properties.strokeWidth || 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'text':
      ctx.fillStyle = element.properties.fill || '#000000';
      ctx.font = `${element.properties.fontSize || 16}px ${element.properties.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillText(
        element.properties.text || '',
        element.x,
        element.y + (element.properties.fontSize || 16)
      );
      break;
  }

  ctx.restore();
}

function elementToSVG(element: CanvasElement): string {
  const opacity = element.properties.opacity || 1;
  let transform = '';

  if (element.rotation !== 0) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    transform = `transform="rotate(${element.rotation} ${cx} ${cy})"`;
  }

  switch (element.element_type) {
    case 'rectangle':
      return `  <rect x="${element.x}" y="${element.y}" 
        width="${element.width}" height="${element.height}" 
        fill="${element.properties.fill || '#3b82f6'}" 
        stroke="${element.properties.stroke || '#1e40af'}" 
        stroke-width="${element.properties.strokeWidth || 2}" 
        opacity="${opacity}" ${transform}/>\n`;

    case 'circle': {
      const radius = element.properties.radius || element.width / 2;
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      return `  <circle cx="${cx}" cy="${cy}" r="${radius}" 
        fill="${element.properties.fill || '#10b981'}" 
        stroke="${element.properties.stroke || '#059669'}" 
        stroke-width="${element.properties.strokeWidth || 2}" 
        opacity="${opacity}" ${transform}/>\n`;
    }

    case 'text':
      return `  <text x="${element.x}" y="${element.y + (element.properties.fontSize || 16)}" 
        font-family="${element.properties.fontFamily || 'Inter, sans-serif'}" 
        font-size="${element.properties.fontSize || 16}" 
        fill="${element.properties.fill || '#000000'}" 
        opacity="${opacity}" ${transform}>${escapeXml(element.properties.text || '')}</text>\n`;

    default:
      return '';
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export canvas as JSON
 */
export function exportToJSON(canvas: CanvasDocument): string {
  return JSON.stringify(canvas, null, 2);
}

/**
 * Import canvas from JSON
 */
export function importFromJSON(json: string): CanvasDocument {
  try {
    const canvas = JSON.parse(json) as CanvasDocument;
    log.info('Canvas imported from JSON', { id: canvas.id, name: canvas.name });
    return canvas;
  } catch (error) {
    log.error('Failed to import canvas from JSON', error as Error);
    throw new Error('Invalid canvas JSON');
  }
}
