/**
 * Code Styler types — configuration for code block and inline code styling.
 *
 * Supports: line numbers, titles, folding, line highlighting,
 * language icons, coloured left borders, copy buttons, and themes.
 */

// ─── Highlight types ─────────────────────────────────────────────────────────

/** A resolved set of line numbers to highlight with a specific colour. */
export interface HighlightGroup {
  /** Highlight name (e.g. 'hl', 'info', 'warn', 'error'). */
  name: string;
  /** Resolved 0-based line indices. */
  lines: Set<number>;
  /** CSS colour value. */
  color: string;
}

// ─── Codeblock parameters ────────────────────────────────────────────────────

/** Parsed parameters from the opening fence line. */
export interface CodeBlockParams {
  /** Programming language (e.g. 'cpp', 'python'). */
  language: string;
  /** Display title for the header. */
  title: string;
  /** Whether codeblock starts folded. */
  fold: boolean;
  /** Custom fold placeholder text. */
  foldPlaceholder: string;
  /** Line number display: true/false or a starting offset. */
  lineNumbers: boolean | number;
  /** Raw highlight specs per group name. */
  highlights: Record<string, string>;
  /** unwrap/wrap override. */
  unwrap: boolean | 'inactive' | null;
  /** Whether to ignore styling for this block. */
  ignore: boolean;
  /** Reference link for the title. */
  reference: string;
}

// ─── Language icon mapping ───────────────────────────────────────────────────

export interface LanguageIcon {
  /** Display name. */
  name: string;
  /** CSS colour for the left border accent. */
  color: string;
  /** SVG icon path data (Lucide-compatible 24x24 viewBox). */
  iconPath?: string;
}

// ─── Alternative highlight colours ───────────────────────────────────────────

export interface AltHighlight {
  name: string;
  lightColor: string;
  darkColor: string;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface CodeStylerTheme {
  id: string;
  name: string;
  codeblock: {
    backgroundColor: string;
    textColor: string;
    gutterBackgroundColor: string;
    gutterTextColor: string;
    gutterActiveLineColor: string;
    headerBackgroundColor: string;
    headerTitleColor: string;
    headerSeparatorColor: string;
    headerLangTagBackground: string;
    headerLangTagColor: string;
    activeLineColor: string;
    highlightColor: string;
    lineNumberColor: string;
    borderRadius: number;
    languageBorderWidth: number;
    showLanguageBorder: boolean;
    showLineNumbers: boolean;
    showHeader: 'always' | 'ifTitle' | 'never';
    showLanguageIcon: 'always' | 'ifHeader' | 'never';
    showLanguageTag: 'always' | 'ifHeader' | 'never';
    showCopyButton: boolean;
    unwrapLines: boolean;
    highlightGutter: boolean;
  };
  inlineCode: {
    backgroundColor: string;
    textColor: string;
    activeTextColor: string;
    fontWeight: string;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
    syntaxHighlight: boolean;
  };
  altHighlights: AltHighlight[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface CodeStylerConfig {
  enabled: boolean;
  activeThemeId: string;
  themes: CodeStylerTheme[];
  excludedLanguages: string[];
  whitelistedProcessedLanguages: string[];
  defaultFoldPlaceholder: string;
  editorActiveLineHighlight: boolean;
  editorActiveLineColor: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_THEME: CodeStylerTheme = {
  id: 'default',
  name: 'Default',
  codeblock: {
    backgroundColor: 'var(--background-secondary)',
    textColor: 'var(--text-normal)',
    gutterBackgroundColor: 'var(--background-secondary-alt, var(--background-secondary))',
    gutterTextColor: 'var(--text-faint)',
    gutterActiveLineColor: 'var(--interactive-accent)',
    headerBackgroundColor: 'var(--background-secondary-alt, var(--background-secondary))',
    headerTitleColor: 'var(--text-normal)',
    headerSeparatorColor: 'var(--border-color)',
    headerLangTagBackground: 'var(--background-modifier-hover)',
    headerLangTagColor: 'var(--text-muted)',
    activeLineColor: 'var(--background-modifier-hover)',
    highlightColor: 'rgba(255, 208, 0, 0.15)',
    lineNumberColor: 'var(--text-faint)',
    borderRadius: 8,
    languageBorderWidth: 3,
    showLanguageBorder: true,
    showLineNumbers: true,
    showHeader: 'ifTitle',
    showLanguageIcon: 'ifHeader',
    showLanguageTag: 'ifHeader',
    showCopyButton: true,
    unwrapLines: false,
    highlightGutter: false,
  },
  inlineCode: {
    backgroundColor: 'var(--background-secondary)',
    textColor: 'var(--text-normal)',
    activeTextColor: 'var(--text-normal)',
    fontWeight: 'normal',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    syntaxHighlight: false,
  },
  altHighlights: [
    { name: 'info', lightColor: 'rgba(8, 143, 255, 0.15)', darkColor: 'rgba(8, 143, 255, 0.2)' },
    { name: 'warn', lightColor: 'rgba(255, 145, 0, 0.15)', darkColor: 'rgba(255, 145, 0, 0.2)' },
    { name: 'error', lightColor: 'rgba(255, 23, 68, 0.15)', darkColor: 'rgba(255, 23, 68, 0.2)' },
  ],
};

export const DEFAULT_CODE_STYLER_CONFIG: CodeStylerConfig = {
  enabled: true,
  activeThemeId: 'default',
  themes: [DEFAULT_THEME],
  excludedLanguages: [],
  whitelistedProcessedLanguages: [],
  defaultFoldPlaceholder: 'Collapsed Code',
  editorActiveLineHighlight: true,
  editorActiveLineColor: 'var(--background-modifier-hover)',
};
