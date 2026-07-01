/**
 * Speed Reader text processing — markdown cleanup and word tokenization.
 * Uses remark-parse (already in project deps) for correct AST-based text extraction.
 */
import type { WordToken } from '../types';
import { calculateORP, calculateDelay } from '../types';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Content } from 'mdast';

/** Strip markdown formatting via AST, extracting only readable text. */
export function cleanMarkdown(text: string): string {
  // Strip frontmatter before parsing
  let source = text;
  if (source.startsWith('---')) {
    const end = source.indexOf('\n---', 3);
    if (end !== -1) source = source.slice(end + 4);
  }

  try {
    const tree = unified().use(remarkParse).parse(source) as Root;
    return extractText(tree).trim();
  } catch {
    // Fallback: naive strip if AST fails
    return naiveClean(source);
  }
}

/** Recursively extract text from mdast nodes. */
function extractText(node: Root | Content): string {
  // Skip non-readable nodes
  if (node.type === 'code' || node.type === 'html' || node.type === 'thematicBreak') return '';
  if (node.type === 'image') return '';

  // Text leaf nodes
  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value;
  }

  // Recurse into children
  if ('children' in node) {
    const parts = (node.children as Content[]).map(extractText);
    // Add spacing between block-level elements
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') {
      return parts.join('') + ' ';
    }
    return parts.join('');
  }

  return '';
}

/** Fallback: regex-based cleanup if AST parsing fails. */
function naiveClean(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  cleaned = cleaned.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t);
  cleaned = cleaned.replace(/[*_~=`#]+/g, '');
  cleaned = cleaned.replace(/^>\s?/gm, '');
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');
  cleaned = cleaned.replace(/\[[ x]\]\s*/gi, '');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  return cleaned.trim();
}

/** Tokenize cleaned text into word tokens with ORP and delay data. */
export function tokenize(text: string): WordToken[] {
  const cleaned = cleanMarkdown(text);
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  return words.map(word => ({
    text: word,
    orpIndex: calculateORP(word),
    delayMultiplier: calculateDelay(word),
  }));
}

/** Calculate reading time estimate in seconds. */
export function estimateReadingTime(tokens: WordToken[], wpm: number): number {
  if (tokens.length === 0 || wpm <= 0) return 0;
  const baseMs = 60000 / wpm;
  const totalMs = tokens.reduce((sum, t) => sum + baseMs * t.delayMultiplier, 0);
  return Math.round(totalMs / 1000);
}
