/**
 * PDF Link Service — parse, generate, and resolve PDF links
 * in the Obsidian-style format: [[file.pdf#page=N&selection=a,b,c,d&color=red]]
 *
 * Also provides backlink-to-highlight resolution for the PDF viewer overlay.
 */

import type {
  PDFLink,
  PDFTextSelection,
  PDFBacklinkHighlight,
  HighlightColor,
  PdfPlusConfig,
  PDFRect,
} from '../types';
import { DEFAULT_PDF_PLUS_CONFIG, HIGHLIGHT_COLORS } from '../types';
import { log } from '@/utils/logger';

const CONFIG_KEY = 'bismuth:pdf-plus-config';

// ─── Config persistence ─────────────────────────────────────────────────────

export function loadPdfPlusConfig(): PdfPlusConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_PDF_PLUS_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PDF_PLUS_CONFIG };
}

export function savePdfPlusConfig(cfg: PdfPlusConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    log.warn('pdfLinkService: failed to persist config');
  }
}

// ─── Link parsing ───────────────────────────────────────────────────────────

const PDF_LINK_RE = /\[\[([^\]#]+\.pdf)#([^\]|]+)(?:\|([^\]]+))?\]\]/gi;

/**
 * Parse a PDF link string into structured data.
 * Supports: [[file.pdf#page=1&selection=0,1,2,3&color=yellow|display text]]
 */
export function parsePdfLink(linkText: string): PDFLink | null {
  const match = PDF_LINK_RE.exec(linkText);
  PDF_LINK_RE.lastIndex = 0;
  if (!match) return null;

  const filePath = match[1];
  const params = new URLSearchParams(match[2].replace(/&amp;/g, '&'));
  const displayText = match[3] || undefined;

  const page = parseInt(params.get('page') ?? '1', 10);
  if (isNaN(page) || page < 1) return null;

  let selection: PDFTextSelection | undefined;
  const selStr = params.get('selection');
  if (selStr) {
    const parts = selStr.split(',').map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      selection = {
        startLine: parts[0],
        startChar: parts[1],
        endLine: parts[2],
        endChar: parts[3],
      };
    }
  }

  let rect: PDFRect | undefined;
  const rectStr = params.get('rect');
  if (rectStr) {
    const parts = rectStr.split(',').map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      rect = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const colorRaw = params.get('color')?.toLowerCase();
  const color = colorRaw && colorRaw in HIGHLIGHT_COLORS ? (colorRaw as HighlightColor) : undefined;

  return { filePath, page, selection, color, rect, displayText };
}

/**
 * Find all PDF links in a markdown string.
 */
export function findPdfLinks(content: string): PDFLink[] {
  const links: PDFLink[] = [];
  const re = /\[\[([^\]#]+\.pdf)#([^\]|]+)(?:\|([^\]]+))?\]\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const parsed = parsePdfLink(m[0]);
    if (parsed) links.push(parsed);
  }
  return links;
}

// ─── Link generation ────────────────────────────────────────────────────────

/** Template variables available when generating a PDF link. */
export interface LinkTemplateVars {
  filePath: string;
  fileName: string;
  page: number;
  selection: string;
  color: string;
  text: string;
  displayText: string;
}

/**
 * Render a copy template with the given variables.
 */
export function renderCopyTemplate(template: string, vars: LinkTemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const record = vars as unknown as Record<string, string | number>;
    return record[key]?.toString() ?? '';
  });
}

/**
 * Generate a formatted PDF link for copying to clipboard.
 */
export function generatePdfLink(
  filePath: string,
  page: number,
  selectedText: string,
  selection: PDFTextSelection | null,
  color: HighlightColor,
  config: PdfPlusConfig
): string {
  const fileName =
    filePath
      .split('/')
      .pop()
      ?.replace(/\.pdf$/i, '') ?? filePath;
  const selStr = selection
    ? `${selection.startLine},${selection.startChar},${selection.endLine},${selection.endChar}`
    : '';

  const displayTextVars: LinkTemplateVars = {
    filePath,
    fileName,
    page,
    selection: selStr,
    color,
    text: selectedText,
    displayText: '',
  };
  const displayText = renderCopyTemplate(config.displayTextTemplate, displayTextVars);

  const vars: LinkTemplateVars = {
    filePath,
    fileName,
    page,
    selection: selStr,
    color,
    text: selectedText,
    displayText,
  };

  return renderCopyTemplate(config.copyTemplate, vars);
}

// ─── Backlink highlight resolution ──────────────────────────────────────────

/**
 * Resolve backlinks for a PDF file into highlight overlays.
 * Scans all vault backlinks pointing to this PDF and extracts
 * page/selection/color info from the link parameters.
 */
export async function resolvePdfBacklinks(
  pdfPath: string,
  currentPage?: number,
  filterByPage: boolean = true
): Promise<PDFBacklinkHighlight[]> {
  try {
    const { getCachedBacklinks } = await import('@/features/backlinks');
    const backlinks = getCachedBacklinks(pdfPath);
    const highlights: PDFBacklinkHighlight[] = [];

    for (const bl of backlinks) {
      // Parse the link context to extract PDF link params
      const links = findPdfLinks(bl.context);
      for (const link of links) {
        if (link.filePath !== pdfPath) continue;
        if (filterByPage && currentPage && link.page !== currentPage) continue;

        highlights.push({
          page: link.page,
          text: link.displayText ?? '',
          color: link.color ?? 'yellow',
          sourcePath: bl.sourcePath,
          sourceContext: bl.context,
        });
      }
    }

    log.debug('pdfLinkService: resolved backlink highlights', {
      pdf: pdfPath,
      count: highlights.length,
      page: currentPage,
    });

    return highlights;
  } catch (err) {
    log.warn('pdfLinkService: backlink resolution failed', { error: String(err) });
    return [];
  }
}
