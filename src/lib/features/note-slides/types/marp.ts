/**
 * Note Slides (Marp) types — markdown-based slide presentations.
 * Parses notes with `marp: true` frontmatter and `---` separators.
 */

// ─── Slide ───────────────────────────────────────────────────────────────────

export interface MarpSlide {
  /** 0-based slide index */
  index: number;
  /** Raw markdown content for this slide */
  content: string;
  /** Rendered HTML (after markdown processing) */
  html: string;
  /** Per-slide directives (class, backgroundColor, etc.) */
  directives: Record<string, string>;
  /** Speaker notes (content after <!-- for this slide -->) */
  speakerNotes: string;
  /** Transition for this slide */
  transition?: string;
}

// ─── Presentation ────────────────────────────────────────────────────────────

export interface MarpPresentation {
  /** Source note path */
  notePath: string;
  /** Global frontmatter directives */
  globalDirectives: MarpDirectives;
  /** Ordered slides */
  slides: MarpSlide[];
  /** Custom theme CSS if specified */
  themeCss: string;
  /** Raw frontmatter */
  frontmatter: Record<string, unknown>;
}

export interface MarpDirectives {
  marp: boolean;
  theme: string;
  paginate: boolean;
  header: string;
  footer: string;
  class: string;
  backgroundColor: string;
  backgroundImage: string;
  color: string;
  size: string;
  transition: string;
  math: string;
  style: string;
}

export const DEFAULT_DIRECTIVES: MarpDirectives = {
  marp: true,
  theme: 'default',
  paginate: false,
  header: '',
  footer: '',
  class: '',
  backgroundColor: '',
  backgroundImage: '',
  color: '',
  size: '16:9',
  transition: '',
  math: '',
  style: '',
};

// ─── Export ──────────────────────────────────────────────────────────────────

export type MarpExportFormat = 'html' | 'pdf' | 'pptx';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface MarpConfig {
  /** Auto-reload preview on save */
  autoReload: boolean;
  /** Open preview in split tab */
  splitPreview: boolean;
  /** Relative path to theme CSS directory */
  themeFolderPath: string;
  /** Default export format */
  defaultExportFormat: MarpExportFormat;
  /** Show slide numbers in preview */
  showSlideNumbers: boolean;
  /** Preview scale (0.5–1.5) */
  previewScale: number;
}

export const DEFAULT_MARP_CONFIG: MarpConfig = {
  autoReload: true,
  splitPreview: true,
  themeFolderPath: 'MarpTheme',
  defaultExportFormat: 'html',
  showSlideNumbers: true,
  previewScale: 1,
};

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface MarpThemeInfo {
  name: string;
  /** Filename without extension */
  id: string;
  /** Full vault-relative path to CSS file */
  path: string;
}
