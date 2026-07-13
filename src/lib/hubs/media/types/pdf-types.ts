/**
 * PDF types — annotation, highlight, outline, selection, viewer state.
 *
 * Inspired by RyotaUshio/obsidian-pdf-plus.
 */

// ── Highlight colors ─────────────────────────────────────────────────────────

export interface PdfHighlightColor {
  name: string;
  color: string;
}

export const DEFAULT_PDF_HIGHLIGHT_COLORS: PdfHighlightColor[] = [
  { name: 'Yellow', color: '#ffd400' },
  { name: 'Red', color: '#ff6b6b' },
  { name: 'Green', color: '#51cf66' },
  { name: 'Blue', color: '#339af0' },
  { name: 'Purple', color: '#cc5de8' },
  { name: 'Orange', color: '#ff922b' },
  { name: 'Pink', color: '#f06595' },
  { name: 'Cyan', color: '#22b8cf' },
];

// ── Text selection ───────────────────────────────────────────────────────────

export interface PdfTextSelection {
  page: number;
  startIndex: number;
  startOffset: number;
  endIndex: number;
  endOffset: number;
  text: string;
}

interface PdfRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Annotations ──────────────────────────────────────────────────────────────

type PdfAnnotationType = 'highlight' | 'underline' | 'strikeout' | 'note' | 'rect';

export interface PdfAnnotation {
  id: string;
  type: PdfAnnotationType;
  page: number;
  color: string;
  colorName: string;
  text: string;
  prefix: string;
  postfix: string;
  rects: PdfRect[];
  comment: string;
  tags: string[];
  blockId: string;
  createdAt: number;
  updatedAt: number;
}

// ── Annotation target (frontmatter linking) ─────────────────────────────────

export type AnnotationTargetType = 'pdf' | 'epub' | 'web';

export interface AnnotationTargetMeta {
  targetPath: string;
  targetType: AnnotationTargetType;
  notePath: string;
}

// ── Outline (table of contents) ──────────────────────────────────────────────

export interface PdfOutlineItem {
  title: string;
  page: number;
  dest: string | null;
  children: PdfOutlineItem[];
  level: number;
}

// ── Link formats ─────────────────────────────────────────────────────────────

export interface PdfLinkParams {
  filePath: string;
  page: number;
  selection?: PdfTextSelection;
  annotation?: PdfAnnotation;
  colorName?: string;
  rect?: PdfRect;
}

// ── Viewer state ─────────────────────────────────────────────────────────────

type PdfSpreadMode = 'none' | 'odd' | 'even';
type PdfSidebarView = 'none' | 'outline' | 'thumbnails';

export interface PdfViewerState {
  filePath: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  spreadMode: PdfSpreadMode;
  sidebarView: PdfSidebarView;
  scrollTop: number;
}

// ── Copy format template vars ────────────────────────────────────────────────

export interface PdfCopyContext {
  link: string;
  linkWithDisplay: string;
  text: string;
  page: number;
  pageLabel: string;
  fileName: string;
  fileTitle: string;
  colorName: string;
  color: string;
  callout: string;
}
