/**
 * SMILES parser — find ```smiles code blocks and inline SMILES strings.
 *
 * Each line in a smiles block is one SMILES string.
 * Lines starting with // are treated as comments/labels.
 * Empty lines are skipped.
 * A trailing // comment on a SMILES line becomes the label.
 */

import type { SmilesBlock, SmilesEntry, InlineSmiles } from '../types';

// ─── Block parsing ─────────────────────────────────────────────────────────────

/** Parse a single line from a SMILES code block. */
export function parseSmilesLine(line: string): SmilesEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  // Check for trailing label: SMILES // label
  const commentIdx = trimmed.indexOf(' //');
  if (commentIdx > 0) {
    return {
      smiles: trimmed.slice(0, commentIdx).trim(),
      label: trimmed.slice(commentIdx + 3).trim() || undefined,
    };
  }

  return { smiles: trimmed };
}

/** Parse a smiles code block body into entries. */
export function parseSmilesBlock(body: string): SmilesEntry[] {
  return body
    .split('\n')
    .map(parseSmilesLine)
    .filter((e): e is SmilesEntry => e !== null);
}

/** Find all ```smiles fenced code blocks in document text. */
export function findSmilesBlocks(text: string): SmilesBlock[] {
  const blocks: SmilesBlock[] = [];
  const regex = /^```smiles\s*\n([\s\S]*?)^```/gm;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const entries = parseSmilesBlock(match[1]);
    if (entries.length > 0) {
      blocks.push({
        from: match.index,
        to: match.index + match[0].length,
        entries,
      });
    }
  }

  return blocks;
}

// ─── Inline parsing ────────────────────────────────────────────────────────────

/** Find all inline SMILES in document text.
 *  Default syntax: $smiles=C1=CC=CC=C1
 *  Ends at whitespace, newline, or end of string. */
export function findInlineSmiles(text: string, prefix: string = '$smiles='): InlineSmiles[] {
  if (!prefix) return [];
  const results: InlineSmiles[] = [];
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPrefix + '([^\\s`]+)', 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      from: match.index,
      to: match.index + match[0].length,
      smiles: match[1],
    });
  }

  return results;
}

// ─── Sample generation ─────────────────────────────────────────────────────────

/** Generate a sample SMILES code block for insertion. */
export function sampleSmilesBlock(): string {
  return `\`\`\`smiles
C1=CC=CC=C1 // Benzene
CC(=O)O // Acetic acid
CC(=O)Oc1ccccc1C(=O)O // Aspirin
\`\`\``;
}
