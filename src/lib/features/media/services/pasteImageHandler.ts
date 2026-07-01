/**
 * Paste/drop image handler — auto-converts pasted or dropped images
 * to the configured format and inserts a markdown image link.
 *
 * Integration: Called from the editor's paste/drop event handlers.
 * Pure JS conversion via imageConverter — no external dependencies.
 */

import { log } from '@/utils/logger';
import { convertBlob } from './imageConverter';
import { writeMediaExport, blobToUint8Array } from './mediaService';
import type { ConversionConfig } from '../types/media';
import { DEFAULT_CONVERSION, FORMAT_EXT_MAP } from '../types/media';

const STORAGE_KEY = 'bismuth-paste-image-config';

export interface PasteImageConfig {
  enabled: boolean;
  conversion: ConversionConfig;
}

const DEFAULT_PASTE_CONFIG: PasteImageConfig = {
  enabled: false,
  conversion: { ...DEFAULT_CONVERSION },
};

export function loadPasteConfig(): PasteImageConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PASTE_CONFIG, ...JSON.parse(stored) } : DEFAULT_PASTE_CONFIG;
  } catch {
    return DEFAULT_PASTE_CONFIG;
  }
}

export function savePasteConfig(config: PasteImageConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    log.warn('pasteImageHandler: failed to save config', { error: String(e) });
  }
}

/**
 * Check if a DataTransfer contains image data.
 */
export function hasImageData(transfer: DataTransfer): boolean {
  if (transfer.files.length > 0) {
    return Array.from(transfer.files).some(f => f.type.startsWith('image/'));
  }
  return transfer.types.includes('image/png') || transfer.types.includes('image/jpeg');
}

/**
 * Extract image files from a DataTransfer.
 */
export function getImageFiles(transfer: DataTransfer): File[] {
  return Array.from(transfer.files).filter(f => f.type.startsWith('image/'));
}

/**
 * Process a pasted/dropped image: convert it and write to the vault.
 *
 * @param imageFile   The raw image File from clipboard or drag-drop
 * @param vaultRoot   Root directory of the vault
 * @param notePath    Path of the current note (for relative links)
 * @param config      Conversion configuration
 * @returns           Markdown image link string, or null on failure
 */
export async function processDroppedImage(
  imageFile: File,
  vaultRoot: string,
  notePath: string,
  config: ConversionConfig,
): Promise<string | null> {
  try {
    const converted = await convertBlob(imageFile, config);
    const ext = FORMAT_EXT_MAP[config.outputFormat].replace('.', '');
    const timestamp = Date.now();
    const baseName = imageFile.name.replace(/\.[^.]+$/, '') || 'pasted';
    const fileName = `${baseName}-${timestamp}.${ext}`;
    const destDir = `${vaultRoot}/media-edits`;
    const destPath = `${destDir}/${fileName}`;

    await writeMediaExport(destPath, `${vaultRoot}/__paste__`, await blobToUint8Array(converted));

    // Build relative path from note to image
    const noteDir = notePath.substring(0, notePath.lastIndexOf('/'));
    const relativePath = buildRelativePath(noteDir, destPath);

    log.info('pasteImageHandler: image processed', { fileName, size: converted.size });
    return `![${baseName}](${relativePath})`;
  } catch (err) {
    log.error('pasteImageHandler: processing failed', err as Error);
    return null;
  }
}

/**
 * Process a pasted/dropped image using attachment management config for path.
 * Uses the attachment feature's path resolver to determine destination.
 */
export async function processDroppedImageWithConfig(
  imageFile: File,
  vaultRoot: string,
  notePath: string,
  config: ConversionConfig,
): Promise<string | null> {
  try {
    const { get: svelteGet } = await import('svelte/store');
    const { attachmentConfig, attachmentOverrides, recordOriginalName } =
      await import('@/features/attachment/stores/attachmentStore');
    const { buildAttachmentPath, buildContext } =
      await import('@/features/attachment/services/pathResolver');
    const { computeMd5Hex } = await import('@/features/attachment/services/md5');

    const converted = await convertBlob(imageFile, config);
    const ext = FORMAT_EXT_MAP[config.outputFormat];
    const baseName = imageFile.name.replace(/\.[^.]+$/, '') || 'pasted';
    const data = await blobToUint8Array(converted);

    const md5 = await computeMd5Hex(`${vaultRoot}/__paste_temp__`).catch(() => String(Date.now()));
    recordOriginalName(md5, baseName);

    const attConfig = svelteGet(attachmentConfig);
    const overrides = svelteGet(attachmentOverrides);
    const ctx = buildContext(notePath, baseName, md5);
    const destPath = buildAttachmentPath(attConfig, overrides, ctx, ext, vaultRoot);

    await writeMediaExport(destPath, `${vaultRoot}/__paste__`, data);

    const noteDir = notePath.substring(0, notePath.lastIndexOf('/'));
    const relativePath = buildRelativePath(noteDir, destPath);

    log.info('pasteImageHandler: image processed (config)', { destPath, size: converted.size });
    return `![${baseName}](${relativePath})`;
  } catch (err) {
    log.error('pasteImageHandler: config processing failed', err as Error);
    return processDroppedImage(imageFile, vaultRoot, notePath, config);
  }
}

/**
 * Build a simple relative path from a source dir to a target file.
 */
function buildRelativePath(fromDir: string, toFile: string): string {
  const fromParts = fromDir.split('/').filter(Boolean);
  const toParts = toFile.split('/').filter(Boolean);

  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++;
  }

  const ups = fromParts.length - common;
  const rest = toParts.slice(common);
  const prefix = ups > 0 ? Array(ups).fill('..').join('/') : '.';
  return `${prefix}/${rest.join('/')}`;
}
