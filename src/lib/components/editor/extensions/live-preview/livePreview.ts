/**
 * Live preview extension for CodeMirror — always-on markdown rendering.
 *
 * Syntax markers are always hidden; decorations rebuild only on content or
 * viewport change (NOT on cursor movement) to eliminate jitter.
 *
 * Three display modes:
 * - **Live Preview**: All markdown rendered, syntax always hidden
 * - **Source Mode**: Shows all raw markdown characters
 * - **Reading Mode**: Fully rendered, non-editable view
 *
 * Performance: viewport-only decoration computation (<16ms budget).
 * Architecture: decorations extracted to livePreviewDecorators.ts.
 */

import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { type Range } from '@codemirror/state';
import { log } from '@/utils/logger';
import {
  h1, h2, h3, h4, h5, h6, hiddenMark, tableLine, tableHiddenLine,
  listBulletIndent, listOrderedIndent,
  listResetLine, footnoteDetailLine, footnoteDetailId,
  CheckboxWidget, HrWidget, ImageWidget, TableWidget, renderTable,
  charToTaskState, decorateInline,
} from './livePreviewDecorators';
import { decorateQuoteBlock, decorateFlashcard, decorateCloze, decorateCodeBlock } from './livePreviewBlocks';
import { detectLineTagName } from '@/features/typography';

// ─── Active line detection (used only for table cursor check) ───────────────

function getActiveLines(view: EditorView): Set<number> {
  const active = new Set<number>();
  // Only consider cursor position when the editor is focused —
  // an unfocused editor at position 0 (just loaded) should not suppress table rendering.
  if (!view.hasFocus) return active;
  const { state } = view;
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let i = startLine; i <= endLine; i++) active.add(i);
  }
  return active;
}

// ─── Decoration builder (viewport-only for performance) ─────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  try {
    return buildDecorationsInner(view);
  } catch (err) {
    log.error('LivePreview: buildDecorations failed, returning empty', err as Error);
    return Decoration.none;
  }
}

function buildDecorationsInner(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const doc = view.state.doc;
  // Active lines used only for table widget: show raw when cursor is inside table
  const activeLines = getActiveLines(view);

  const { from: vpFrom, to: vpTo } = view.viewport;
  const startLine = doc.lineAt(vpFrom).number;
  const endLine = doc.lineAt(vpTo).number;

  // Detect frontmatter boundaries to avoid treating --- as HR
  const fmLines = new Set<number>();
  if (doc.line(1).text === '---') {
    fmLines.add(1);
    for (let fl = 2; fl <= doc.lines; fl++) {
      if (doc.line(fl).text === '---') { fmLines.add(fl); break; }
    }
  }

  let tableStart = -1;
  let tableLines: string[] = [];
  let tableFirstLine = -1;

  // Pre-scan for fenced code blocks to skip decoration inside them
  const codeBlockRanges: Array<{ startLine: number; endLine: number }> = [];
  let cbOpen = -1;
  for (let s = 1; s <= doc.lines; s++) {
    const lt = doc.line(s).text;
    if (/^(`{3,}|~{3,})/.test(lt)) {
      if (cbOpen === -1) { cbOpen = s; }
      else { codeBlockRanges.push({ startLine: cbOpen, endLine: s }); cbOpen = -1; }
    }
  }
  if (cbOpen !== -1) {
    codeBlockRanges.push({ startLine: cbOpen, endLine: doc.lines });
  }

  function isInCodeBlock(lineNum: number): boolean {
    for (const r of codeBlockRanges) {
      if (lineNum >= r.startLine && lineNum <= r.endLine) return true;
    }
    return false;
  }

  for (let i = startLine; i <= endLine; i++) {
    const line = doc.line(i);
    const text = line.text;

    // Contextual typography: add data-tag-name to the cm-line div
    const tagName = detectLineTagName(text);
    if (tagName) {
      decos.push(Decoration.line({ attributes: { 'data-tag-name': tagName } }).range(line.from));
    }

    // Styled code block rendering — delegated to livePreviewBlocks
    if (isInCodeBlock(i)) {
      const newIdx = decorateCodeBlock(view, decos, i, text, codeBlockRanges, activeLines);
      if (newIdx > 0) { i = newIdx; }
      continue;
    }

    // Table accumulation
    if (text.trimStart().startsWith('|')) {
      if (tableStart === -1) { tableStart = line.from; tableFirstLine = i; }
      tableLines.push(text);
      const nextLine = i < doc.lines ? doc.line(i + 1).text : '';
      if (!nextLine.trimStart().startsWith('|')) {
        // Render as widget unless cursor is anywhere in the table
        let cursorInTable = false;
        for (let tl = tableFirstLine; tl <= i; tl++) {
          if (activeLines.has(tl)) { cursorInTable = true; break; }
        }
        if (tableLines.length >= 2 && !cursorInTable) {
          const html = renderTable(tableLines);
          const firstTLine = doc.line(tableFirstLine);
          decos.push(Decoration.replace({
            widget: new TableWidget(html),
          }).range(firstTLine.from, firstTLine.to));
          for (let tl = tableFirstLine + 1; tl <= i; tl++) {
            const tLine = doc.line(tl);
            decos.push(tableHiddenLine.range(tLine.from, tLine.from));
            if (tLine.from < tLine.to) {
              decos.push(hiddenMark.range(tLine.from, tLine.to));
            }
          }
        } else {
          for (let tl = tableFirstLine; tl <= i; tl++) {
            decos.push(tableLine.range(doc.line(tl).from, doc.line(tl).from));
          }
        }
        tableStart = -1;
        tableLines = [];
        tableFirstLine = -1;
      }
      continue;
    }

    // Horizontal rule (skip frontmatter delimiters)
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(text) && !fmLines.has(i)) {
      decos.push(Decoration.replace({ widget: new HrWidget() }).range(line.from, line.to));
      continue;
    }

    // Headings H1–H6 — always hide the # markers
    const headingMatch = text.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const markEnd = line.from + headingMatch[0].length;
      decos.push(hiddenMark.range(line.from, markEnd));
      const headingDecos = [h1, h2, h3, h4, h5, h6];
      const deco = headingDecos[level - 1];
      if (line.to > markEnd) {
        decos.push(deco.range(markEnd, line.to));
      }
      continue;
    }

    // Blockquote / Callout — multi-line grouping with callout detection
    if (/^(>+)\s?/.test(text)) {
      i = decorateQuoteBlock(view, decos, i, endLine, activeLines);
      continue;
    }

    // Inline flashcard: Question :: Answer (basic) or ::: (reversed)
    if (decorateFlashcard(decos, line.from, line.to, text, activeLines, i)) continue;

    // Cloze deletion: ==text== or {text}
    if (decorateCloze(decos, line.from, text, line.to, activeLines, i)) continue;

    // Image ![alt](url) — always render widget
    const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      decos.push(Decoration.replace({
        widget: new ImageWidget(imgMatch[2], imgMatch[1]),
      }).range(line.from, line.from + imgMatch[0].length));
      if (text.length > imgMatch[0].length) {
        decorateInline(decos, line.from + imgMatch[0].length, text.slice(imgMatch[0].length));
      }
      continue;
    }

    // Footnote detail line: [^id]: content
    const fnDetailMatch = text.match(/^(\[\^([^\]]+)\]:\s?)/);
    if (fnDetailMatch) {
      decos.push(footnoteDetailLine.range(line.from, line.from));
      const idEnd = line.from + fnDetailMatch[1].length;
      decos.push(footnoteDetailId.range(line.from, line.from + fnDetailMatch[0].indexOf(']:') + 2));
      if (line.to > idEnd) {
        decorateInline(decos, idEnd, text.slice(fnDetailMatch[1].length));
      }
      continue;
    }

    // Checkbox list items: - [x], - [ ], - [/], - [>], - [-] — render state widget
    const checkMatch = text.match(/^(\s*[-*+]\s)\[([xX /\->])\]\s/);
    if (checkMatch) {
      const cbOffset = line.from + checkMatch[1].length + 1;
      const taskState = charToTaskState(checkMatch[2]);
      const replaceFrom = line.from + checkMatch[1].length;
      const replaceTo = replaceFrom + 3;
      decos.push(Decoration.replace({
        widget: new CheckboxWidget(taskState, cbOffset),
      }).range(replaceFrom, replaceTo));
      const afterCheck = checkMatch[0].length;
      decorateInline(decos, line.from + afterCheck, text.slice(afterCheck));
      continue;
    }

    // Regular list items (unordered and ordered) — always hide marker
    const listMatch = text.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const indent = listMatch[1];
      const marker = listMatch[2];
      const isOrdered = /^\d+\.$/.test(marker);
      const prevLineText = i > 1 ? doc.line(i - 1).text : '';
      const prevIsList = /^\s*([-*+]|\d+\.)\s/.test(prevLineText);
      if (isOrdered && !prevIsList) {
        decos.push(listResetLine.range(line.from, line.from));
      }
      // Normalize: treat a tab as 2 spaces for indent level calculation
      const normalizedIndentLen = indent.replace(/\t/g, '  ').length;
      const indentLevel = Math.floor(normalizedIndentLen / 2);
      const lineClass = isOrdered ? listOrderedIndent(indentLevel) : listBulletIndent(indentLevel);
      decos.push(lineClass.range(line.from, line.from));
      // Always hide the raw indent + marker
      const markerTo = line.from + listMatch[0].length;
      decos.push(hiddenMark.range(line.from, markerTo));
      decorateInline(decos, markerTo, text.slice(listMatch[0].length));
      continue;
    }

    // Regular line
    decorateInline(decos, line.from, text);
  }

  return Decoration.set(decos, true);
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      log.info('LivePreview: plugin CREATED');
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      // Rebuild only on content or viewport change — NOT on cursor movement.
      // This eliminates jitter caused by decoration rebuilds on every keystroke/click.
      if (update.docChanged || update.viewportChanged) {
        try {
          this.decorations = buildDecorations(update.view);
        } catch (err) {
          log.error('LivePreview: update failed', err as Error);
          this.decorations = Decoration.none;
        }
      }
    }
    destroy() {
      log.info('LivePreview: plugin DESTROYED');
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { livePreviewTheme } from './livePreviewTheme';
