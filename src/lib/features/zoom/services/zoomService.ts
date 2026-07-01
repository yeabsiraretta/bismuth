/**
 * Zoom service — section boundary detection and zoom range calculation.
 *
 * Determines where a heading or list item starts and ends so the editor
 * can hide everything outside that range.
 */

import type { ZoomTarget, ZoomRange, ZoomBreadcrumb } from '../types/zoom';

// ─── Regex patterns ─────────────────────────────────────────────────────────

const HEADING_RE = /^(#{1,6})\s+(.+)/;
const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)/;

// ─── Heading detection ──────────────────────────────────────────────────────

/** Find all headings in the document. */
export function findHeadings(content: string): ZoomTarget[] {
  const lines = content.split('\n');
  const targets: ZoomTarget[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING_RE);
    if (m) {
      targets.push({ kind: 'heading', line: i + 1, level: m[1].length, text: m[2].trim() });
    }
  }
  return targets;
}

/** Find all top-level list items (and nested) in the document. */
export function findListItems(content: string): ZoomTarget[] {
  const lines = content.split('\n');
  const targets: ZoomTarget[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LIST_RE);
    if (m) {
      const indent = m[1].replace(/\t/g, '  ').length;
      const level = Math.floor(indent / 2);
      targets.push({ kind: 'list', line: i + 1, level, text: m[3].trim() });
    }
  }
  return targets;
}

// ─── Section boundary calculation ───────────────────────────────────────────

/**
 * Calculate the visible range for a heading target.
 *
 * A heading's section extends from the heading line to just before:
 *   - The next heading of equal or higher level, OR
 *   - The end of the document.
 */
export function headingRange(content: string, targetLine: number): ZoomRange | null {
  const lines = content.split('\n');
  if (targetLine < 1 || targetLine > lines.length) return null;

  const targetMatch = lines[targetLine - 1].match(HEADING_RE);
  if (!targetMatch) return null;
  const targetLevel = targetMatch[1].length;

  // Start offset
  let from = 0;
  for (let i = 0; i < targetLine - 1; i++) {
    from += lines[i].length + 1; // +1 for newline
  }

  // Find the end: next heading of same or higher level
  let to = content.length;
  let offset = from;
  for (let i = targetLine - 1; i < lines.length; i++) {
    if (i > targetLine - 1) {
      const m = lines[i].match(HEADING_RE);
      if (m && m[1].length <= targetLevel) {
        to = offset;
        break;
      }
    }
    offset += lines[i].length + 1;
  }

  // Trim trailing whitespace
  while (to > from && content[to - 1] === '\n') to--;

  return { from, to };
}

/**
 * Calculate the visible range for a list item target.
 *
 * A list item's section extends from the item line to just before:
 *   - The next list item of equal or lower indent level, OR
 *   - A non-list line (heading, blank after list, etc.), OR
 *   - The end of the document.
 */
export function listItemRange(content: string, targetLine: number): ZoomRange | null {
  const lines = content.split('\n');
  if (targetLine < 1 || targetLine > lines.length) return null;

  const targetMatch = lines[targetLine - 1].match(LIST_RE);
  if (!targetMatch) return null;
  const targetIndent = targetMatch[1].replace(/\t/g, '  ').length;

  // Start offset
  let from = 0;
  for (let i = 0; i < targetLine - 1; i++) {
    from += lines[i].length + 1;
  }

  // Find the end
  let to = content.length;
  let offset = from;
  for (let i = targetLine - 1; i < lines.length; i++) {
    if (i > targetLine - 1) {
      const line = lines[i];
      const m = line.match(LIST_RE);
      if (m) {
        const indent = m[1].replace(/\t/g, '  ').length;
        if (indent <= targetIndent) {
          to = offset;
          break;
        }
      } else if (line.trim() === '') {
        // Blank line — check if the next line continues the list
        if (i + 1 < lines.length && LIST_RE.test(lines[i + 1])) {
          const nextM = lines[i + 1].match(LIST_RE);
          if (nextM) {
            const nextIndent = nextM[1].replace(/\t/g, '  ').length;
            if (nextIndent > targetIndent) {
              offset += line.length + 1;
              continue;
            }
          }
        }
        to = offset;
        break;
      } else {
        // Non-list, non-blank content — check if it's a continuation (indented text)
        const lineIndent = line.match(/^(\s*)/)?.[1]?.replace(/\t/g, '  ').length ?? 0;
        if (lineIndent <= targetIndent) {
          to = offset;
          break;
        }
      }
    }
    offset += lines[i].length + 1;
  }

  while (to > from && content[to - 1] === '\n') to--;

  return { from, to };
}

// ─── Unified zoom range ────────────────────────────────────────────────────

/** Calculate the zoom range for any target. */
export function calculateZoomRange(content: string, target: ZoomTarget): ZoomRange | null {
  if (target.kind === 'heading') return headingRange(content, target.line);
  return listItemRange(content, target.line);
}

// ─── Target detection at cursor position ────────────────────────────────────

/**
 * Find the zoom target at a given 1-indexed line number.
 * Checks headings first, then list items.
 */
export function targetAtLine(content: string, line: number): ZoomTarget | null {
  const lines = content.split('\n');
  if (line < 1 || line > lines.length) return null;
  const text = lines[line - 1];

  const hm = text.match(HEADING_RE);
  if (hm) {
    return { kind: 'heading', line, level: hm[1].length, text: hm[2].trim() };
  }

  const lm = text.match(LIST_RE);
  if (lm) {
    const indent = lm[1].replace(/\t/g, '  ').length;
    return { kind: 'list', line, level: Math.floor(indent / 2), text: lm[3].trim() };
  }

  return null;
}

// ─── Breadcrumb building ────────────────────────────────────────────────────

/**
 * Build a breadcrumb trail from the document root to the target.
 * Walks up from the target line, collecting parent headings/list items.
 */
export function buildBreadcrumbs(content: string, target: ZoomTarget): ZoomBreadcrumb[] {
  const crumbs: ZoomBreadcrumb[] = [];
  const lines = content.split('\n');

  if (target.kind === 'heading') {
    // Walk backwards from target line, collecting higher-level headings
    let currentLevel = target.level;
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      if (i === target.line - 1) break;
      offset += lines[i].length + 1;
    }

    let scanOffset = 0;
    for (let i = 0; i < target.line - 1; i++) {
      const m = lines[i].match(HEADING_RE);
      if (m && m[1].length < currentLevel) {
        crumbs.push({
          target: { kind: 'heading', line: i + 1, level: m[1].length, text: m[2].trim() },
          from: scanOffset,
        });
        currentLevel = m[1].length;
      }
      scanOffset += lines[i].length + 1;
    }
  } else {
    // Walk backwards from target line, collecting parent list items
    let currentIndent = target.level * 2;
    let scanOffset = 0;
    for (let i = 0; i < target.line - 1; i++) {
      const m = lines[i].match(LIST_RE);
      if (m) {
        const indent = m[1].replace(/\t/g, '  ').length;
        if (indent < currentIndent) {
          crumbs.push({
            target: { kind: 'list', line: i + 1, level: Math.floor(indent / 2), text: m[3].trim() },
            from: scanOffset,
          });
          currentIndent = indent;
        }
      }
      scanOffset += lines[i].length + 1;
    }
  }

  // Add the target itself
  let targetOffset = 0;
  for (let i = 0; i < target.line - 1; i++) {
    targetOffset += lines[i].length + 1;
  }
  crumbs.push({ target, from: targetOffset });

  return crumbs;
}
