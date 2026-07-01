/**
 * Image rename service — variable-based file renaming and output folder logic.
 *
 * Supported variables:
 *   {noteName}  — active note filename (without extension)
 *   {fileName}  — original image filename (without extension)
 *   {date}      — YYYY-MM-DD
 *   {time}      — HHmmss
 *   {index}     — 3-digit zero-padded index (001, 002, ...)
 */

import type { RenameConfig, ImageFormat } from '../types/media';
import { FORMAT_EXT_MAP } from '../types/media';

export interface RenameContext {
  noteName: string;
  fileName: string;
  index: number;
}

/**
 * Apply rename variables to a pattern string.
 */
export function applyRenamePattern(
  pattern: string,
  ctx: RenameContext,
): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const idx = String(ctx.index).padStart(3, '0');

  return pattern
    .replace(/\{noteName\}/g, ctx.noteName)
    .replace(/\{fileName\}/g, ctx.fileName)
    .replace(/\{date\}/g, date)
    .replace(/\{time\}/g, time)
    .replace(/\{index\}/g, idx);
}

/**
 * Build the full output path for a converted image.
 *
 * @param sourceDir   Directory of the source image
 * @param config      Rename configuration
 * @param format      Target output format
 * @param ctx         Variable context
 * @returns           Full output path
 */
export function buildOutputPath(
  sourceDir: string,
  config: RenameConfig,
  format: ImageFormat,
  ctx: RenameContext,
): string {
  const ext = FORMAT_EXT_MAP[format];
  const baseName = config.enabled
    ? sanitizeFileName(applyRenamePattern(config.pattern, ctx))
    : ctx.fileName;

  const dir = config.outputFolder
    ? resolveOutputFolder(sourceDir, config.outputFolder, ctx)
    : sourceDir;

  const sep = dir.endsWith('/') ? '' : '/';
  return `${dir}${sep}${baseName}${ext}`;
}

/**
 * Resolve an output folder path, applying variables.
 * Supports both absolute and relative (to source dir) paths.
 */
function resolveOutputFolder(
  sourceDir: string,
  folder: string,
  ctx: RenameContext,
): string {
  let resolved = applyRenamePattern(folder, ctx);
  // If not absolute, treat as relative to source dir
  if (!resolved.startsWith('/')) {
    const sep = sourceDir.endsWith('/') ? '' : '/';
    resolved = `${sourceDir}${sep}${resolved}`;
  }
  return resolved;
}

/**
 * Strip characters that are invalid in most file systems.
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/_{2,}/g, '_')
    .replace(/^[.\-_]+|[.\-_]+$/g, '');
}

/**
 * Extract the filename without extension from a path.
 */
export function extractBaseName(path: string): string {
  const segments = path.split('/');
  const file = segments[segments.length - 1] ?? '';
  const dotIdx = file.lastIndexOf('.');
  return dotIdx > 0 ? file.slice(0, dotIdx) : file;
}

/**
 * Extract the directory from a file path.
 */
export function extractDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx >= 0 ? path.slice(0, idx) : '';
}
