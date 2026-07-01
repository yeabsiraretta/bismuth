/**
 * Arbor markdown parser — extract block tree from a markdown note with block markers.
 * Format: <!-- arbor:block:v1 id="..." parent="..." order="0" -->
 * Metadata: <!-- arbor:metadata:v1 BASE64_JSON -->
 */
import type { ArborBlock, ArborTree, ArborMetadata } from '../types';
import { generateBlockId } from '../types';

const BLOCK_MARKER_RE = /<!-- arbor:block:v1 id="([^"]+)" parent="([^"]*)" order="(\d+)" -->/g;
const METADATA_RE = /<!-- arbor:metadata:v1\n([\s\S]*?)\n-->/;

/** Parse an arbor-managed note into a block tree. */
export function parseArborNote(content: string, notePath: string): ArborTree {
  const blocks: ArborBlock[] = [];
  const markers = [...content.matchAll(BLOCK_MARKER_RE)];

  if (markers.length === 0) {
    // Not an arbor note — create a single root block with all content
    const cleanContent = stripMetadata(content).trim();
    if (cleanContent) {
      blocks.push({
        id: generateBlockId(),
        parentId: null,
        order: 0,
        content: cleanContent,
        collapsed: false,
      });
    }
    return { noteId: notePath, notePath, blocks, version: 1 };
  }

  // Parse blocks from markers
  for (let i = 0; i < markers.length; i++) {
    const match = markers[i];
    const id = match[1];
    const parentId = match[2] || null;
    const order = parseInt(match[3], 10);
    const markerEnd = match.index! + match[0].length;

    // Content extends until the next marker or metadata block
    let contentEnd: number;
    if (i < markers.length - 1) {
      contentEnd = markers[i + 1].index!;
    } else {
      const metaMatch = content.slice(markerEnd).match(/<!-- arbor:metadata:v1/);
      contentEnd = metaMatch ? markerEnd + metaMatch.index! : content.length;
    }

    const blockContent = content.slice(markerEnd, contentEnd).trim();
    blocks.push({ id, parentId, order, content: blockContent, collapsed: false });
  }

  // Try to load metadata for any extra info
  const version = parseMetadataVersion(content);

  return { noteId: notePath, notePath, blocks, version };
}

/** Serialize an arbor tree back to markdown with markers + metadata. */
export function serializeArborNote(tree: ArborTree, preserveFrontmatter?: string): string {
  const parts: string[] = [];

  // Preserve frontmatter if present
  if (preserveFrontmatter) {
    parts.push(preserveFrontmatter);
    parts.push('');
  }

  // Serialize blocks depth-first (roots first, then their children)
  const serialized = serializeBlocksOrdered(tree.blocks);
  for (const block of serialized) {
    const marker = `<!-- arbor:block:v1 id="${block.id}" parent="${block.parentId || ''}" order="${block.order}" -->`;
    parts.push(marker);
    parts.push(block.content);
    parts.push('');
  }

  // Append metadata comment
  const meta: ArborMetadata = {
    version: tree.version,
    blocks: tree.blocks.map((b) => ({ id: b.id, parentId: b.parentId, order: b.order })),
  };
  const encoded = btoa(JSON.stringify(meta));
  parts.push(`<!-- arbor:metadata:v1\n${encoded}\n-->`);

  return parts.join('\n');
}

/** Order blocks depth-first for serialization. */
function serializeBlocksOrdered(blocks: ArborBlock[]): ArborBlock[] {
  const result: ArborBlock[] = [];
  const roots = blocks.filter((b) => b.parentId === null).sort((a, b) => a.order - b.order);

  function walk(block: ArborBlock): void {
    result.push(block);
    const children = blocks
      .filter((b) => b.parentId === block.id)
      .sort((a, b) => a.order - b.order);
    children.forEach(walk);
  }

  roots.forEach(walk);
  return result;
}

/** Extract frontmatter from note content. */
export function extractFrontmatter(content: string): string | undefined {
  if (!content.startsWith('---')) return undefined;
  const end = content.indexOf('---', 3);
  if (end === -1) return undefined;
  return content.slice(0, end + 3);
}

/** Strip the metadata comment from content. */
function stripMetadata(content: string): string {
  return content.replace(METADATA_RE, '').trim();
}

/** Parse version from metadata block. */
function parseMetadataVersion(content: string): number {
  const match = content.match(METADATA_RE);
  if (!match) return 1;
  try {
    const decoded = atob(match[1].trim());
    const meta: ArborMetadata = JSON.parse(decoded);
    return meta.version || 1;
  } catch {
    return 1;
  }
}

/** Check if a note is arbor-managed. */
export function isArborNote(content: string): boolean {
  return BLOCK_MARKER_RE.test(content) || METADATA_RE.test(content);
}
