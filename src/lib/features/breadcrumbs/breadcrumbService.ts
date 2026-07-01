/**
 * Breadcrumb service — builds trail, parses frontmatter relationships, resolves siblings.
 */

import type { BreadcrumbSegment, BreadcrumbContext } from './types';
import { PARENT_KEYS, PREV_KEYS, NEXT_KEYS } from './types';

/** Build a vault-relative breadcrumb trail from an absolute note path. */
export function buildTrail(notePath: string, vaultRoot: string): BreadcrumbSegment[] {
  if (!notePath || !vaultRoot) return [];

  const root = vaultRoot.replace(/\/+$/, '');
  const relative = notePath.startsWith(root)
    ? notePath.slice(root.length).replace(/^\//, '')
    : notePath;

  const parts = relative.split('/').filter(Boolean);
  if (parts.length === 0) return [];

  const trail: BreadcrumbSegment[] = [];
  let currentPath = root;

  for (let i = 0; i < parts.length; i++) {
    currentPath = `${currentPath}/${parts[i]}`;
    const isLast = i === parts.length - 1;
    trail.push({
      label: isLast ? parts[i].replace(/\.md$/i, '') : parts[i],
      path: currentPath,
      isActive: isLast,
      type: isLast ? 'note' : 'folder',
    });
  }

  return trail;
}

/**
 * Extract a wikilink target title from a frontmatter value.
 * Handles `"[[Note Name]]"`, `"[[Note Name|alias]]"`, `"[[Note#heading]]"`, and plain strings.
 */
export function parseWikilinkValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^\[\[(.+?)\]\]$/);
  if (match) {
    return match[1].split('|')[0].split('#')[0].trim() || null;
  }
  return trimmed;
}

/** Look up the first defined value for a set of frontmatter keys. */
function firstFrontmatterValue(
  fm: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const val = fm[key];
    if (val !== undefined && val !== null) return parseWikilinkValue(val);
  }
  return null;
}

/** Build the full breadcrumb context from a note's path and frontmatter. */
export function buildContext(
  notePath: string,
  vaultRoot: string,
  frontmatter: Record<string, unknown>,
): BreadcrumbContext {
  return {
    trail: buildTrail(notePath, vaultRoot),
    parent: firstFrontmatterValue(frontmatter, PARENT_KEYS),
    prev: firstFrontmatterValue(frontmatter, PREV_KEYS),
    next: firstFrontmatterValue(frontmatter, NEXT_KEYS),
  };
}

/**
 * Resolve prev/next from sibling notes in the same folder.
 * Expects a sorted array of note filenames (without path prefix).
 */
export function resolveSiblings(
  notePath: string,
  siblingPaths: string[],
): { prev: string | null; next: string | null } {
  if (siblingPaths.length < 2) return { prev: null, next: null };

  const idx = siblingPaths.indexOf(notePath);
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? siblingPaths[idx - 1] : null,
    next: idx < siblingPaths.length - 1 ? siblingPaths[idx + 1] : null,
  };
}
