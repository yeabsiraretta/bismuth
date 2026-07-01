/**
 * Image converter service — pure Canvas-based format conversion, compression,
 * resize (6 modes), and flip. No external dependencies.
 *
 * SECURITY: Never writes to the original vault path. All output goes through
 * mediaService.writeMediaExport which enforces source protection.
 */

import { log } from '@/utils/logger';
import type { ConversionConfig, ResizeMode, FlipDirection } from '../types/media';
import { FORMAT_MIME_MAP } from '../types/media';

/** Load an image from a URL or data URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

/** Compute target dimensions for a resize mode. */
export function computeResizeDimensions(
  srcW: number,
  srcH: number,
  mode: ResizeMode,
  value: number
): { width: number; height: number } {
  const aspect = srcW / srcH;
  switch (mode) {
    case 'width':
      return { width: value, height: Math.round(value / aspect) };
    case 'height':
      return { width: Math.round(value * aspect), height: value };
    case 'longest-edge':
      if (srcW >= srcH) {
        return { width: value, height: Math.round(value / aspect) };
      }
      return { width: Math.round(value * aspect), height: value };
    case 'shortest-edge':
      if (srcW <= srcH) {
        return { width: value, height: Math.round(value / aspect) };
      }
      return { width: Math.round(value * aspect), height: value };
    case 'fit': {
      const scale = Math.min(value / srcW, value / srcH);
      return { width: Math.round(srcW * scale), height: Math.round(srcH * scale) };
    }
    case 'fill':
      return { width: value, height: value };
    default:
      return { width: srcW, height: srcH };
  }
}

/** Apply flip transform to a canvas context. */
function applyFlip(
  ctx: CanvasRenderingContext2D,
  direction: FlipDirection,
  width: number,
  height: number
): void {
  if (direction === 'horizontal') {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  }
}

/**
 * Convert an image source (URL or data URL) to a Blob in the target format.
 * Pure Canvas-based — works completely offline.
 */
export async function convertImage(src: string, config: ConversionConfig): Promise<Blob> {
  const img = await loadImage(src);
  let { naturalWidth: w, naturalHeight: h } = img;

  if (config.resizeEnabled && config.resizeValue > 0) {
    const dims = computeResizeDimensions(w, h, config.resizeMode, config.resizeValue);
    w = dims.width;
    h = dims.height;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.save();
  if (config.flipEnabled) {
    applyFlip(ctx, config.flipDirection, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();

  const mime = FORMAT_MIME_MAP[config.outputFormat];
  const quality = config.quality / 100;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      mime,
      quality
    );
  });
}

/**
 * Convert an image and return as a data URL (for preview).
 */
export async function convertImageToDataUrl(
  src: string,
  config: ConversionConfig
): Promise<string> {
  const img = await loadImage(src);
  let { naturalWidth: w, naturalHeight: h } = img;

  if (config.resizeEnabled && config.resizeValue > 0) {
    const dims = computeResizeDimensions(w, h, config.resizeMode, config.resizeValue);
    w = dims.width;
    h = dims.height;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.save();
  if (config.flipEnabled) {
    applyFlip(ctx, config.flipDirection, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();

  const mime = FORMAT_MIME_MAP[config.outputFormat];
  return canvas.toDataURL(mime, config.quality / 100);
}

/**
 * Read image dimensions from a source URL without loading full pixel data.
 */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Estimate output file size by converting and measuring blob size.
 * Returns bytes.
 */
export async function estimateOutputSize(src: string, config: ConversionConfig): Promise<number> {
  try {
    const blob = await convertImage(src, config);
    return blob.size;
  } catch (err) {
    log.warn('imageConverter: size estimation failed', { error: String(err) });
    return 0;
  }
}

/**
 * Convert a File/Blob from clipboard or drag-drop to the target format.
 */
export async function convertBlob(blob: Blob, config: ConversionConfig): Promise<Blob> {
  const dataUrl = await blobToDataUrl(blob);
  return convertImage(dataUrl, config);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}
