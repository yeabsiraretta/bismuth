/**
 * Prompt builder — assembles context + templates + instructions into
 * a ready-to-copy AI prompt.
 *
 * Context-first approach: the user's note/selection is the anchor,
 * templates provide structure, optional instructions refine the output.
 */

import type { PromptContext, SmartTemplate, BuiltPrompt } from '../types/smartTemplate';

// ─── Prompt assembly ───────────────────────────────────────────────────────────

/** Build a final prompt from context, selected templates, and optional instructions. */
export function buildPrompt(
  context: PromptContext,
  selectedTemplates: SmartTemplate[],
  instructions: string,
  maxContextLength: number
): BuiltPrompt {
  const sections: string[] = [];

  // 1. Template instructions (merged in order)
  if (selectedTemplates.length > 0) {
    const templateSection = selectedTemplates.map((t) => t.content.trim()).join('\n\n---\n\n');
    sections.push(`## Instructions\n\n${templateSection}`);
  }

  // 2. Custom instructions
  if (instructions.trim()) {
    sections.push(`## Additional Instructions\n\n${instructions.trim()}`);
  }

  // 3. Context (main note or selection)
  const truncatedContent = truncateContext(context.content, maxContextLength);
  const contextLabel = context.isSelection ? 'Selected Text' : `Note: ${context.noteTitle}`;
  sections.push(`## Context — ${contextLabel}\n\n${truncatedContent}`);

  // 4. Additional notes
  for (const note of context.additionalNotes) {
    const noteContent = truncateContext(note.content, Math.floor(maxContextLength / 2));
    sections.push(`## Additional Context — ${note.title}\n\n${noteContent}`);
  }

  const text = sections.join('\n\n---\n\n');

  return {
    text,
    templateNames: selectedTemplates.map((t) => t.name),
    charCount: text.length,
    estimatedTokens: estimateTokens(text),
    builtAt: new Date().toISOString(),
  };
}

// ─── Context helpers ───────────────────────────────────────────────────────────

/** Truncate context to max length, adding a notice if truncated. */
export function truncateContext(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  const truncated = content.slice(0, maxLength);
  // Try to break at a paragraph boundary
  const lastParagraph = truncated.lastIndexOf('\n\n');
  const breakpoint = lastParagraph > maxLength * 0.5 ? lastParagraph : maxLength;
  return truncated.slice(0, breakpoint) + '\n\n[... content truncated for length]';
}

/** Rough token estimate (~4 chars per token for English). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Build a PromptContext from note data and optional selection. */
export function buildContextFromNote(
  noteTitle: string,
  notePath: string,
  content: string,
  selection?: string
): PromptContext {
  return {
    noteTitle,
    notePath,
    content: selection || content,
    isSelection: !!selection,
    additionalNotes: [],
  };
}

/** Strip frontmatter from note content for cleaner context. */
export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  if (!match) return content;
  return content.slice(match[0].length).trim();
}

/** Format a built prompt for clipboard copy. */
export function formatPromptForClipboard(prompt: BuiltPrompt): string {
  return prompt.text;
}

/** Parse the context preview (first N lines). */
export function contextPreview(content: string, maxLines: number = 5): string {
  const lines = content.split('\n').slice(0, maxLines);
  const preview = lines.join('\n');
  if (content.split('\n').length > maxLines) {
    return preview + '\n…';
  }
  return preview;
}
