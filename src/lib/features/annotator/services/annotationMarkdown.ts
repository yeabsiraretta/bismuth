/**
 * Annotation markdown serializer/deserializer.
 *
 * Converts between DocumentAnnotation[] and markdown format.
 * Each annotation becomes a blockquote with:
 *   - PREFIX context line
 *   - HIGHLIGHT text
 *   - POSTFIX context line
 *   - COMMENT section
 *   - TAGS section
 *   - Block reference ^ann-{id}
 */

import type { DocumentAnnotation, AnnotationTargetType, HighlightColor } from '../types';
import { generatePrefixedId } from '@/utils/id';

/**
 * Serializes annotations into markdown text for an annotation note file.
 */
export function serializeAnnotations(
  target: string,
  targetType: AnnotationTargetType,
  annotations: DocumentAnnotation[],
): string {
  const frontmatter = [
    '---',
    `annotation-target: ${target}`,
    `annotation-target-type: ${targetType}`,
    '---',
    '',
  ].join('\n');

  const sorted = [...annotations].sort((a, b) => {
    if (a.page !== undefined && b.page !== undefined) return a.page - b.page;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const blocks = sorted.map((ann) => serializeAnnotation(ann));
  return frontmatter + blocks.join('\n\n');
}

/**
 * Serializes a single annotation into a markdown blockquote.
 */
function serializeAnnotation(ann: DocumentAnnotation): string {
  const lines: string[] = [];
  const pageRef = ann.page ? ` (Page ${ann.page})` : '';
  const chapterRef = ann.chapter ? ` (${ann.chapter})` : '';

  lines.push(`> [!annotation]${pageRef}${chapterRef}`);

  if (ann.quoteSelector.prefix) {
    lines.push(`> **PREFIX**: ${ann.quoteSelector.prefix}`);
  }
  lines.push(`> **HIGHLIGHT**: ==${ann.quoteSelector.exact}== [${ann.color}]`);
  if (ann.quoteSelector.suffix) {
    lines.push(`> **POSTFIX**: ${ann.quoteSelector.suffix}`);
  }

  if (ann.comment) {
    lines.push(`> **COMMENT**: ${ann.comment}`);
  }

  if (ann.tags.length > 0) {
    lines.push(`> **TAGS**: ${ann.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(', ')}`);
  }

  lines.push(`> ^${ann.id}`);
  return lines.join('\n');
}

/**
 * Deserializes annotation markdown content back into annotations.
 * Extracts the annotation-target from frontmatter and parses blockquotes.
 */
export function deserializeAnnotations(content: string): {
  target: string;
  targetType: AnnotationTargetType;
  annotations: DocumentAnnotation[];
} {
  const { frontmatter, body } = parseFrontmatterBlock(content);
  const target = frontmatter['annotation-target'] ?? '';
  const targetType = resolveTargetType(target, frontmatter['annotation-target-type']);

  const annotations = parseAnnotationBlocks(body, target, targetType);
  return { target, targetType, annotations };
}

/**
 * Detects document type from file extension or explicit override.
 */
export function resolveTargetType(
  target: string,
  explicit?: string,
): AnnotationTargetType {
  if (explicit === 'pdf' || explicit === 'epub') return explicit;
  const lower = target.toLowerCase();
  if (lower.endsWith('.epub')) return 'epub';
  return 'pdf';
}

// ─── Internal Parsing ───────────────────────────────────────────────────────

function parseFrontmatterBlock(content: string): { frontmatter: Record<string, string>; body: string } {
  const fm: Record<string, string> = {};
  if (!content.startsWith('---')) return { frontmatter: fm, body: content };

  const endIdx = content.indexOf('---', 3);
  if (endIdx < 0) return { frontmatter: fm, body: content };

  const fmBlock = content.slice(3, endIdx).trim();
  for (const line of fmBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fm[key] = value;
    }
  }

  return { frontmatter: fm, body: content.slice(endIdx + 3).trim() };
}

function parseAnnotationBlocks(
  body: string,
  target: string,
  targetType: AnnotationTargetType,
): DocumentAnnotation[] {
  const blocks = body.split(/\n\n+(?=>)/).filter((b) => b.trim().startsWith('>'));
  const annotations: DocumentAnnotation[] = [];

  for (const block of blocks) {
    const ann = parseAnnotationBlock(block, target, targetType);
    if (ann) annotations.push(ann);
  }

  return annotations;
}

function parseAnnotationBlock(
  block: string,
  target: string,
  targetType: AnnotationTargetType,
): DocumentAnnotation | null {
  const lines = block.split('\n').map((l) => l.replace(/^>\s?/, ''));

  let page: number | undefined;
  let chapter: string | undefined;
  let highlight = '';
  let prefix = '';
  let suffix = '';
  let comment = '';
  let tags: string[] = [];
  let color: HighlightColor = 'yellow';
  let id = '';

  for (const line of lines) {
    const headerMatch = line.match(/\[!annotation\]\s*(?:\(Page (\d+)\))?\s*(?:\((.+)\))?/);
    if (headerMatch) {
      page = headerMatch[1] ? parseInt(headerMatch[1], 10) : undefined;
      chapter = headerMatch[2] || undefined;
      continue;
    }

    const highlightMatch = line.match(/\*\*HIGHLIGHT\*\*:\s*==(.+?)==\s*(?:\[(\w+)\])?/);
    if (highlightMatch) {
      highlight = highlightMatch[1];
      color = (highlightMatch[2] as HighlightColor) || 'yellow';
      continue;
    }

    const prefixMatch = line.match(/\*\*PREFIX\*\*:\s*(.+)/);
    if (prefixMatch) { prefix = prefixMatch[1]; continue; }

    const postfixMatch = line.match(/\*\*POSTFIX\*\*:\s*(.+)/);
    if (postfixMatch) { suffix = postfixMatch[1]; continue; }

    const commentMatch = line.match(/\*\*COMMENT\*\*:\s*(.+)/);
    if (commentMatch) { comment = commentMatch[1]; continue; }

    const tagsMatch = line.match(/\*\*TAGS\*\*:\s*(.+)/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map((t) => t.trim().replace(/^#/, ''));
      continue;
    }

    const idMatch = line.match(/\^(ann[_-][\w-]+)/);
    if (idMatch) { id = idMatch[1]; }
  }

  if (!highlight) return null;

  const now = new Date().toISOString();
  return {
    id: id || generatePrefixedId('ann'),
    target,
    targetType,
    page,
    chapter,
    quoteSelector: { exact: highlight, prefix, suffix },
    color,
    comment,
    tags,
    createdAt: now,
    updatedAt: now,
  };
}
