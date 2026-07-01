/**
 * Storyteller Suite — Compile workflow types.
 */

export type CompileOutputFormat =
  | 'markdown' | 'html' | 'plain-text' | 'pdf-ready';

export interface CompileStep {
  id: string;
  type: CompileStepType;
  label: string;
  enabled: boolean;
  config: Record<string, unknown>;
  sortOrder: number;
}

export type CompileStepType =
  | 'strip-frontmatter' | 'strip-comments'
  | 'add-scene-titles' | 'add-chapter-breaks'
  | 'scene-separator' | 'page-break'
  | 'filter-by-status' | 'filter-by-tag'
  | 'word-count' | 'table-of-contents'
  | 'custom-js';

export interface CompileWorkflow {
  id: string;
  name: string;
  description: string;
  steps: CompileStep[];
  outputFormat: CompileOutputFormat;
  isBuiltIn: boolean;
}

export interface CompileResult {
  content: string;
  wordCount: number;
  sceneCount: number;
  chapterCount: number;
  warnings: string[];
}

// ─── Preset workflows ───────────────────────────────────────────────────────

export const BUILTIN_WORKFLOWS: CompileWorkflow[] = [
  {
    id: 'reader-draft', name: 'Reader Draft', description: 'Clean manuscript for beta readers',
    outputFormat: 'markdown', isBuiltIn: true,
    steps: [
      { id: 'sf', type: 'strip-frontmatter', label: 'Strip Frontmatter', enabled: true, config: {}, sortOrder: 0 },
      { id: 'sc', type: 'strip-comments', label: 'Strip Comments', enabled: true, config: {}, sortOrder: 1 },
      { id: 'at', type: 'add-scene-titles', label: 'Scene Titles', enabled: false, config: {}, sortOrder: 2 },
      { id: 'cb', type: 'add-chapter-breaks', label: 'Chapter Breaks', enabled: true, config: {}, sortOrder: 3 },
      { id: 'ss', type: 'scene-separator', label: 'Scene Separator', enabled: true, config: { separator: '* * *' }, sortOrder: 4 },
    ],
  },
  {
    id: 'editor-draft', name: 'Editor Draft', description: 'Draft with scene titles and word counts',
    outputFormat: 'markdown', isBuiltIn: true,
    steps: [
      { id: 'sf', type: 'strip-frontmatter', label: 'Strip Frontmatter', enabled: true, config: {}, sortOrder: 0 },
      { id: 'at', type: 'add-scene-titles', label: 'Scene Titles', enabled: true, config: {}, sortOrder: 1 },
      { id: 'wc', type: 'word-count', label: 'Word Count', enabled: true, config: {}, sortOrder: 2 },
      { id: 'cb', type: 'add-chapter-breaks', label: 'Chapter Breaks', enabled: true, config: {}, sortOrder: 3 },
      { id: 'toc', type: 'table-of-contents', label: 'Table of Contents', enabled: true, config: {}, sortOrder: 4 },
    ],
  },
  {
    id: 'synopsis', name: 'Synopsis', description: 'Scene synopses only',
    outputFormat: 'plain-text', isBuiltIn: true,
    steps: [
      { id: 'fs', type: 'filter-by-status', label: 'Filter Scenes', enabled: true, config: { statuses: ['outline', 'draft', 'revision', 'final'] }, sortOrder: 0 },
    ],
  },
  {
    id: 'html-export', name: 'HTML Export', description: 'Full HTML document for web publishing',
    outputFormat: 'html', isBuiltIn: true,
    steps: [
      { id: 'sf', type: 'strip-frontmatter', label: 'Strip Frontmatter', enabled: true, config: {}, sortOrder: 0 },
      { id: 'sc', type: 'strip-comments', label: 'Strip Comments', enabled: true, config: {}, sortOrder: 1 },
      { id: 'cb', type: 'add-chapter-breaks', label: 'Chapter Breaks', enabled: true, config: {}, sortOrder: 2 },
      { id: 'toc', type: 'table-of-contents', label: 'Table of Contents', enabled: true, config: {}, sortOrder: 3 },
    ],
  },
  {
    id: 'printer-friendly', name: 'Printer Friendly', description: 'Print-ready manuscript format',
    outputFormat: 'pdf-ready', isBuiltIn: true,
    steps: [
      { id: 'sf', type: 'strip-frontmatter', label: 'Strip Frontmatter', enabled: true, config: {}, sortOrder: 0 },
      { id: 'pb', type: 'page-break', label: 'Page Breaks', enabled: true, config: { afterChapter: true }, sortOrder: 1 },
      { id: 'at', type: 'add-scene-titles', label: 'Scene Titles', enabled: false, config: {}, sortOrder: 2 },
      { id: 'cb', type: 'add-chapter-breaks', label: 'Chapter Breaks', enabled: true, config: {}, sortOrder: 3 },
    ],
  },
];
