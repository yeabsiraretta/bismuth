/**
 * Note Slides (Marp) — markdown-based slide presentations.
 *
 * Parses notes with `marp: true` frontmatter and `---` slide separators
 * into interactive slide presentations with themes, transitions, and export.
 */

// Types
export type {
  MarpSlide, MarpPresentation, MarpDirectives,
  MarpExportFormat, MarpConfig, MarpThemeInfo,
} from './types/marp';
export { DEFAULT_DIRECTIVES, DEFAULT_MARP_CONFIG } from './types/marp';

// Services — Parser
export {
  parseFrontmatter, isMarpNote, extractDirectives,
  splitSlides, extractSlideDirectives, extractSpeakerNotes,
  resolveWikilinks, markdownToHtml, parseMarpPresentation,
} from './services/marpParser';

// Services — Renderer
export {
  renderPresentation, getMarpExportCommand, exportAsHtml,
} from './services/marpRenderer';

// Stores
export type { MarpPreviewState } from './stores/marpStore';
export {
  marpConfig, updateMarpConfig,
  marpPreviewState, activePresentation, activeSlideIndex,
  slideCount, isPreviewOpen, isPresenting, currentSlide,
  openMarpPreview, reloadMarpPreview, closeMarpPreview,
  goToMarpSlide, nextMarpSlide, prevMarpSlide,
  startMarpPresentation, stopMarpPresentation, getExportFormat,
} from './stores/marpStore';

// Components
export { default as MarpPreview } from './components/MarpPreview.svelte';
