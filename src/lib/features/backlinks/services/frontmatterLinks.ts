/**
 * Frontmatter Links — extracts markdown-style links from YAML frontmatter values.
 * Handles nested objects and arrays recursively.
 */
import type { FrontmatterLink } from '../types';
import { FRONTMATTER_MD_LINK_RE } from '../types';

// ─── Value extraction ────────────────────────────────────────────────────────

/** Extract all string values from a frontmatter object recursively */
export function flattenFrontmatterValues(
  obj: Record<string, unknown>,
  prefix = ''
): Array<{ key: string; value: string }> {
  const results: Array<{ key: string; value: string }> = [];

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;

    if (typeof v === 'string') {
      results.push({ key: fullKey, value: v });
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const item = v[i];
        if (typeof item === 'string') {
          results.push({ key: `${fullKey}[${i}]`, value: item });
        } else if (item && typeof item === 'object') {
          results.push(
            ...flattenFrontmatterValues(item as Record<string, unknown>, `${fullKey}[${i}]`)
          );
        }
      }
    } else if (v && typeof v === 'object') {
      results.push(...flattenFrontmatterValues(v as Record<string, unknown>, fullKey));
    }
  }

  return results;
}

// ─── Link parsing ────────────────────────────────────────────────────────────

/** Parse markdown links from a single string value */
export function parseMarkdownLinks(value: string, key: string): FrontmatterLink[] {
  const links: FrontmatterLink[] = [];
  const re = new RegExp(FRONTMATTER_MD_LINK_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(value)) !== null) {
    links.push({
      key,
      title: match[1] || match[2],
      targetPath: match[2],
    });
  }

  return links;
}

// ─── Main extraction ─────────────────────────────────────────────────────────

/** Extract all markdown links from a note's frontmatter */
export function extractFrontmatterLinks(
  frontmatter: Record<string, unknown> | undefined | null
): FrontmatterLink[] {
  if (!frontmatter || typeof frontmatter !== 'object') return [];

  const values = flattenFrontmatterValues(frontmatter);
  const links: FrontmatterLink[] = [];

  for (const { key, value } of values) {
    links.push(...parseMarkdownLinks(value, key));
  }

  return links;
}
