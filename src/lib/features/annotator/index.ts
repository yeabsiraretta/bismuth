/**
 * Annotator feature — public barrel export.
 *
 * Provides PDF/EPUB document annotation with highlights, comments, and tags.
 * Annotations are stored as markdown files with frontmatter linking to the
 * original document, compatible with Obsidian Annotator format.
 */

// Types
export type {
  AnnotationTargetType,
  HighlightColor,
  DocumentAnnotation,
  AnnotationFile,
  AnnotatorViewState,
  AnnotationNoteFrontmatter,
  TextQuoteSelector,
  PDFPageInfo,
  PDFLink,
  PDFTextSelection,
  PDFRect,
  PDFOutlineItem,
  PDFBacklinkHighlight,
  PDFCopyTemplate,
  PdfPlusConfig,
} from './types';
export { HIGHLIGHT_COLORS, DEFAULT_PDF_PLUS_CONFIG } from './types';

// Store
export {
  annotatorView,
  activeAnnotationFile,
  annotations,
  annotationCount,
  openAnnotationNote,
  createAnnotationNote,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  closeAnnotator,
  setPage,
  setZoom,
  toggleDarkMode,
  toggleSidebar,
  setActiveColor,
} from './stores/annotatorStore';

// Services
export {
  serializeAnnotations,
  deserializeAnnotations,
  resolveTargetType,
} from './services/annotationMarkdown';
export { openPdf, renderPage, getPageText, searchText, closePdf } from './services/pdfService';
export {
  parsePdfLink,
  findPdfLinks,
  generatePdfLink,
  renderCopyTemplate,
  resolvePdfBacklinks,
  loadPdfPlusConfig,
  savePdfPlusConfig,
} from './services/pdfLinkService';
export {
  extractOutline,
  flattenOutline,
  findOutlineForPage,
  outlineToLink,
} from './services/pdfOutlineService';

// Components
export { default as AnnotatorPanel } from './components/AnnotatorPanel.svelte';
export { default as PDFViewer } from './components/PDFViewer.svelte';
export { default as AnnotationSidebar } from './components/AnnotationSidebar.svelte';
