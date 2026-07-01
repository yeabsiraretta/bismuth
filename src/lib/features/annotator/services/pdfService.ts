/**
 * PDF viewer service — wraps pdfjs-dist for rendering PDF pages.
 *
 * Provides lazy-loaded PDF.js integration for rendering individual pages
 * to canvas elements and extracting text content for annotation matching.
 *
 * NOTE: pdfjs-dist must be installed as a dependency.
 * Run: pnpm add pdfjs-dist
 */

import type { PDFPageInfo } from '../types';
import { log } from '@/utils/logger';

// Lazy-loaded pdfjs-dist types
type PDFDocumentProxy = {
  numPages: number;
  getPage: (num: number) => Promise<PDFPageProxy>;
  destroy: () => void;
};

type PDFPageProxy = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
  getTextContent: () => Promise<PDFTextContent>;
};

type PDFTextContent = {
  items: Array<{ str: string; transform: number[] }>;
};

let pdfjs: { getDocument: (params: unknown) => { promise: Promise<PDFDocumentProxy> } } | null = null;

/**
 * Loads the pdfjs-dist library. Called lazily on first use.
 */
async function loadPdfJs(): Promise<typeof pdfjs> {
  if (pdfjs) return pdfjs;
  try {
    const mod = await import(/* @vite-ignore */ 'pdfjs-dist');
    // Set worker source for pdfjs
    const workerSrc = new URL(/* @vite-ignore */ 'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    mod.GlobalWorkerOptions.workerSrc = workerSrc;
    pdfjs = mod;
    log.info('PDF service: pdfjs-dist loaded');
    return pdfjs;
  } catch (e) {
    log.error('PDF service: failed to load pdfjs-dist', e as Error);
    throw new Error('pdfjs-dist is not installed. Run: pnpm add pdfjs-dist');
  }
}

/** Loaded PDF document handle. */
let currentDoc: PDFDocumentProxy | null = null;
let currentDocPath: string | null = null;

/**
 * Opens a PDF file and returns page count info.
 * Accepts either a vault-relative path (read via IPC) or a URL.
 */
export async function openPdf(source: string): Promise<{ numPages: number }> {
  const lib = await loadPdfJs();
  if (!lib) throw new Error('pdfjs not available');

  if (currentDoc) {
    currentDoc.destroy();
    currentDoc = null;
  }

  let data: ArrayBuffer | string;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    data = source;
  } else {
    // Read binary from vault via IPC
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = await invoke<number[]>('read_file_binary', { path: source });
    data = new Uint8Array(bytes).buffer;
  }

  const loadingTask = lib.getDocument(typeof data === 'string' ? { url: data } : { data });
  currentDoc = await loadingTask.promise;
  currentDocPath = source;

  log.info('PDF service: opened document', { source, pages: currentDoc.numPages });
  return { numPages: currentDoc.numPages };
}

/**
 * Renders a single PDF page to a canvas element.
 */
export async function renderPage(
  canvas: HTMLCanvasElement,
  pageNumber: number,
  scale: number = 1.5,
): Promise<PDFPageInfo> {
  if (!currentDoc) throw new Error('No PDF document loaded');
  if (pageNumber < 1 || pageNumber > currentDoc.numPages) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }

  const page = await currentDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas 2d context');

  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    scale,
  };
}

/**
 * Extracts text content from a page for annotation text matching.
 */
export async function getPageText(pageNumber: number): Promise<string> {
  if (!currentDoc) throw new Error('No PDF document loaded');

  const page = await currentDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => item.str).join(' ');
}

/**
 * Searches all pages for a text string and returns matching page numbers.
 */
export async function searchText(query: string): Promise<number[]> {
  if (!currentDoc) return [];
  const matches: number[] = [];
  const lower = query.toLowerCase();

  for (let i = 1; i <= currentDoc.numPages; i++) {
    const text = await getPageText(i);
    if (text.toLowerCase().includes(lower)) {
      matches.push(i);
    }
  }
  return matches;
}

/**
 * Closes the current PDF document and frees resources.
 */
export function closePdf(): void {
  if (currentDoc) {
    currentDoc.destroy();
    currentDoc = null;
    currentDocPath = null;
    log.debug('PDF service: document closed');
  }
}

/**
 * Returns the currently loaded document path.
 */
export function getCurrentDocPath(): string | null {
  return currentDocPath;
}
