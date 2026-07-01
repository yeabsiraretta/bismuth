/**
 * CodeMirror extension for MetaBind — interactive inline fields.
 *
 * Scans the document for inline code blocks containing MetaBind syntax:
 *   `INPUT[toggle:done]`  `VIEW[progress:progress]`  `BUTTON[Save:command(save)]`
 *
 * Replaces them with interactive widget decorations.
 * Reads frontmatter values from the document to populate widgets,
 * and writes changes back via the frontmatter service.
 */

import {
  Decoration,
  EditorView,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import type { Range } from '@codemirror/state';
import { parseMetaBindSyntax, isMetaBindSyntax } from '../services/metabindParser';
import { MetaBindInputWidget } from './metabindInputWidgets';
import { MetaBindViewWidget, MetaBindButtonWidget } from './metabindViewWidgets';
import type { MetaBindMatch, InputFieldDeclaration, ViewFieldDeclaration, ButtonDeclaration } from '../types/metabind';
import { log } from '@/utils/logger';

// ─── Frontmatter extraction (lightweight, in-editor) ─────────────────────────

function extractFrontmatter(docText: string): Record<string, unknown> {
  if (!docText.startsWith('---')) return {};
  const endIdx = docText.indexOf('\n---', 3);
  if (endIdx < 0) return {};
  const fmBlock = docText.slice(4, endIdx).trim();
  const fm: Record<string, unknown> = {};
  for (const line of fmBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = line.slice(0, colonIdx).trim();
    let rawValue = line.slice(colonIdx + 1).trim();
    // Parse simple YAML values
    if (rawValue === 'true') fm[key] = true;
    else if (rawValue === 'false') fm[key] = false;
    else if (rawValue === 'null' || rawValue === '') fm[key] = null;
    else if (/^-?\d+$/.test(rawValue)) fm[key] = parseInt(rawValue, 10);
    else if (/^-?\d+\.\d+$/.test(rawValue)) fm[key] = parseFloat(rawValue);
    else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      fm[key] = rawValue.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      fm[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }
  return fm;
}

/** Resolve a possibly dotted property path against frontmatter. */
function resolveProp(fm: Record<string, unknown>, prop: string): unknown {
  if (prop.includes('.')) {
    const parts = prop.split('.');
    let current: unknown = fm;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
  return fm[prop];
}

// ─── Active line detection (cursor-reveal, mirrors table behavior) ───────────

function getActiveLines(view: EditorView): Set<number> {
  const active = new Set<number>();
  if (!view.hasFocus) return active;
  const { state } = view;
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let i = startLine; i <= endLine; i++) active.add(i);
  }
  return active;
}

const activeCodeMark = Decoration.mark({ class: 'cm-mb-active-source' });

// ─── Inline code block scanning ──────────────────────────────────────────────

const INLINE_CODE_RE = /`([^`]+)`/g;

function findMetaBindBlocks(view: EditorView): MetaBindMatch[] {
  const matches: MetaBindMatch[] = [];
  const doc = view.state.doc;
  let inFrontmatter = false;
  let inCodeBlock = false;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    // Skip frontmatter
    if (i === 1 && text === '---') { inFrontmatter = true; continue; }
    if (inFrontmatter) { if (text === '---') inFrontmatter = false; continue; }

    // Skip fenced code blocks
    if (/^(`{3,}|~{3,})/.test(text)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    // Find inline code blocks
    INLINE_CODE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = INLINE_CODE_RE.exec(text)) !== null) {
      const content = m[1];
      if (!isMetaBindSyntax(content)) continue;
      const decl = parseMetaBindSyntax(content);
      if (!decl) continue;
      matches.push({
        declaration: decl,
        from: line.from + m.index,
        to: line.from + m.index + m[0].length,
      });
    }
  }

  return matches;
}

// ─── Frontmatter update via document edit ────────────────────────────────────

function updateFrontmatterInDoc(view: EditorView, property: string, value: unknown) {
  const docText = view.state.doc.toString();
  if (!docText.startsWith('---')) {
    // No frontmatter — insert one
    const yamlVal = formatYamlValue(value);
    const newFm = `---\n${property}: ${yamlVal}\n---\n`;
    view.dispatch({ changes: { from: 0, to: 0, insert: newFm } });
    log.info('MetaBind: created frontmatter', { property, value });
    return;
  }
  const endIdx = docText.indexOf('\n---', 3);
  if (endIdx < 0) return;
  const fmStart = 4; // after '---\n'
  const fmEnd = endIdx;
  const fmBlock = docText.slice(fmStart, fmEnd);
  const lines = fmBlock.split('\n');
  const yamlVal = formatYamlValue(value);
  let found = false;
  const updated = lines.map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      if (key === property) {
        found = true;
        return `${key}: ${yamlVal}`;
      }
    }
    return line;
  });
  if (!found) {
    updated.push(`${property}: ${yamlVal}`);
  }
  const newFmBlock = updated.join('\n');
  view.dispatch({ changes: { from: fmStart, to: fmEnd, insert: newFmBlock } });
  log.debug('MetaBind: updated frontmatter', { property, value });
}

function formatYamlValue(value: unknown): string {
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.map(v => String(v)).join(', ')}]`;
  if (value === null || value === undefined) return 'null';
  return String(value);
}

// ─── Button action handler ───────────────────────────────────────────────────

function handleButtonAction(view: EditorView, action: string, args: string) {
  switch (action) {
    case 'update': {
      // args format: "property=value"
      const eqIdx = args.indexOf('=');
      if (eqIdx > 0) {
        const prop = args.slice(0, eqIdx).trim();
        const val = args.slice(eqIdx + 1).trim();
        updateFrontmatterInDoc(view, prop, val);
      }
      break;
    }
    case 'command':
      log.info('MetaBind: command action', { command: args });
      window.dispatchEvent(new CustomEvent('bismuth-command', { detail: { command: args } }));
      break;
    case 'open':
      log.info('MetaBind: open action', { path: args });
      window.dispatchEvent(new CustomEvent('bismuth-open-note', { detail: { path: args } }));
      break;
    case 'navigate':
      log.info('MetaBind: navigate action', { target: args });
      window.dispatchEvent(new CustomEvent('bismuth-navigate', { detail: { target: args } }));
      break;
    case 'template':
      log.info('MetaBind: template action', { template: args });
      window.dispatchEvent(new CustomEvent('bismuth-apply-template', { detail: { template: args } }));
      break;
    default:
      log.warn('MetaBind: unknown button action', { action, args });
  }
}

// ─── ViewPlugin ──────────────────────────────────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const docText = view.state.doc.toString();
  const fm = extractFrontmatter(docText);
  const blocks = findMetaBindBlocks(view);
  const activeLines = getActiveLines(view);

  for (const block of blocks) {
    const { declaration: decl, from, to } = block;
    const lineNum = view.state.doc.lineAt(from).number;

    // Cursor on this line — show raw syntax instead of widget
    if (activeLines.has(lineNum)) {
      decos.push(activeCodeMark.range(from, to));
      continue;
    }

    if (decl.kind === 'input') {
      const inputDecl = decl as InputFieldDeclaration;
      const val = resolveProp(fm, inputDecl.property) ?? inputDecl.options.defaultValue ?? null;
      const widget = new MetaBindInputWidget(inputDecl, val, updateFrontmatterInDoc);
      decos.push(Decoration.replace({ widget }).range(from, to));
    } else if (decl.kind === 'view') {
      const viewDecl = decl as ViewFieldDeclaration;
      const val = resolveProp(fm, viewDecl.property);
      const widget = new MetaBindViewWidget(viewDecl, val);
      decos.push(Decoration.replace({ widget }).range(from, to));
    } else if (decl.kind === 'button') {
      const btnDecl = decl as ButtonDeclaration;
      const widget = new MetaBindButtonWidget(btnDecl, handleButtonAction);
      decos.push(Decoration.replace({ widget }).range(from, to));
    }
  }

  return Decoration.set(decos, true);
}

/**
 * Creates the MetaBind CodeMirror extension.
 * Renders interactive INPUT, VIEW, and BUTTON widgets inside notes.
 */
export function metabindExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
