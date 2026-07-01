/**
 * Block-level decoration builders for blockquotes, callouts, inline flashcards,
 * and cloze deletions. Extracted from livePreview.ts for 350-line compliance.
 */

import { Decoration, type EditorView } from '@codemirror/view';
import type { Range } from '@codemirror/state';
import {
  hiddenMark,
  tableHiddenLine,
  codeBlockLine,
  codeBlockFence,
  quoteFirstLine,
  quoteLastLine,
  quoteMiddleLine,
  quoteSingleLine,
  flashcardFront,
  flashcardBack,
  flashcardSep,
  flashcardReversed,
  clozeDeletion,
  CalloutWidget,
  decorateInline,
} from './livePreviewDecorators';
import {
  CodeBlockWidget,
  parseCodeBlockParams,
  resolveHighlightGroups,
  isLanguageExcluded,
  DEFAULT_THEME,
} from '@/features/code-styler';
import { FlashcardWidget, ClozeWidget } from '@/features/flashcards';

interface QuoteRawLine {
  lineNum: number;
  content: string;
}

/**
 * Handle a blockquote/callout block starting at line `startLineNum`.
 * Advances the loop index `i` and pushes decorations into `decos`.
 * Returns the new loop index value after consuming the quote block.
 */
export function decorateQuoteBlock(
  view: EditorView,
  decos: Range<Decoration>[],
  startLineNum: number,
  endLine: number,
  activeLines: Set<number>
): number {
  const doc = view.state.doc;
  let i = startLineNum;

  // Collect all consecutive quote lines
  const quoteBlockStart = i;
  const quoteRawLines: QuoteRawLine[] = [];
  while (i <= endLine) {
    const qLine = doc.line(i);
    const qText = qLine.text;
    const qm = qText.match(/^(>+)\s?/);
    if (!qm) break;
    quoteRawLines.push({ lineNum: i, content: qText.slice(qm[0].length) });
    if (i < endLine) i++;
    else break;
  }
  // If we overshot (line i is not a quote), back up
  if (i <= endLine && !doc.line(i).text.match(/^(>+)\s?/)) i--;

  // Check for callout syntax: > [!type] optional title
  const calloutMatch = quoteRawLines[0]?.content.match(/^\[!(\w+)\]([+-])?\s*(.*)?$/);

  if (calloutMatch && !activeLines.has(quoteBlockStart)) {
    const calloutType = calloutMatch[1];
    const foldChar = calloutMatch[2];
    const title = (calloutMatch[3] || '').trim();
    const bodyLines = quoteRawLines.slice(1).map((r) => r.content);

    const firstLine = doc.line(quoteBlockStart);
    decos.push(
      Decoration.replace({
        widget: new CalloutWidget(calloutType, title, bodyLines, !!foldChar, foldChar === '-'),
      }).range(firstLine.from, firstLine.to)
    );

    for (let ql = 1; ql < quoteRawLines.length; ql++) {
      const qln = doc.line(quoteBlockStart + ql);
      decos.push(tableHiddenLine.range(qln.from, qln.from));
      if (qln.from < qln.to) decos.push(hiddenMark.range(qln.from, qln.to));
    }
  } else {
    // Regular blockquote — grouped styling
    for (let qi = 0; qi < quoteRawLines.length; qi++) {
      const qln = doc.line(quoteBlockStart + qi);
      const qText = qln.text;
      const qm = qText.match(/^(>+)\s?/)!;
      const markerEnd = qm[0].length;

      let lineClass: Decoration;
      if (quoteRawLines.length === 1) {
        lineClass = quoteSingleLine;
      } else if (qi === 0) {
        lineClass = quoteFirstLine;
      } else if (qi === quoteRawLines.length - 1) {
        lineClass = quoteLastLine;
      } else {
        lineClass = quoteMiddleLine;
      }
      decos.push(lineClass.range(qln.from, qln.from));
      decos.push(hiddenMark.range(qln.from, qln.from + markerEnd));
      decorateInline(decos, qln.from + markerEnd, qText.slice(markerEnd));
    }
  }

  return i;
}

/**
 * Decorate an inline flashcard line (Question :: Answer or ::: reversed).
 * When cursor is away, renders a card widget; otherwise applies inline marks.
 * Returns true if the line was a flashcard, false otherwise.
 */
export function decorateFlashcard(
  decos: Range<Decoration>[],
  lineFrom: number,
  lineTo: number,
  text: string,
  activeLines?: Set<number>,
  lineNum?: number
): boolean {
  const reversedMatch = text.match(/^(.+?)\s*:::\s*(.+)$/);
  const basicMatch = !reversedMatch ? text.match(/^(.+?)\s*::\s*(.+)$/) : null;
  if (!reversedMatch && !basicMatch) return false;

  const match = reversedMatch ?? basicMatch!;
  const variant = reversedMatch ? 'reversed' : 'basic';
  const front = match[1];
  const back = match[2];

  // Widget mode: cursor not on this line
  if (activeLines && lineNum !== undefined && !activeLines.has(lineNum)) {
    decos.push(
      Decoration.replace({
        widget: new FlashcardWidget(front, back, variant, lineFrom),
      }).range(lineFrom, lineTo)
    );
    return true;
  }

  // Inline mark mode: cursor on line, show raw text with styling
  const sep = reversedMatch ? ':::' : '::';
  const sepIdx = text.indexOf(sep);
  const frontEnd = lineFrom + sepIdx;
  const sepEnd = frontEnd + sep.length;

  if (frontEnd > lineFrom) {
    decos.push(flashcardFront.range(lineFrom, frontEnd));
  }
  decos.push(flashcardSep.range(frontEnd, sepEnd));
  if (reversedMatch) {
    decos.push(flashcardReversed.range(frontEnd, sepEnd));
  }
  if (sepEnd < lineTo) {
    decos.push(flashcardBack.range(sepEnd, lineTo));
  }
  return true;
}

/**
 * Decorate cloze deletions (==text== or {text}) on a single line.
 * When cursor is away, renders a cloze card widget.
 * Returns true if any cloze was found.
 */
export function decorateCloze(
  decos: Range<Decoration>[],
  lineFrom: number,
  text: string,
  lineTo?: number,
  activeLines?: Set<number>,
  lineNum?: number
): boolean {
  const hasCloze = /==.+?==/.test(text) || /(?<!\{)\{(?!\{)[^{}]+\}(?!\})/.test(text);
  if (!hasCloze) return false;

  // Widget mode: cursor not on this line
  if (activeLines && lineNum !== undefined && lineTo !== undefined && !activeLines.has(lineNum)) {
    const clozes: Array<{ original: string; answer: string }> = [];
    let cm: RegExpExecArray | null;
    const re1 = /==(.+?)==/g;
    while ((cm = re1.exec(text)) !== null) {
      clozes.push({ original: cm[0], answer: cm[1] });
    }
    const re2 = /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g;
    while ((cm = re2.exec(text)) !== null) {
      clozes.push({ original: cm[0], answer: cm[1] });
    }
    if (clozes.length > 0) {
      decos.push(
        Decoration.replace({
          widget: new ClozeWidget(text, clozes, lineFrom),
        }).range(lineFrom, lineTo)
      );
      return true;
    }
  }

  // Inline mark mode
  let clozeMatch: RegExpExecArray | null;
  const clozeHighRe = /==(.+?)==/g;
  while ((clozeMatch = clozeHighRe.exec(text)) !== null) {
    const start = lineFrom + clozeMatch.index;
    const end = start + clozeMatch[0].length;
    decos.push(hiddenMark.range(start, start + 2));
    decos.push(hiddenMark.range(end - 2, end));
    decos.push(clozeDeletion.range(start + 2, end - 2));
  }
  const clozeCurlyRe = /(?<!\{)\{(?!\{)([^{}]+)\}(?!\})/g;
  while ((clozeMatch = clozeCurlyRe.exec(text)) !== null) {
    const start = lineFrom + clozeMatch.index;
    const end = start + clozeMatch[0].length;
    decos.push(hiddenMark.range(start, start + 1));
    decos.push(hiddenMark.range(end - 1, end));
    decos.push(clozeDeletion.range(start + 1, end - 1));
  }
  decorateInline(decos, lineFrom, text);
  return true;
}

// ─── Code block widget ──────────────────────────────────────────────────────

interface CodeBlockRange {
  startLine: number;
  endLine: number;
}

/**
 * Attempt to render a styled code block widget at the start of a code block.
 * Returns the new line index if the block was rendered as a widget, or -1 to fall back.
 */
export function decorateCodeBlock(
  view: EditorView,
  decos: Range<Decoration>[],
  lineNum: number,
  text: string,
  cbRanges: CodeBlockRange[],
  activeLines: Set<number>
): number {
  const doc = view.state.doc;
  const cbRange = cbRanges.find((r) => r.startLine <= lineNum && r.endLine >= lineNum);

  if (cbRange && lineNum === cbRange.startLine) {
    const fenceText = doc.line(cbRange.startLine).text;
    const params = parseCodeBlockParams(fenceText);

    if (!params.ignore && !isLanguageExcluded(params.language, [])) {
      const codeLines: string[] = [];
      for (let cl = cbRange.startLine + 1; cl < cbRange.endLine; cl++) {
        codeLines.push(doc.line(cl).text);
      }

      const highlights = resolveHighlightGroups(
        params.highlights,
        codeLines,
        DEFAULT_THEME.altHighlights,
        DEFAULT_THEME.codeblock.highlightColor,
        true
      );

      let cursorInBlock = false;
      for (let cl = cbRange.startLine; cl <= cbRange.endLine; cl++) {
        if (activeLines.has(cl)) {
          cursorInBlock = true;
          break;
        }
      }

      if (!cursorInBlock) {
        const firstLine = doc.line(cbRange.startLine);
        decos.push(
          Decoration.replace({
            widget: new CodeBlockWidget(params, codeLines, highlights, DEFAULT_THEME, params.fold),
          }).range(firstLine.from, firstLine.to)
        );

        for (let cl = cbRange.startLine + 1; cl <= cbRange.endLine; cl++) {
          const cLine = doc.line(cl);
          decos.push(tableHiddenLine.range(cLine.from, cLine.from));
          if (cLine.from < cLine.to) {
            decos.push(hiddenMark.range(cLine.from, cLine.to));
          }
        }

        return cbRange.endLine;
      }
    }
  }

  // Fallback: cursor inside block or ignored — plain styled lines
  const isFenceLine = /^(`{3,}|~{3,})/.test(text);
  if (isFenceLine) {
    decos.push(codeBlockFence.range(doc.line(lineNum).from, doc.line(lineNum).from));
  } else {
    decos.push(codeBlockLine.range(doc.line(lineNum).from, doc.line(lineNum).from));
  }
  return -1;
}
