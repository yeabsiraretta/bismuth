/**
 * Backlink cache types — cached backlink entries, canvas links,
 * frontmatter links, cache statistics.
 */

// ─── Link source types ───────────────────────────────────────────────────────

export type BacklinkSource = 'wikilink' | 'markdown' | 'frontmatter' | 'canvas' | 'unlinked';

// ─── Cached backlink entry ───────────────────────────────────────────────────

export interface CachedBacklink {
  /** Path of the source file containing the link */
  sourcePath: string;
  /** Display name of the source file */
  sourceTitle: string;
  /** Path of the target file being linked to */
  targetPath: string;
  /** How this link was created */
  source: BacklinkSource;
  /** Line number where the link appears (1-indexed) */
  line: number;
  /** Context snippet around the link */
  context: string;
  /** Alias used in the link (e.g. [[target|alias]]) */
  alias?: string;
  /** Whether the target actually exists as a file */
  isResolved: boolean;
}

// ─── Per-file cache entry ────────────────────────────────────────────────────

export interface BacklinkCacheEntry {
  /** Path this entry caches outgoing links for */
  path: string;
  /** All outgoing links found in this file */
  outgoingLinks: OutgoingLink[];
  /** Content hash for change detection */
  contentHash: number;
  /** When this entry was last computed */
  timestamp: number;
}

export interface OutgoingLink {
  /** Target file path or title */
  target: string;
  /** Resolved full path (null if unresolved) */
  resolvedPath: string | null;
  source: BacklinkSource;
  line: number;
  context: string;
  alias?: string;
}

// ─── Canvas link ─────────────────────────────────────────────────────────────

export interface CanvasLink {
  /** Canvas file path */
  canvasPath: string;
  /** Referenced file path from file card or text card wikilink */
  targetPath: string;
  /** Card type that produced the link */
  cardType: 'file' | 'text';
  /** Card ID in the canvas */
  cardId: string;
}

// ─── Frontmatter markdown link ───────────────────────────────────────────────

export interface FrontmatterLink {
  /** Frontmatter key containing the link */
  key: string;
  /** Display text of the markdown link */
  title: string;
  /** Target path from the link */
  targetPath: string;
}

// ─── Cache statistics ────────────────────────────────────────────────────────

export interface CacheStats {
  /** Total files indexed */
  totalFiles: number;
  /** Total links cached */
  totalLinks: number;
  /** Cache build time in ms */
  buildTime: number;
  /** Number of canvas files included */
  canvasFiles: number;
  /** Whether the cache is fully built */
  isComplete: boolean;
  /** Last full build timestamp */
  lastBuild: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface BacklinkCacheSettings {
  /** Include canvas file/text card references */
  includeCanvas: boolean;
  /** Include frontmatter markdown links */
  includeFrontmatterLinks: boolean;
  /** Include unlinked mentions (slower) */
  includeUnlinked: boolean;
  /** Max context snippet length */
  contextLength: number;
}

export const DEFAULT_CACHE_SETTINGS: BacklinkCacheSettings = {
  includeCanvas: true,
  includeFrontmatterLinks: true,
  includeUnlinked: false,
  contextLength: 120,
};

// ─── Regex patterns ──────────────────────────────────────────────────────────

/** Matches [[target]] or [[target|alias]] */
export const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

/** Matches [text](path) markdown links */
export const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

/** Matches frontmatter markdown links: "[title](path)" */
export const FRONTMATTER_MD_LINK_RE = /\[([^\]]*)\]\(([^)]+\.md)\)/g;
