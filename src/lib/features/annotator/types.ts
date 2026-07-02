/**
 * Annotator types — PDF/EPUB document annotation data model.
 *
 * Annotations are stored as markdown files with frontmatter linking to
 * the original document. Each annotation captures a text selection,
 * highlight color, comment, and tags.
 */

/** Supported document types for annotation. */
export type AnnotationTargetType = 'pdf' | 'epub';

/** Highlight color presets. */
export type HighlightColor = 'yellow' | 'red' | 'green' | 'blue' | 'purple' | 'orange';

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fef08a',
  red: '#fecaca',
  green: '#bbf7d0',
  blue: '#bfdbfe',
  purple: '#ddd6fe',
  orange: '#fed7aa',
};

/** A text selection anchor in a document (for hypothesis-style text positioning). */
export interface TextSelector {
  /** XPath or CSS selector to the start container. */
  start: string;
  /** Character offset within the start container. */
  startOffset: number;
  /** XPath or CSS selector to the end container. */
  end: string;
  /** Character offset within the end container. */
  endOffset: number;
}

/** A text-position selector (character offsets from document start). */
export interface TextPositionSelector {
  start: number;
  end: number;
}

/** A text quote selector with surrounding context. */
export interface TextQuoteSelector {
  /** The exact highlighted text. */
  exact: string;
  /** Text immediately before the highlight (for disambiguation). */
  prefix: string;
  /** Text immediately after the highlight (for disambiguation). */
  suffix: string;
}

/** A single annotation on a document. */
export interface DocumentAnnotation {
  /** Unique annotation ID. */
  id: string;
  /** The annotation target document path (relative to vault or URL). */
  target: string;
  /** Target document type. */
  targetType: AnnotationTargetType;
  /** Page number (1-indexed, PDF only). */
  page?: number;
  /** Chapter or section reference (EPUB only). */
  chapter?: string;
  /** Text selection info for relocating the highlight. */
  textSelector?: TextSelector;
  /** Character-based position selector. */
  positionSelector?: TextPositionSelector;
  /** Quote with context for fuzzy matching. */
  quoteSelector: TextQuoteSelector;
  /** Highlight color. */
  color: HighlightColor;
  /** User comment on this annotation. */
  comment: string;
  /** Tags associated with this annotation. */
  tags: string[];
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-modified timestamp. */
  updatedAt: string;
}

/** The frontmatter shape for an annotation markdown file. */
export interface AnnotationNoteFrontmatter {
  /** Path or URL to the annotated document. */
  'annotation-target': string;
  /** Document type override (auto-detected if omitted). */
  'annotation-target-type'?: AnnotationTargetType;
}

/** Annotation file — a markdown note linked to a document. */
export interface AnnotationFile {
  /** Path to the annotation markdown file. */
  notePath: string;
  /** Path or URL of the target document. */
  target: string;
  /** Resolved target type. */
  targetType: AnnotationTargetType;
  /** All annotations in this file. */
  annotations: DocumentAnnotation[];
}

/** Viewer state for the PDF/EPUB reader. */
export interface AnnotatorViewState {
  /** Whether the annotator panel is open. */
  isOpen: boolean;
  /** Path to the current annotation note. */
  activeNotePath: string | null;
  /** Current page number (PDF). */
  currentPage: number;
  /** Total pages (PDF). */
  totalPages: number;
  /** Zoom level (1.0 = 100%). */
  zoom: number;
  /** Dark mode for the reader. */
  darkMode: boolean;
  /** Whether the annotation sidebar is visible. */
  sidebarVisible: boolean;
  /** Active highlight color for new annotations. */
  activeColor: HighlightColor;
  /** Scroll mode for EPUB: 'paginated' or 'scrolling'. */
  epubMode: 'paginated' | 'scrolling';
}

/** PDF page rendering info. */
export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

// ─── PDF++ Link types ────────────────────────────────────────────────────────

/** A parsed PDF link with page, selection, and color parameters. */
export interface PDFLink {
  filePath: string;
  page: number;
  selection?: PDFTextSelection;
  color?: HighlightColor;
  rect?: PDFRect;
  displayText?: string;
}

/** Text selection coordinates in a PDF page. */
export interface PDFTextSelection {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

/** Rectangle selection in a PDF page (for area embeds). */
export interface PDFRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A PDF outline (bookmark/TOC) entry. */
export interface PDFOutlineItem {
  title: string;
  page: number;
  children: PDFOutlineItem[];
  level: number;
}

/** A backlink highlight overlay in the PDF viewer. */
export interface PDFBacklinkHighlight {
  page: number;
  text: string;
  color: HighlightColor;
  sourcePath: string;
  sourceContext: string;
}

/** Customizable copy format template for PDF links. */
export interface PDFCopyTemplate {
  id: string;
  name: string;
  template: string;
}

/** PDF++ feature configuration. */
export interface PdfPlusConfig {
  highlightBacklinks: boolean;
  defaultColor: HighlightColor;
  copyTemplate: string;
  displayTextTemplate: string;
  filterBacklinksByPage: boolean;
  clearHighlightDelay: number;
  openInExistingTab: boolean;
  customTemplates: PDFCopyTemplate[];
}

export const DEFAULT_PDF_PLUS_CONFIG: PdfPlusConfig = {
  highlightBacklinks: true,
  defaultColor: 'yellow',
  copyTemplate:
    '[[{{filePath}}#page={{page}}&selection={{selection}}&color={{color}}|{{displayText}}]]',
  displayTextTemplate: '{{fileName}}, page {{page}}',
  filterBacklinksByPage: true,
  clearHighlightDelay: 0,
  openInExistingTab: true,
  customTemplates: [],
};
