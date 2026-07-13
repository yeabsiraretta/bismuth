/**
 * Tag Wrangler Service — vault-wide tag operations.
 *
 * Inspired by obsidian-tag-wrangler:
 * - Rename tags across all vault notes (inline + frontmatter + subtags)
 * - Find notes containing a tag
 * - Tag page management (notes with tag as alias)
 * - Merge detection and warning
 */

// ── Types ────────────────────────────────────────────────────────

interface TagRenameResult {
  /** Total files scanned */
  scanned: number;
  /** Files modified */
  modified: number;
  /** Paths of modified files */
  modifiedPaths: string[];
  /** Whether a merge occurred (target tag already existed) */
  merged: boolean;
}

export interface TagLocation {
  path: string;
  title: string;
  lineNumber: number;
  lineContent: string;
  type: 'inline' | 'frontmatter';
}

export interface NoteWithTag {
  path: string;
  title: string;
  count: number;
}

// ── Inline tag replacement ───────────────────────────────────────

/**
 * Rename all occurrences of a tag (and its subtags) in inline content.
 * Handles case-insensitive matching like Obsidian.
 * E.g. renaming #foo to #bar also renames #foo/child → #bar/child.
 */
export function renameInlineTags(
  content: string,
  oldTag: string,
  newTag: string
): { content: string; count: number } {
  const oldLower = oldTag.toLowerCase();
  let count = 0;

  // Match #tag patterns, preserving surrounding whitespace
  const result = content.replace(/(?<=^|\s)#([a-zA-Z][\w/-]*)/g, (match, captured: string) => {
    const capturedLower = captured.toLowerCase();
    if (capturedLower === oldLower) {
      count++;
      return `#${newTag}`;
    }
    if (capturedLower.startsWith(oldLower + '/')) {
      count++;
      return `#${newTag}${captured.slice(oldTag.length)}`;
    }
    return match;
  });

  return { content: result, count };
}

// ── Frontmatter tag replacement ──────────────────────────────────

const FM_FENCE = /^---\r?\n([\s\S]*?)\r?\n---/;

/**
 * Rename tags in YAML frontmatter.
 * Supports: inline array [a, b], comma-separated, YAML list.
 */
export function renameFrontmatterTags(
  content: string,
  oldTag: string,
  newTag: string
): { content: string; count: number } {
  const fmMatch = content.match(FM_FENCE);
  if (!fmMatch) return { content, count: 0 };

  const fm = fmMatch[1];
  let count = 0;

  const replaceTag = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    const oldLower = oldTag.toLowerCase();
    if (tagLower === oldLower) {
      count++;
      return newTag;
    }
    if (tagLower.startsWith(oldLower + '/')) {
      count++;
      return newTag + tag.slice(oldTag.length);
    }
    return tag;
  };

  // Try inline array: tags: [a, b, c]
  let newFm = fm.replace(/^(tags:\s*)\[([^\]]*)\]/m, (_match, prefix: string, items: string) => {
    const newItems = items
      .split(',')
      .map((t) => {
        const trimmed = t.trim().replace(/^["']|["']$/g, '');
        if (!trimmed) return t;
        const replaced = replaceTag(trimmed);
        // Preserve quoting style
        if (t.trim().startsWith('"')) return ` "${replaced}"`;
        if (t.trim().startsWith("'")) return ` '${replaced}'`;
        return ` ${replaced}`;
      })
      .join(',');
    return `${prefix}[${newItems.trim()}]`;
  });

  // Try comma-separated: tags: a, b, c
  newFm = newFm.replace(/^(tags:\s+)(?!\[)(.+)$/m, (_match, prefix: string, items: string) => {
    if (items.trim().startsWith('-')) return _match; // YAML list, skip
    const newItems = items
      .split(',')
      .map((t) => replaceTag(t.trim()))
      .join(', ');
    return `${prefix}${newItems}`;
  });

  // Try YAML list: tags:\n  - a\n  - b
  newFm = newFm.replace(
    /^(tags:\s*\n)((?:[ \t]+-[ \t]+.+\n?)+)/m,
    (_match, prefix: string, block: string) => {
      const newBlock = block.replace(
        /^([ \t]+-[ \t]+)(.+)/gm,
        (_line, indent: string, tag: string) => {
          return `${indent}${replaceTag(tag.trim())}`;
        }
      );
      return `${prefix}${newBlock}`;
    }
  );

  if (count === 0) return { content, count: 0 };

  const newContent = content.replace(FM_FENCE, `---\n${newFm}\n---`);
  return { content: newContent, count };
}

// ── Full document rename ─────────────────────────────────────────

/**
 * Rename all tag occurrences (inline + frontmatter) in a document.
 */
export function renameTagsInContent(
  content: string,
  oldTag: string,
  newTag: string
): { content: string; totalReplacements: number } {
  const fm = renameFrontmatterTags(content, oldTag, newTag);
  const inline = renameInlineTags(fm.content, oldTag, newTag);
  return {
    content: inline.content,
    totalReplacements: fm.count + inline.count,
  };
}

// ── Tag location finder ──────────────────────────────────────────

/**
 * Find all locations of a tag (and subtags) in content.
 */
export function findTagLocations(
  content: string,
  tag: string,
  path: string,
  title: string
): TagLocation[] {
  const locations: TagLocation[] = [];
  const tagLower = tag.toLowerCase();
  const lines = content.split('\n');

  let inFrontmatter = false;
  let fmStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track frontmatter boundaries
    if (line.trim() === '---') {
      if (!fmStarted) {
        fmStarted = true;
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }

    if (inFrontmatter) {
      // Check for tag in frontmatter
      const fmTags = line.match(/^tags:\s*(.+)/) ?? line.match(/^\s+-\s+(.+)/);
      if (fmTags) {
        const tagsStr = fmTags[1].trim();
        const tagList = tagsStr
          .replace(/[[\]"']/g, '')
          .split(',')
          .map((t) => t.trim().replace(/^-\s*/, ''));
        for (const t of tagList) {
          if (t.toLowerCase() === tagLower || t.toLowerCase().startsWith(tagLower + '/')) {
            locations.push({
              path,
              title,
              lineNumber: i + 1,
              lineContent: line,
              type: 'frontmatter',
            });
          }
        }
      }
    } else {
      // Inline tags
      const re = /(?:^|\s)#([a-zA-Z][\w/-]*)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        const found = m[1].toLowerCase();
        if (found === tagLower || found.startsWith(tagLower + '/')) {
          locations.push({
            path,
            title,
            lineNumber: i + 1,
            lineContent: line,
            type: 'inline',
          });
        }
      }
    }
  }

  return locations;
}

// ── Notes with tag ───────────────────────────────────────────────

/**
 * Find all notes containing a specific tag (or subtag).
 */
export function findNotesWithTag(
  notes: { path: string; title: string; content: string }[],
  tag: string
): NoteWithTag[] {
  const result: NoteWithTag[] = [];

  for (const note of notes) {
    let count = 0;
    const locations = findTagLocations(note.content, tag, note.path, note.title);
    count = locations.length;
    if (count > 0) {
      result.push({ path: note.path, title: note.title, count });
    }
  }

  return result.sort((a, b) => b.count - a.count);
}

// ── Tag page management ─────────────────────────────────────────

/**
 * Check if a note is a tag page (has the tag as an alias).
 */
export function isTagPage(content: string, tag: string): boolean {
  const fmMatch = content.match(FM_FENCE);
  if (!fmMatch) return false;

  const fm = fmMatch[1];
  const aliasMatch = fm.match(/^(?:alias|aliases):\s*(.+)/im);
  if (!aliasMatch) return false;

  const aliasStr = aliasMatch[1].trim();
  const normalizedTag = `#${tag}`;

  // Check inline format: aliases: "#tag", "other"
  if (aliasStr.startsWith('[')) {
    const aliases = aliasStr
      .slice(1, -1)
      .split(',')
      .map((a) => a.trim().replace(/^["']|["']$/g, ''));
    return aliases.some((a) => a.toLowerCase() === normalizedTag.toLowerCase());
  }

  // Check comma-separated or single
  if (aliasStr.startsWith('"') || aliasStr.startsWith("'")) {
    const aliases = aliasStr
      .replace(/^["']|["']$/g, '')
      .split(',')
      .map((a) => a.trim());
    return aliases.some((a) => a.toLowerCase() === normalizedTag.toLowerCase());
  }

  // YAML list check
  const listMatch = fm.match(/^(?:alias|aliases):\s*\n((?:\s+-\s+.+\n?)+)/im);
  if (listMatch) {
    const items = listMatch[1]
      .split('\n')
      .map((l) =>
        l
          .replace(/^\s+-\s+/, '')
          .trim()
          .replace(/^["']|["']$/g, '')
      )
      .filter(Boolean);
    return items.some((a) => a.toLowerCase() === normalizedTag.toLowerCase());
  }

  return false;
}

/**
 * Find the tag page for a given tag across all notes.
 */
export function findTagPage(
  notes: { path: string; title: string; content: string }[],
  tag: string
): { path: string; title: string } | null {
  for (const note of notes) {
    if (isTagPage(note.content, tag)) {
      return { path: note.path, title: note.title };
    }
  }
  return null;
}

/**
 * Generate content for a new tag page.
 */
export function generateTagPageContent(tag: string): string {
  return `---
aliases: ["#${tag}"]
tags: [${tag}]
---

# ${tag}

`;
}

// ── Merge detection ──────────────────────────────────────────────

/**
 * Check if renaming oldTag to newTag would merge with existing tags.
 * Returns the list of tags that would be merged.
 */
export function detectMerge(existingTags: string[], oldTag: string, newTag: string): string[] {
  const oldLower = oldTag.toLowerCase();
  const newLower = newTag.toLowerCase();
  const merges: string[] = [];

  // Collect all tags that will be renamed
  const renamedTags = new Set<string>();
  for (const tag of existingTags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === oldLower || tagLower.startsWith(oldLower + '/')) {
      const renamed = newLower + tagLower.slice(oldLower.length);
      renamedTags.add(renamed);
    }
  }

  // Check if any renamed tag already exists
  for (const tag of existingTags) {
    const tLower = tag.toLowerCase();
    if (tLower === oldLower || tLower.startsWith(oldLower + '/')) continue;
    if (renamedTags.has(tLower)) {
      merges.push(tag);
    }
  }

  return merges;
}

// ── Subtag utilities ─────────────────────────────────────────────

/**
 * Get all child tags for a parent tag.
 */
export function getChildTags(allTags: string[], parentTag: string): string[] {
  const parentLower = parentTag.toLowerCase() + '/';
  return allTags.filter((t) => t.toLowerCase().startsWith(parentLower));
}

/**
 * Get the parent tag for a nested tag. Returns null for root tags.
 */
export function getParentTag(tag: string): string | null {
  const idx = tag.lastIndexOf('/');
  return idx > 0 ? tag.slice(0, idx) : null;
}

/**
 * Get the leaf name of a tag (last segment).
 */
export function getTagLeaf(tag: string): string {
  const idx = tag.lastIndexOf('/');
  return idx >= 0 ? tag.slice(idx + 1) : tag;
}
