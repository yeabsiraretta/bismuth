/**
 * Inline decoration logic for live preview extension.
 * Handles token-level markdown syntax hiding and visual formatting.
 *
 * Syntax markers are always hidden — no cursor-reveal behavior.
 * Decorations rebuild on doc/viewport change only (not cursor movement).
 *
 * Extracted from livePreview.ts to comply with 300-line file limit.
 */

import { Decoration } from '@codemirror/view';
import type { Range } from '@codemirror/state';
export {
  TableWidget,
  HrWidget,
  ImageWidget,
  CheckboxWidget,
  CalloutWidget,
  renderTable,
  charToTaskState,
} from './livePreviewWidgets';
export type { TaskState } from './livePreviewWidgets';

// ─── Decoration marks (visual styling only, no hiding) ───────────────────────

export const h1 = Decoration.mark({ class: 'cm-lp-h1' });
export const h2 = Decoration.mark({ class: 'cm-lp-h2' });
export const h3 = Decoration.mark({ class: 'cm-lp-h3' });
export const h4 = Decoration.mark({ class: 'cm-lp-h4' });
export const h5 = Decoration.mark({ class: 'cm-lp-h5' });
export const h6 = Decoration.mark({ class: 'cm-lp-h6' });
export const bold = Decoration.mark({ class: 'cm-lp-bold' });
export const italic = Decoration.mark({ class: 'cm-lp-italic' });
export const strikethrough = Decoration.mark({ class: 'cm-lp-strikethrough' });
export const inlineCode = Decoration.mark({ class: 'cm-lp-code' });
export const link = Decoration.mark({ class: 'cm-lp-link' });
export const highlight = Decoration.mark({ class: 'cm-lp-highlight' });
export const underline = Decoration.mark({ class: 'cm-lp-underline' });
export const superscript = Decoration.mark({ class: 'cm-lp-sup' });
export const subscriptMark = Decoration.mark({ class: 'cm-lp-sub' });
export const footnoteRef = Decoration.mark({ class: 'cm-lp-footnote-ref' });
export const footnoteDetailLine = Decoration.line({ class: 'cm-lp-footnote-detail' });
export const footnoteDetailId = Decoration.mark({ class: 'cm-lp-footnote-detail-id' });
export const quoteLine = Decoration.line({ class: 'cm-lp-quote-line' });
export const hrLine = Decoration.line({ class: 'cm-lp-hr' });
export const tableLine = Decoration.line({ class: 'cm-lp-table-line' });
export const tableHiddenLine = Decoration.line({ class: 'cm-lp-table-hidden' });
export const codeBlockLine = Decoration.line({ class: 'cm-lp-codeblock-line' });
export const codeBlockFence = Decoration.line({ class: 'cm-lp-codeblock-fence' });
export const listBulletLine = Decoration.line({ class: 'cm-lp-list-bullet' });
export const listOrderedLine = Decoration.line({ class: 'cm-lp-list-ordered' });
export const listResetLine = Decoration.line({ class: 'cm-lp-list-reset' });
export const quoteFirstLine = Decoration.line({ class: 'cm-lp-quote-line cm-lp-quote-first' });
export const quoteLastLine = Decoration.line({ class: 'cm-lp-quote-line cm-lp-quote-last' });
export const quoteMiddleLine = Decoration.line({ class: 'cm-lp-quote-line cm-lp-quote-mid' });
export const quoteSingleLine = Decoration.line({ class: 'cm-lp-quote-line cm-lp-quote-single' });
export const flashcardLine = Decoration.mark({ class: 'cm-lp-flashcard' });
export const flashcardFront = Decoration.mark({ class: 'cm-lp-flashcard-front' });
export const flashcardBack = Decoration.mark({ class: 'cm-lp-flashcard-back' });
export const flashcardSep = Decoration.mark({ class: 'cm-lp-flashcard-sep' });
export const flashcardReversed = Decoration.mark({ class: 'cm-lp-flashcard-reversed' });
export const clozeDeletion = Decoration.mark({ class: 'cm-lp-cloze' });

/** Returns a line decoration for a bullet list item at the given indent level (0-based). */
export function listBulletIndent(indentLevel: number) {
  const level = Math.max(0, Math.min(indentLevel, 6));
  if (level === 0) return listBulletLine;
  return Decoration.line({ class: `cm-lp-list-bullet cm-lp-list-indent-${level}` });
}

/** Returns a line decoration for an ordered list item at the given indent level (0-based). */
export function listOrderedIndent(indentLevel: number) {
  const level = Math.max(0, Math.min(indentLevel, 6));
  if (level === 0) return listOrderedLine;
  return Decoration.line({ class: `cm-lp-list-ordered cm-lp-list-indent-${level}` });
}

export const hiddenMark = Decoration.mark({ class: 'cm-lp-hidden' });

// ─── Inline decoration — always hides syntax markers ─────────────────────────

/**
 * Apply inline formatting decorations to a text span starting at `offset`.
 * Syntax markers (* ** ~ ` [[ etc.) are always hidden unconditionally.
 */
export function decorateInline(decos: Range<Decoration>[], offset: number, text: string) {
  let m: RegExpExecArray | null;

  // Bold **text** or __text__
  const boldRe = /(\*\*|__)(.+?)\1/g;
  while ((m = boldRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    const markerLen = m[1].length;
    decos.push(hiddenMark.range(start, start + markerLen));
    decos.push(hiddenMark.range(end - markerLen, end));
    decos.push(bold.range(start + markerLen, end - markerLen));
  }

  // Italic *text* or _text_ (not inside bold)
  const italicRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
  while ((m = italicRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 1));
    decos.push(hiddenMark.range(end - 1, end));
    decos.push(italic.range(start + 1, end - 1));
  }

  // Strikethrough ~~text~~
  const strikeRe = /~~(.+?)~~/g;
  while ((m = strikeRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 2));
    decos.push(hiddenMark.range(end - 2, end));
    decos.push(strikethrough.range(start + 2, end - 2));
  }

  // Inline code `text`
  const codeRe = /`([^`]+)`/g;
  while ((m = codeRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 1));
    decos.push(hiddenMark.range(end - 1, end));
    decos.push(inlineCode.range(start + 1, end - 1));
  }

  // Images ![alt](url) — hide syntax, show alt text as link
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((m = imgRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    const altStart = start + 2;
    const altEnd = altStart + m[1].length;
    decos.push(hiddenMark.range(start, altStart)); // hide ![
    decos.push(hiddenMark.range(altEnd, end)); // hide ](url)
    if (m[1]) decos.push(link.range(altStart, altEnd));
  }

  // Links [text](url) — skip if preceded by ! (handled as image above)
  const mdLinkRe = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  while ((m = mdLinkRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    const titleStart = start + 1;
    const titleEnd = titleStart + m[1].length;
    decos.push(hiddenMark.range(start, titleStart)); // hide [
    decos.push(hiddenMark.range(titleEnd, end)); // hide ](url)
    decos.push(link.range(titleStart, titleEnd));
  }

  // Wikilinks [[target]] or [[target|alias]]
  const wikiRe = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  while ((m = wikiRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    if (m[2]) {
      // Has alias: hide [[target| and ]], show only alias
      const aliasStart = start + 2 + m[1].length + 1;
      decos.push(hiddenMark.range(start, aliasStart));
      decos.push(hiddenMark.range(end - 2, end));
      decos.push(link.range(aliasStart, end - 2));
    } else {
      // No alias: hide [[ and ]], show target
      decos.push(hiddenMark.range(start, start + 2));
      decos.push(hiddenMark.range(end - 2, end));
      decos.push(link.range(start + 2, end - 2));
    }
  }

  // Highlight ==text==
  const highlightRe = /==(.+?)==/g;
  while ((m = highlightRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 2));
    decos.push(hiddenMark.range(end - 2, end));
    decos.push(highlight.range(start + 2, end - 2));
  }

  // HTML underline <u>text</u>
  const uRe = /<u>(.+?)<\/u>/gi;
  while ((m = uRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 3)); // hide <u>
    decos.push(hiddenMark.range(end - 4, end)); // hide </u>
    decos.push(underline.range(start + 3, end - 4));
  }

  // HTML superscript <sup>text</sup>
  const supRe = /<sup>(.+?)<\/sup>/gi;
  while ((m = supRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 5)); // hide <sup>
    decos.push(hiddenMark.range(end - 6, end)); // hide </sup>
    decos.push(superscript.range(start + 5, end - 6));
  }

  // HTML subscript <sub>text</sub>
  const subRe = /<sub>(.+?)<\/sub>/gi;
  while ((m = subRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 5)); // hide <sub>
    decos.push(hiddenMark.range(end - 6, end)); // hide </sub>
    decos.push(subscriptMark.range(start + 5, end - 6));
  }

  // Footnote references [^1]
  const fnRefRe = /\[\^([^\]]+)\]/g;
  while ((m = fnRefRe.exec(text)) !== null) {
    const start = offset + m.index;
    const end = start + m[0].length;
    decos.push(hiddenMark.range(start, start + 2)); // hide [^
    decos.push(hiddenMark.range(end - 1, end)); // hide ]
    decos.push(footnoteRef.range(start + 2, end - 1));
  }
}
