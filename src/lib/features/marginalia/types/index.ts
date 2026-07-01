/**
 * Cornell Marginalia types — margin notes, prefixes, settings, explorer state.
 */

// ─── Margin note prefix categories ──────────────────────────────────────────

export interface PrefixConfig {
  symbol: string;
  label: string;
  color: string;
  bgColor: string;
}

export const DEFAULT_PREFIXES: PrefixConfig[] = [
  { symbol: '?', label: 'Question', color: '#f97316', bgColor: '#f9731615' },
  { symbol: '!', label: 'Important', color: '#eab308', bgColor: '#eab30815' },
  { symbol: 'X-', label: 'Correction', color: '#ef4444', bgColor: '#ef444415' },
  { symbol: 'V-', label: 'Verified', color: '#22c55e', bgColor: '#22c55e15' },
];

// ─── Margin alignment ────────────────────────────────────────────────────────

export type MarginAlignment = 'left' | 'right';
export type MarginDirection = 'right' | 'left';

// ─── Parsed margin note ─────────────────────────────────────────────────────

export interface MarginNote {
  id: string;
  text: string;
  rawSyntax: string;
  direction: MarginDirection;
  prefix: PrefixConfig | null;
  line: number;
  column: number;
  filePath: string;
  isBlur: boolean;
  isImage: boolean;
  imagePath: string | null;
}

// ─── Explorer state ──────────────────────────────────────────────────────────

export type ExplorerTab = 'current' | 'vault';
export type ExplorerGrouping = 'color' | 'file' | 'none';

export interface ExplorerState {
  tab: ExplorerTab;
  grouping: ExplorerGrouping;
  searchQuery: string;
  collapsed: Set<string>;
}

// ─── Flashcard ───────────────────────────────────────────────────────────────

export interface FlashcardEntry {
  question: string;
  answer: string;
  sourceLine: number;
  filePath: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface MarginaliaSettings {
  alignment: MarginAlignment;
  marginWidth: number;
  fontSize: number;
  fontFamily: string;
  showInReadingView: boolean;
  activeRecallEnabled: boolean;
  prefixes: PrefixConfig[];
  defaultDirection: MarginDirection;
  lastCaptureDestination: string;
}

export const DEFAULT_MARGINALIA_SETTINGS: MarginaliaSettings = {
  alignment: 'left',
  marginWidth: 30,
  fontSize: 12,
  fontFamily: 'inherit',
  showInReadingView: true,
  activeRecallEnabled: false,
  prefixes: [...DEFAULT_PREFIXES],
  defaultDirection: 'right',
  lastCaptureDestination: '',
};

// ─── Regex patterns ──────────────────────────────────────────────────────────

/** Matches %%> content %% (right margin note) */
export const MARGIN_RIGHT_RE = /%%>\s*(.*?)\s*%%/g;

/** Matches %%< content %% (left margin note) */
export const MARGIN_LEFT_RE = /%%<\s*(.*?)\s*%%/g;

/** Matches both directions */
export const MARGIN_ANY_RE = /%%([><])\s*(.*?)\s*%%/g;

/** Matches image syntax inside a margin note: img:[[filename]] */
export const MARGIN_IMG_RE = /^img:\[\[(.*?)\]\]$/;

/** Matches blur suffix ;; */
export const BLUR_SUFFIX_RE = /;;\s*$/;

/** cornell fenced code block */
export const CORNELL_BLOCK_RE = /```cornell\n([\s\S]*?)```/g;

/** cornell callout */
export const CORNELL_CALLOUT_RE = />\s*\[!cornell\]\n((?:>.*\n?)*)/g;
