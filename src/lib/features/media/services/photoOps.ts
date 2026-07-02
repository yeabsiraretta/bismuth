/**
 * Photo operations service — HTML5 Canvas-based non-destructive photo pipeline.
 *
 * All operations are pure canvas transforms; no file I/O occurs here.
 * Source images are loaded via convertFileSrc (read-only asset URL).
 * Export writes to a new file path via mediaService — never the original.
 *
 * SECURITY: This service never writes to the original vault path.
 * Source images are accessed via convertFileSrc() which yields a read-only asset URL.
 */

import { log } from '@/utils/logger';
import type { MediaEditChain, PhotoOperation, FilterName } from '../types/media';
import { FILTER_PRESET_MAP } from '../types/media';

/** Load an image from a URL into an HTMLImageElement. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = url;
  });
}

/**
 * Build a composed CSS filter string from all brightness/contrast/saturation/hue/filter
 * operations in the provided list. Operations are composed in order.
 */
function buildCssFilterString(ops: PhotoOperation[]): string {
  const parts: string[] = [];

  for (const op of ops) {
    switch (op.type) {
      case 'brightness': {
        const v = Number(op.params['value'] ?? 1);
        parts.push(`brightness(${v})`);
        break;
      }
      case 'contrast': {
        const v = Number(op.params['value'] ?? 1);
        parts.push(`contrast(${v})`);
        break;
      }
      case 'saturation': {
        const v = Number(op.params['value'] ?? 1);
        parts.push(`saturate(${v})`);
        break;
      }
      case 'hue': {
        const v = Number(op.params['value'] ?? 0);
        parts.push(`hue-rotate(${v}deg)`);
        break;
      }
      case 'filter': {
        const name = op.params['name'] as FilterName;
        const preset = FILTER_PRESET_MAP[name] ?? '';
        if (preset) parts.push(preset);
        break;
      }
      default:
        break;
    }
  }

  return parts.join(' ');
}

/**
 * Apply the full photo operation chain to a canvas element.
 * Operations are applied in order. The canvas is resized as needed for crop/resize ops.
 *
 * @param imageUrl  Read-only asset URL from convertFileSrc()
 * @param ops       Ordered list of photo operations
 * @param canvas    Target canvas element
 */
export async function applyPhotoOps(
  imageUrl: string,
  ops: PhotoOperation[],
  canvas: HTMLCanvasElement
): Promise<void> {
  const img = await loadImage(imageUrl);
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // Determine final canvas dimensions based on crop/resize ops
  for (const op of ops) {
    if (op.type === 'crop') {
      width = Math.round(Number(op.params['w'] ?? width));
      height = Math.round(Number(op.params['h'] ?? height));
    } else if (op.type === 'resize') {
      width = Math.round(Number(op.params['w'] ?? width));
      height = Math.round(Number(op.params['h'] ?? height));
    }
  }

  // For rotate operations, swap dimensions when rotating 90/270
  for (const op of ops) {
    if (op.type === 'rotate') {
      const angle = Number(op.params['angle'] ?? 0) % 360;
      if (Math.abs(angle) === 90 || Math.abs(angle) === 270) {
        [width, height] = [height, width];
      }
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Compose CSS filter string from adjustment ops
  const cssFilter = buildCssFilterString(ops);
  if (cssFilter) {
    ctx.filter = cssFilter;
  }

  // Apply spatial transforms (crop, rotate, resize)
  ctx.save();

  let hasCrop = false;
  let cropX = 0,
    cropY = 0,
    cropW = img.naturalWidth,
    cropH = img.naturalHeight;

  for (const op of ops) {
    if (op.type === 'crop') {
      cropX = Math.round(Number(op.params['x'] ?? 0));
      cropY = Math.round(Number(op.params['y'] ?? 0));
      cropW = Math.round(Number(op.params['w'] ?? img.naturalWidth));
      cropH = Math.round(Number(op.params['h'] ?? img.naturalHeight));
      hasCrop = true;
    } else if (op.type === 'rotate') {
      const angle = Number(op.params['angle'] ?? 0);
      const radians = angle * (Math.PI / 180);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    } else if (op.type === 'flip') {
      const dir = String(op.params['direction'] ?? 'horizontal');
      if (dir === 'horizontal') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
    }
  }

  if (hasCrop) {
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
  log.debug('photoOps: applied operation chain', { opCount: ops.length });
}

/**
 * Apply all operations in the chain and return a data URL for preview rendering.
 *
 * @param imageUrl  Read-only asset URL from convertFileSrc()
 * @param chain     The full edit chain
 * @returns         JPEG or PNG data URL
 */
export async function applyChainToDataUrl(
  imageUrl: string,
  chain: MediaEditChain
): Promise<string> {
  const canvas = document.createElement('canvas');
  const photoOps = chain.operations.filter(
    (op): op is PhotoOperation => !['trim', 'split', 'speed', 'text-overlay'].includes(op.type)
  );
  await applyPhotoOps(imageUrl, photoOps, canvas);
  return canvas.toDataURL(chain.exportFormat, chain.exportQuality);
}

/**
 * Render the final canvas and return a Blob for export.
 * The Blob is written to a NEW file path via mediaService — never the source path.
 *
 * @param imageUrl  Read-only asset URL from convertFileSrc()
 * @param chain     The full edit chain
 * @returns         Image Blob
 */
export async function exportToBlob(imageUrl: string, chain: MediaEditChain): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const photoOps = chain.operations.filter(
    (op): op is PhotoOperation => !['trim', 'split', 'speed', 'text-overlay'].includes(op.type)
  );
  await applyPhotoOps(imageUrl, photoOps, canvas);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      chain.exportFormat,
      chain.exportQuality
    );
  });
}
