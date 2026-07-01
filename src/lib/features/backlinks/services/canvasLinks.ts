/**
 * Canvas Links — extracts backlink references from canvas JSON files.
 * Handles file cards (direct file references) and text cards (embedded wikilinks).
 */
import type { CanvasLink } from '../types';
import { WIKILINK_RE } from '../types';

// ─── Canvas JSON structure (Obsidian-compatible) ─────────────────────────────

interface CanvasNode {
  id: string;
  type: string;
  /** For file cards: the referenced file path */
  file?: string;
  /** For text cards: the text content */
  text?: string;
}

interface CanvasData {
  nodes?: CanvasNode[];
}

// ─── Extraction ──────────────────────────────────────────────────────────────

/** Extract all links from a canvas file's JSON content */
export function extractCanvasLinks(canvasPath: string, jsonContent: string): CanvasLink[] {
  let data: CanvasData;
  try {
    data = JSON.parse(jsonContent);
  } catch {
    return [];
  }

  if (!data.nodes || !Array.isArray(data.nodes)) return [];

  const links: CanvasLink[] = [];

  for (const node of data.nodes) {
    if (node.type === 'file' && node.file) {
      links.push({
        canvasPath,
        targetPath: node.file,
        cardType: 'file',
        cardId: node.id,
      });
    }

    if (node.type === 'text' && node.text) {
      const wikilinks = extractWikilinksFromText(node.text);
      for (const target of wikilinks) {
        links.push({
          canvasPath,
          targetPath: target,
          cardType: 'text',
          cardId: node.id,
        });
      }
    }
  }

  return links;
}

/** Extract wikilink targets from text content */
function extractWikilinksFromText(text: string): string[] {
  const targets: string[] = [];
  const re = new RegExp(WIKILINK_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}

/** Check if a path is a canvas file */
export function isCanvasFile(path: string): boolean {
  return path.endsWith('.canvas');
}
