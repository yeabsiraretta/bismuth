/**
 * Wikilink parsing and resolution utilities
 * @module lib/utils/wikilink
 */

import type { Link } from '@/types/vault';

/**
 * Regular expression for matching wikilinks
 * Matches: [[target]], [[target|alias]], [[target#heading]]
 * @constant
 */
const WIKILINK_REGEX = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;


/**
 * Parses a wikilink string and extracts its components
 *
 * @param {string} linkText - The wikilink text (e.g., "[[Note Title|Alias]]")
 * @returns {Link | null} Parsed link object or null if invalid
 *
 * @example
 * ```typescript
 * const link = parseWikilink("[[My Note|Display Text]]");
 * // Returns: { targetTitle: "My Note", alias: "Display Text", ... }
 * ```
 */
export function parseWikilink(linkText: string): Link | null {
  const match = linkText.match(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/);

  if (!match) {
    return null;
  }

  const [, targetTitle, , alias] = match;

  return {
    source_path: '', // Will be set by caller
    target_title: targetTitle.trim(),
    target_path: null,
    alias: alias?.trim(),
    is_resolved: false,
  };
}

/**
 * Extracts all wikilinks from markdown content
 *
 * @param {string} content - Markdown content to parse
 * @param {string} sourcePath - Path of the source note
 * @returns {Link[]} Array of extracted links
 *
 * @example
 * ```typescript
 * const content = "See [[Note 1]] and [[Note 2|Link Text]]";
 * const links = extractWikilinks(content, "/vault/current-note.md");
 * // Returns array of Link objects
 * ```
 */
export function extractWikilinks(content: string, sourcePath: string): Link[] {
  const links: Link[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKILINK_REGEX.lastIndex = 0;

  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const [, targetTitle, , alias] = match;

    links.push({
      source_path: sourcePath,
      target_title: targetTitle.trim(),
      target_path: null,
      alias: alias?.trim(),
      is_resolved: false,
    });
  }

  return links;
}

/**
 * Checks if a string contains wikilink syntax
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains wikilinks
 *
 * @example
 * ```typescript
 * hasWikilinks("This has a [[link]]"); // true
 * hasWikilinks("This has no links"); // false
 * ```
 */
export function hasWikilinks(text: string): boolean {
  return WIKILINK_REGEX.test(text);
}

/**
 * Converts a wikilink to markdown link format
 *
 * @param {Link} link - Link object to convert
 * @param {string} [baseUrl=''] - Base URL for the link
 * @returns {string} Markdown link string
 *
 * @example
 * ```typescript
 * const link = { targetTitle: "Note", alias: "Link Text", ... };
 * wikilinkToMarkdown(link); // "[Link Text](Note.md)"
 * ```
 */
export function wikilinkToMarkdown(link: Link, baseUrl = ''): string {
  const displayText = link.alias || link.target_title;
  const href = link.target_path
    ? `${baseUrl}${link.target_path}`
    : `${baseUrl}${link.target_title}.md`;

  return `[${displayText}](${href})`;
}

/**
 * Resolves a wikilink target to an actual file path
 *
 * @param {string} targetTitle - The target note title
 * @param {string[]} allNotePaths - Array of all note paths in the vault
 * @returns {string | null} Resolved path or null if not found
 *
 * @example
 * ```typescript
 * const paths = ["/vault/notes/my-note.md", "/vault/other.md"];
 * resolveWikilink("My Note", paths); // "/vault/notes/my-note.md"
 * ```
 */
export function resolveWikilink(targetTitle: string, allNotePaths: string[]): string | null {
  const normalizedTarget = targetTitle.toLowerCase().replace(/\s+/g, '-');

  // Try exact match first
  const exactMatch = allNotePaths.find((path) => {
    const filename = path.split('/').pop()?.replace('.md', '').toLowerCase();
    return filename === normalizedTarget;
  });

  if (exactMatch) {
    return exactMatch;
  }

  // Try fuzzy match
  const fuzzyMatch = allNotePaths.find((path) => {
    const filename = path.split('/').pop()?.replace('.md', '').toLowerCase();
    return filename?.includes(normalizedTarget);
  });

  return fuzzyMatch || null;
}

/**
 * Validates wikilink syntax
 *
 * @param {string} linkText - Wikilink text to validate
 * @returns {boolean} True if valid wikilink syntax
 *
 * @example
 * ```typescript
 * isValidWikilink("[[Valid Link]]"); // true
 * isValidWikilink("[[]]"); // false
 * isValidWikilink("[Invalid]"); // false
 * ```
 */
export function isValidWikilink(linkText: string): boolean {
  if (!linkText.startsWith('[[') || !linkText.endsWith(']]')) {
    return false;
  }

  const content = linkText.slice(2, -2).trim();
  return content.length > 0;
}

/**
 * Extracts backlinks for a given note
 *
 * @param {string} notePath - Path of the note to find backlinks for
 * @param {Map<string, Link[]>} allLinks - Map of note paths to their outgoing links
 * @returns {Link[]} Array of backlinks pointing to this note
 *
 * @example
 * ```typescript
 * const backlinks = getBacklinks("/vault/target.md", linksMap);
 * // Returns all links from other notes pointing to target.md
 * ```
 */
export function getBacklinks(notePath: string, allLinks: Map<string, Link[]>): Link[] {
  const backlinks: Link[] = [];

  for (const [sourcePath, links] of allLinks.entries()) {
    for (const link of links) {
      if (link.target_path === notePath) {
        backlinks.push({
          ...link,
          source_path: sourcePath,
        });
      }
    }
  }

  return backlinks;
}
