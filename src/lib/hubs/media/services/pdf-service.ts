/**
 * PDF Service — annotation CRUD, link generation, copy templates, outline helpers.
 *
 * Pure functions, no side effects. Inspired by obsidian-pdf-plus.
 */

import { expandTokens } from '@/hubs/editor/services/token-engine';
import type {
  AnnotationTargetMeta,
  AnnotationTargetType,
  PdfAnnotation,
  PdfCopyContext,
  PdfHighlightColor,
  PdfLinkParams,
  PdfOutlineItem,
  PdfTextSelection,
} from '@/hubs/media/types/pdf-types';
import { DEFAULT_PDF_HIGHLIGHT_COLORS } from '@/hubs/media/types/pdf-types';

// ── Link generation ──────────────────────────────────────────────────────────

export function buildPdfLink(params: PdfLinkParams): string {
  const { filePath, page, selection, colorName, rect } = params;
  let fragment = `page=${page}`;

  if (selection) {
    fragment += `&selection=${selection.startIndex},${selection.startOffset},${selection.endIndex},${selection.endOffset}`;
  }

  if (colorName) {
    fragment += `&color=${colorName.toLowerCase()}`;
  }

  if (rect) {
    fragment += `&rect=${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
  }

  return `[[${filePath}#${fragment}]]`;
}

export function buildPdfLinkWithDisplay(params: PdfLinkParams, displayText: string): string {
  const link = buildPdfLink(params);
  return link.replace(']]', `|${displayText}]]`);
}

export function buildDefaultDisplayText(fileName: string, page: number): string {
  const name = fileName.replace(/\.pdf$/i, '');
  return `${name}, page ${page}`;
}

// ── Link parsing ─────────────────────────────────────────────────────────────

export interface ParsedPdfLink {
  filePath: string;
  page: number;
  selection: PdfTextSelection | null;
  colorName: string | null;
  rect: { x: number; y: number; width: number; height: number } | null;
}

export function parsePdfLink(link: string): ParsedPdfLink | null {
  const match = link.match(/^\[\[(.+?)#(.+?)(?:\|.*?)?\]\]$/);
  if (!match) return null;

  const filePath = match[1];
  const fragment = match[2];
  const params = new URLSearchParams(fragment.replace(/&/g, '&'));

  const pageStr = params.get('page');
  if (!pageStr) return null;
  const page = parseInt(pageStr, 10);
  if (isNaN(page)) return null;

  let selection: PdfTextSelection | null = null;
  const selStr = params.get('selection');
  if (selStr) {
    const parts = selStr.split(',').map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      selection = {
        page,
        startIndex: parts[0],
        startOffset: parts[1],
        endIndex: parts[2],
        endOffset: parts[3],
        text: '',
      };
    }
  }

  const colorName = params.get('color') ?? null;

  let rect: ParsedPdfLink['rect'] = null;
  const rectStr = params.get('rect');
  if (rectStr) {
    const rp = rectStr.split(',').map(Number);
    if (rp.length === 4 && rp.every((n) => !isNaN(n))) {
      rect = { x: rp[0], y: rp[1], width: rp[2], height: rp[3] };
    }
  }

  return { filePath, page, selection, colorName, rect };
}

// ── Copy format templates ────────────────────────────────────────────────────

const DEFAULT_COPY_TEMPLATE = '{{linkWithDisplay}}';

const CALLOUT_COPY_TEMPLATE = '> [!PDF|{{colorName}}] {{linkWithDisplay}}\n> {{text}}';

export const PRESET_TEMPLATES: { name: string; template: string }[] = [
  { name: 'Link only', template: '{{link}}' },
  { name: 'Link with display', template: '{{linkWithDisplay}}' },
  { name: 'Quote', template: '> {{text}}\n> — {{linkWithDisplay}}' },
  { name: 'Callout', template: CALLOUT_COPY_TEMPLATE },
  { name: 'Embed', template: '!{{link}}' },
];

export function renderCopyTemplate(template: string, ctx: PdfCopyContext): string {
  return expandTokens(template, (key) => {
    if (key in ctx) return String(ctx[key as keyof PdfCopyContext]);
    return null;
  });
}

export function buildCopyContext(params: PdfLinkParams, text: string): PdfCopyContext {
  const fileName = params.filePath.split('/').pop() ?? params.filePath;
  const fileTitle = fileName.replace(/\.pdf$/i, '');
  const displayText = buildDefaultDisplayText(fileName, params.page);
  const link = buildPdfLink(params);
  const linkWithDisplay = buildPdfLinkWithDisplay(params, displayText);
  const colorName = params.colorName ?? '';
  const color = params.annotation?.color ?? '';
  const pageLabel = String(params.page);
  const callout = colorName
    ? `> [!PDF|${colorName}] ${linkWithDisplay}\n> ${text}`
    : `> [!PDF] ${linkWithDisplay}\n> ${text}`;

  return {
    link,
    linkWithDisplay,
    text,
    page: params.page,
    pageLabel,
    fileName,
    fileTitle,
    colorName,
    color,
    callout,
  };
}

// ── Annotation helpers ───────────────────────────────────────────────────────

function generateBlockId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

export function createAnnotation(
  type: PdfAnnotation['type'],
  page: number,
  text: string,
  color: string,
  colorName: string,
  rects: PdfAnnotation['rects'] = [],
  comment = '',
  opts: { prefix?: string; postfix?: string; tags?: string[] } = {}
): PdfAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    type,
    page,
    color,
    colorName,
    text,
    prefix: opts.prefix ?? '',
    postfix: opts.postfix ?? '',
    rects,
    comment,
    tags: opts.tags ?? [],
    blockId: generateBlockId(),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAnnotationComment(annotation: PdfAnnotation, comment: string): PdfAnnotation {
  return { ...annotation, comment, updatedAt: Date.now() };
}

export function updateAnnotationColor(
  annotation: PdfAnnotation,
  color: string,
  colorName: string
): PdfAnnotation {
  return { ...annotation, color, colorName, updatedAt: Date.now() };
}

function updateAnnotationTags(annotation: PdfAnnotation, tags: string[]): PdfAnnotation {
  return { ...annotation, tags, updatedAt: Date.now() };
}

// ── Color helpers ────────────────────────────────────────────────────────────

export function findPdfColor(
  name: string,
  colors: PdfHighlightColor[] = DEFAULT_PDF_HIGHLIGHT_COLORS
): PdfHighlightColor | undefined {
  const lower = name.toLowerCase();
  return colors.find((c) => c.name.toLowerCase() === lower);
}

export function colorToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function generatePdfColorCSS(colors: PdfHighlightColor[]): string {
  return colors
    .map((c) => {
      const varName = `--pdf-plus-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-rgb`;
      return `${varName}: ${colorToRgb(c.color)};`;
    })
    .join('\n');
}

// ── Outline helpers ──────────────────────────────────────────────────────────

export function flattenOutline(items: PdfOutlineItem[]): PdfOutlineItem[] {
  const result: PdfOutlineItem[] = [];
  function walk(list: PdfOutlineItem[]) {
    for (const item of list) {
      result.push(item);
      if (item.children.length > 0) walk(item.children);
    }
  }
  walk(items);
  return result;
}

export function findOutlineItemByPage(
  items: PdfOutlineItem[],
  page: number
): PdfOutlineItem | null {
  const flat = flattenOutline(items);
  let best: PdfOutlineItem | null = null;
  for (const item of flat) {
    if (item.page <= page) {
      if (!best || item.page > best.page) best = item;
    }
  }
  return best;
}

export function buildOutlineLink(filePath: string, item: PdfOutlineItem): string {
  return `[[${filePath}#page=${item.page}|${item.title}]]`;
}

// ── Page label helpers ───────────────────────────────────────────────────────

export function formatPageLabel(page: number, labels?: Map<number, string>): string {
  return labels?.get(page) ?? String(page);
}

export function parsePageLabels(raw: { pageIndex: number; label: string }[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const entry of raw) {
    map.set(entry.pageIndex + 1, entry.label);
  }
  return map;
}

// ── Annotation-target resolution ────────────────────────────────────────────

const FM_RE = /^---\s*\n([\s\S]*?)\n---/;

function inferTargetType(path: string): AnnotationTargetType {
  const lower = path.toLowerCase();
  if (lower.endsWith('.epub')) return 'epub';
  if (lower.startsWith('http://') || lower.startsWith('https://')) return 'web';
  return 'pdf';
}

function parseAnnotationTarget(
  content: string,
  notePath: string
): AnnotationTargetMeta | null {
  const fmMatch = content.match(FM_RE);
  if (!fmMatch) return null;
  const block = fmMatch[1];

  let targetPath: string | null = null;
  let targetType: AnnotationTargetType | null = null;

  for (const line of block.split('\n')) {
    const kv = line.match(/^\s*([\w-]+)\s*:\s*(.+?)\s*$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].replace(/^["']|["']$/g, '').replace(/^\[\[|\]\]$/g, '');
    if (key === 'annotation-target') targetPath = val;
    if (key === 'annotation-target-type') targetType = val as AnnotationTargetType;
  }

  if (!targetPath) return null;
  return {
    targetPath,
    targetType: targetType ?? inferTargetType(targetPath),
    notePath,
  };
}

// ── Annotation block link ───────────────────────────────────────────────────

function buildAnnotationBlockLink(notePath: string, blockId: string): string {
  const name = notePath.replace(/\.md$/i, '');
  return `[[${name}#^${blockId}]]`;
}

function buildAnnotationBlockLinkWithDisplay(
  notePath: string,
  blockId: string,
  displayText: string
): string {
  const name = notePath.replace(/\.md$/i, '');
  return `[[${name}#^${blockId}|${displayText}]]`;
}

function buildAnnotationDragText(notePath: string, annotation: PdfAnnotation): string {
  const display =
    annotation.text.length > 60 ? annotation.text.slice(0, 57) + '...' : annotation.text;
  return buildAnnotationBlockLinkWithDisplay(notePath, annotation.blockId, display);
}
