/**
 * Frontend Application Constants
 *
 * Centralized configuration for UI, performance, and feature settings.
 * These constants can be overridden by user settings loaded from backend.
 */

/** Editor configuration */
export const EDITOR = {
  /** Auto-save delay in milliseconds */
  AUTO_SAVE_DELAY_MS: 500,

  /** Maximum input latency target (ms) */
  MAX_INPUT_LATENCY_MS: 16,

  /** Default tab size */
  DEFAULT_TAB_SIZE: 2,

  /** Line wrap column (0 = no wrap) */
  LINE_WRAP_COLUMN: 0,

  /** Enable spell check by default */
  ENABLE_SPELL_CHECK: true,
} as const;

/** Layout and UI configuration */
export const LAYOUT = {
  /** Minimum sidebar width (px) */
  SIDEBAR_MIN_WIDTH: 200,

  /** Maximum sidebar width (px) */
  SIDEBAR_MAX_WIDTH: 600,

  /** Default sidebar width (px) */
  SIDEBAR_DEFAULT_WIDTH: 300,

  /** Toolbar height (px) */
  TOOLBAR_HEIGHT: 48,

  /** Status bar height (px) */
  STATUS_BAR_HEIGHT: 24,
} as const;

/** Performance targets */
export const PERFORMANCE = {
  /** Target page load time (ms) */
  TARGET_PAGE_LOAD_MS: 1000,

  /** Target search response time (ms) */
  TARGET_SEARCH_MS: 200,

  /** Graph rendering timeout (nodes) */
  GRAPH_RENDER_TIMEOUT_NODES: 10_000,

  /** Graph rendering target time (ms) */
  GRAPH_RENDER_TARGET_MS: 3000,

  /** Maximum search results */
  MAX_SEARCH_RESULTS: 100,
} as const;

/** Animation and transition durations */
export const ANIMATION = {
  /** Fast transition (ms) */
  FAST: 150,

  /** Medium transition (ms) */
  MEDIUM: 250,

  /** Slow transition (ms) */
  SLOW: 350,

  /** Panel collapse/expand duration (ms) */
  PANEL_TRANSITION: 300,
} as const;

/** Accessibility */
export const ACCESSIBILITY = {
  /** Minimum touch target size (px) */
  MIN_TOUCH_TARGET: 44,

  /** Primary button minimum size (px) */
  MIN_PRIMARY_BUTTON: 44,

  /** Secondary button minimum size (px) */
  MIN_SECONDARY_BUTTON: 40,

  /** Maximum cognitive load (items in list/menu) */
  MAX_COGNITIVE_LOAD: 7,

  /** Minimum color contrast ratio */
  MIN_CONTRAST_RATIO: 4.5,
} as const;

/** Breakpoints for responsive design */
export const BREAKPOINTS = {
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

/** Z-index layers */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  MODAL_BACKDROP: 300,
  MODAL: 400,
  POPOVER: 500,
  TOOLTIP: 600,
  NOTIFICATION: 700,
} as const;

/** Toast notification configuration */
export const TOAST = {
  /** Default duration (ms) */
  DEFAULT_DURATION: 5000,

  /** Success toast duration (ms) */
  SUCCESS_DURATION: 3000,

  /** Error toast duration (ms) */
  ERROR_DURATION: 7000,

  /** Maximum toasts visible */
  MAX_VISIBLE: 5,
} as const;

/** File validation */
export const FILE = {
  /** Allowed note extensions */
  ALLOWED_EXTENSIONS: ['md', 'markdown', 'txt'] as const,

  /** Maximum file size warning (bytes) - 10MB */
  MAX_SIZE_WARNING: 10_000_000,

  /** Maximum path length */
  MAX_PATH_LENGTH: 4096,
} as const;

/** Feature flags */
export const FEATURES = {
  /** Enable crash recovery */
  CRASH_RECOVERY: true,

  /** Enable edit history */
  EDIT_HISTORY: true,

  /** Enable auto-save */
  AUTO_SAVE: true,

  /** Enable file size warnings */
  SIZE_WARNINGS: true,

  /** Enable depth warnings */
  DEPTH_WARNINGS: true,

  /** Enable graph view */
  GRAPH_VIEW: true,

  /** Enable split pane */
  SPLIT_PANE: true,
} as const;

/** Validation helpers */
export const validate = {
  /** Check if file extension is allowed */
  isExtensionAllowed(ext: string): boolean {
    return (FILE.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  },

  /** Check if file size exceeds warning threshold */
  isFileTooLarge(size: number): boolean {
    return size > FILE.MAX_SIZE_WARNING;
  },

  /** Check if value is within sidebar width constraints */
  isValidSidebarWidth(width: number): boolean {
    return width >= LAYOUT.SIDEBAR_MIN_WIDTH && width <= LAYOUT.SIDEBAR_MAX_WIDTH;
  },

  /** Clamp sidebar width to valid range */
  clampSidebarWidth(width: number): number {
    return Math.max(LAYOUT.SIDEBAR_MIN_WIDTH, Math.min(LAYOUT.SIDEBAR_MAX_WIDTH, width));
  },

  /** Check if cognitive load is acceptable */
  isAcceptableCognitiveLoad(itemCount: number): boolean {
    return itemCount <= ACCESSIBILITY.MAX_COGNITIVE_LOAD;
  },
};

/** Debounce delays (ms) */
export const DEBOUNCE = {
  /** Search input debounce */
  SEARCH: 300,
  /** Auto-save delay */
  AUTO_SAVE: 500,
  /** Resize handler debounce */
  RESIZE: 100,
} as const;

/** MCP (Model Context Protocol) defaults */
export const MCP = {
  /** Default MCP server URL for canvas documents */
  DEFAULT_SERVER_URL: 'http://localhost:3456',
} as const;

/** Type exports for strict typing */
export type AllowedExtension = (typeof FILE.ALLOWED_EXTENSIONS)[number];
export type Breakpoint = keyof typeof BREAKPOINTS;
export type ZIndexLayer = keyof typeof Z_INDEX;
