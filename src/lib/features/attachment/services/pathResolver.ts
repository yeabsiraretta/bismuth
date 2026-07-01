/**
 * Attachment path resolver — expands variables in path templates.
 *
 * Composes: {rootPath}/{attachmentPath}/{attachmentName}.ext
 * Supports ${notepath}, ${notename}, ${parent}, ${originalname},
 *          ${date}, ${md5}
 */

import type {
  AttachmentConfig, AttachmentOverride,
  AttachmentPathContext,
} from '../types';

/**
 * Format a Date using a simplified Moment-like format string.
 * Supports YYYY, MM, DD, HH, mm, ss, SSS.
 */
export function formatDate(date: Date, fmt: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return fmt
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
    .replace('SSS', pad(date.getMilliseconds(), 3));
}

/**
 * Expand attachment variables in a pattern string.
 */
export function expandVariables(
  pattern: string,
  ctx: AttachmentPathContext,
  dateFormat: string,
): string {
  const dateStr = formatDate(ctx.date, dateFormat);
  return pattern
    .replace(/\$\{notepath\}/g, ctx.notePath)
    .replace(/\$\{notename\}/g, ctx.noteName)
    .replace(/\$\{parent\}/g, ctx.parentFolder)
    .replace(/\$\{originalname\}/g, ctx.originalName)
    .replace(/\$\{date\}/g, dateStr)
    .replace(/\$\{md5\}/g, ctx.md5);
}

/**
 * Sanitize a filename by removing filesystem-unsafe characters.
 */
export function sanitizePath(name: string): string {
  return name
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

/**
 * Resolve the root path for attachments based on configuration mode.
 */
export function resolveRootPath(
  config: AttachmentConfig,
  noteDir: string,
  vaultRoot: string,
): string {
  switch (config.rootPathMode) {
    case 'obsidian':
      return vaultRoot;
    case 'fixed':
      return `${vaultRoot}/${config.fixedRoot}`;
    case 'subfolder':
      return `${noteDir}/${config.subfolderName}`;
    default:
      return vaultRoot;
  }
}

/**
 * Find the most specific override for a given note path and extension.
 * Priority: file > closest parent folder > extension > global.
 */
export function findOverride(
  overrides: AttachmentOverride[],
  notePath: string,
  fileExt: string,
): AttachmentOverride | null {
  const fileMatch = overrides.find(
    o => o.targetType === 'file' && o.targetPath === notePath
  );
  if (fileMatch) return fileMatch;

  const folderOverrides = overrides
    .filter(o => o.targetType === 'folder' && notePath.startsWith(o.targetPath))
    .sort((a, b) => b.targetPath.length - a.targetPath.length);
  if (folderOverrides.length > 0) return folderOverrides[0];

  const extLower = fileExt.toLowerCase().replace('.', '');
  const extMatch = overrides.find(o => {
    if (o.targetType !== 'extension') return false;
    try { return new RegExp(o.targetPath, 'i').test(extLower); }
    catch { return false; }
  });
  return extMatch ?? null;
}

/**
 * Check if a path should be excluded from attachment processing.
 */
export function isExcludedPath(
  path: string,
  excludePaths: string,
  excludeSubpaths: boolean,
): boolean {
  if (!excludePaths.trim()) return false;
  const segments = excludePaths.split(';').map(s => s.trim()).filter(Boolean);
  return segments.some(seg => {
    if (excludeSubpaths) return path.startsWith(seg);
    return path === seg || path.startsWith(seg + '/');
  });
}

/**
 * Check if a file extension should be excluded.
 */
export function isExcludedExtension(ext: string, pattern: string): boolean {
  if (!pattern.trim()) return false;
  try { return new RegExp(pattern, 'i').test(ext.replace('.', '')); }
  catch { return false; }
}

/**
 * Build the full destination path for an attachment.
 */
export function buildAttachmentPath(
  config: AttachmentConfig,
  overrides: AttachmentOverride[],
  ctx: AttachmentPathContext,
  fileExt: string,
  vaultRoot: string,
): string {
  const override = findOverride(overrides, ctx.notePath, fileExt);

  const attPath = override?.attachmentPath ?? config.attachmentPath;
  const attFormat = override?.attachmentFormat ?? config.attachmentFormat;
  const dateFmt = override?.dateFormat ?? config.dateFormat;

  const noteDir = extractDir(ctx.notePath);
  const root = resolveRootPath(config, noteDir, vaultRoot);
  const expandedPath = sanitizePath(expandVariables(attPath, ctx, dateFmt));
  const expandedName = sanitizePath(expandVariables(attFormat, ctx, dateFmt));

  const cleanExt = fileExt.startsWith('.') ? fileExt : `.${fileExt}`;
  const full = `${root}/${expandedPath}/${expandedName}${cleanExt}`;
  return full.replace(/\/{2,}/g, '/');
}

/**
 * Extract the note name (without extension) from a path.
 */
export function extractNoteName(path: string): string {
  const file = path.split('/').pop() ?? '';
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
}

/**
 * Extract the directory from a file path.
 */
export function extractDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx >= 0 ? path.slice(0, idx) : '';
}

/**
 * Extract the parent folder name from a note path.
 */
export function extractParent(notePath: string): string {
  const dir = extractDir(notePath);
  return dir.split('/').pop() ?? '';
}

/**
 * Build an AttachmentPathContext from a note path and attachment info.
 */
export function buildContext(
  notePath: string,
  originalName: string,
  md5: string,
): AttachmentPathContext {
  return {
    notePath: extractDir(notePath),
    noteName: extractNoteName(notePath),
    parentFolder: extractParent(notePath),
    originalName,
    md5,
    date: new Date(),
  };
}
