/**
 * PDF Outline Service — extracts table of contents / bookmarks
 * from a loaded PDF document and provides outline navigation.
 */

import type { PDFOutlineItem } from '../types';
import { log } from '@/utils/logger';

interface PdfJsOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  url: string | null;
  items: PdfJsOutlineItem[];
}

interface PDFDocProxy {
  getOutline: () => Promise<PdfJsOutlineItem[] | null>;
  getPageIndex: (ref: unknown) => Promise<number>;
}

/**
 * Extract the outline (bookmarks/TOC) from a loaded PDF document.
 * Returns a hierarchical tree of outline items with page numbers.
 */
export async function extractOutline(doc: unknown): Promise<PDFOutlineItem[]> {
  try {
    const pdfDoc = doc as PDFDocProxy;
    const outline = await pdfDoc.getOutline();
    if (!outline || outline.length === 0) return [];

    return await buildOutlineTree(pdfDoc, outline, 0);
  } catch (err) {
    log.warn('pdfOutlineService: failed to extract outline', { error: String(err) });
    return [];
  }
}

async function buildOutlineTree(
  doc: PDFDocProxy,
  items: PdfJsOutlineItem[],
  level: number,
): Promise<PDFOutlineItem[]> {
  const result: PDFOutlineItem[] = [];

  for (const item of items) {
    let page = 1;

    // Resolve destination to page number
    if (item.dest) {
      try {
        const dest = Array.isArray(item.dest) ? item.dest : null;
        if (dest && dest.length > 0) {
          const pageIdx = await doc.getPageIndex(dest[0]);
          page = pageIdx + 1;
        }
      } catch {
        // Dest resolution can fail for external links
      }
    }

    const children = item.items?.length
      ? await buildOutlineTree(doc, item.items, level + 1)
      : [];

    result.push({
      title: item.title || 'Untitled',
      page,
      children,
      level,
    });
  }

  return result;
}

/**
 * Flatten an outline tree into a linear list for search/display.
 */
export function flattenOutline(items: PDFOutlineItem[]): PDFOutlineItem[] {
  const flat: PDFOutlineItem[] = [];
  for (const item of items) {
    flat.push(item);
    if (item.children.length > 0) {
      flat.push(...flattenOutline(item.children));
    }
  }
  return flat;
}

/**
 * Find the outline item for a given page number.
 * Returns the deepest matching item (most specific section).
 */
export function findOutlineForPage(
  items: PDFOutlineItem[],
  page: number,
): PDFOutlineItem | null {
  let best: PDFOutlineItem | null = null;

  for (const item of flattenOutline(items)) {
    if (item.page <= page) {
      if (!best || item.page >= best.page) {
        best = item;
      }
    }
  }

  return best;
}

/**
 * Generate a section link from an outline item.
 */
export function outlineToLink(filePath: string, item: PDFOutlineItem): string {
  const fileName = filePath.split('/').pop()?.replace(/\.pdf$/i, '') ?? filePath;
  return `[[${filePath}#page=${item.page}|${fileName}, ${item.title}]]`;
}
