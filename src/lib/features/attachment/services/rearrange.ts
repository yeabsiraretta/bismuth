/**
 * Rearrange service — scans a note (or all notes) for linked attachments
 * and renames/moves them to match the current attachment configuration.
 *
 * Handles markdown image links: ![alt](path) and wikilinks: ![[path]]
 */

import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { getNote } from '@/services/vault/vault';
import { renameNote, updateLinksOnRename } from '@/services/vault/vault';
import {
  attachmentConfig, attachmentOverrides, getOriginalName, recordOriginalName,
} from '../stores/attachmentStore';
import {
  buildAttachmentPath, buildContext, isExcludedPath, isExcludedExtension,
} from './pathResolver';
import { computeMd5Hex } from './md5';
import type { RearrangeResult } from '../types';

const IMAGE_EXTS = /\.(png|jpe?g|gif|bmp|svg|webp|tiff?|ico|heic|avif)$/i;
const ALL_ATTACHMENT_EXTS = /\.(png|jpe?g|gif|bmp|svg|webp|tiff?|ico|heic|avif|pdf|mp3|mp4|wav|ogg|webm|mov|zip|rar)$/i;

/** Extract attachment links from markdown content. */
export function extractAttachmentLinks(content: string): string[] {
  const links: string[] = [];
  const mdPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  const wikiPattern = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

  let m: RegExpExecArray | null;
  while ((m = mdPattern.exec(content))) {
    const href = decodeURIComponent(m[1].split('#')[0].split('?')[0]).trim();
    if (href && !href.startsWith('http')) links.push(href);
  }
  while ((m = wikiPattern.exec(content))) {
    links.push(m[1].trim());
  }
  return [...new Set(links)];
}

/** Resolve a possibly-relative link to an absolute path. */
export function resolveLink(link: string, noteDir: string, vaultRoot: string): string {
  if (link.startsWith('/')) return `${vaultRoot}${link}`;
  return `${noteDir}/${link}`.replace(/\/{2,}/g, '/');
}

/** Extract file extension (with dot). */
function getExt(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot) : '';
}

/** Extract filename without extension. */
function getBaseName(path: string): string {
  const file = path.split('/').pop() ?? '';
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
}

/**
 * Rearrange all linked attachments for a single note.
 */
export async function rearrangeNoteAttachments(
  notePath: string,
  vaultRoot: string,
): Promise<RearrangeResult> {
  const result: RearrangeResult = { moved: 0, skipped: 0, errors: [] };
  const config = get(attachmentConfig);
  const overrides = get(attachmentOverrides);

  if (isExcludedPath(notePath, config.excludePaths, config.excludeSubpaths)) {
    log.debug('rearrange: note excluded', { notePath });
    return result;
  }

  let note;
  try { note = await getNote(notePath); }
  catch { result.errors.push(`Failed to read note: ${notePath}`); return result; }

  const links = extractAttachmentLinks(note.content);
  if (links.length === 0) return result;

  const noteDir = notePath.substring(0, notePath.lastIndexOf('/'));
  const extPattern = config.handleAllAttachments ? ALL_ATTACHMENT_EXTS : IMAGE_EXTS;

  for (const link of links) {
    const absLink = resolveLink(link, noteDir, vaultRoot);
    const ext = getExt(absLink);

    if (!extPattern.test(absLink)) { result.skipped++; continue; }
    if (isExcludedExtension(ext, config.excludeExtensionPattern)) {
      result.skipped++; continue;
    }

    try {
      const baseName = getBaseName(absLink);
      const md5 = await computeMd5Hex(absLink);
      const origName = getOriginalName(md5) ?? baseName;
      recordOriginalName(md5, origName);

      const ctx = buildContext(notePath, origName, md5);
      const destPath = buildAttachmentPath(config, overrides, ctx, ext, vaultRoot);

      if (absLink === destPath) { result.skipped++; continue; }

      await renameNote(absLink, destPath);
      await updateLinksOnRename(absLink, destPath);
      result.moved++;
      log.debug('rearrange: moved attachment', { from: absLink, to: destPath });
    } catch (err) {
      result.errors.push(`${link}: ${(err as Error).message}`);
    }
  }

  return result;
}

/**
 * Rearrange attachments for all markdown/canvas files in the vault.
 */
export async function rearrangeAllAttachments(
  notePaths: string[],
  vaultRoot: string,
): Promise<RearrangeResult> {
  const totals: RearrangeResult = { moved: 0, skipped: 0, errors: [] };

  for (const path of notePaths) {
    if (!path.endsWith('.md') && !path.endsWith('.canvas')) continue;
    const r = await rearrangeNoteAttachments(path, vaultRoot);
    totals.moved += r.moved;
    totals.skipped += r.skipped;
    totals.errors.push(...r.errors);
  }

  log.info('rearrange: completed', {
    moved: totals.moved, skipped: totals.skipped, errors: totals.errors.length,
  });
  return totals;
}
