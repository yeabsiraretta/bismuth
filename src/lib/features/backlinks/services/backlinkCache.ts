/**
 * Backlink Cache — builds and maintains an in-memory index of all
 * backlinks across the vault for O(1) lookup per file.
 */
import type {
  CachedBacklink,
  BacklinkCacheEntry,
  OutgoingLink,
  BacklinkCacheSettings,
  CacheStats,
  BacklinkSource,
} from '../types';
import { WIKILINK_RE, MD_LINK_RE, DEFAULT_CACHE_SETTINGS } from '../types';
import { extractFrontmatterLinks } from './frontmatterLinks';
import { extractCanvasLinks, isCanvasFile } from './canvasLinks';

// ─── Content hashing ─────────────────────────────────────────────────────────

/** Fast string hash (djb2) for change detection */
export function hashContent(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}

// ─── Link extraction from markdown ───────────────────────────────────────────

export function extractWikilinks(content: string, contextLen: number = 120): OutgoingLink[] {
  const links: OutgoingLink[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const re = new RegExp(WIKILINK_RE.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      links.push({
        target: match[1].trim(),
        resolvedPath: null,
        source: 'wikilink',
        line: i + 1,
        context: line.trim().slice(0, contextLen),
        alias: match[2]?.trim(),
      });
    }
  }
  return links;
}

export function extractMarkdownLinks(content: string, contextLen: number = 120): OutgoingLink[] {
  const links: OutgoingLink[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const re = new RegExp(MD_LINK_RE.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      const href = match[2].trim();
      if (href.startsWith('http') || href.startsWith('#')) continue;
      links.push({
        target: href,
        resolvedPath: href.endsWith('.md') ? href : null,
        source: 'markdown',
        line: i + 1,
        context: line.trim().slice(0, contextLen),
        alias: match[1]?.trim() || undefined,
      });
    }
  }
  return links;
}

// ─── Cache class ─────────────────────────────────────────────────────────────

export interface NoteInput {
  path: string;
  title: string;
  content: string;
  frontmatter?: Record<string, unknown>;
}

export class BacklinkCache {
  /** path → outgoing links from that file */
  private entries = new Map<string, BacklinkCacheEntry>();
  /** target path → source backlinks pointing at it */
  private reverseIndex = new Map<string, CachedBacklink[]>();
  private settings: BacklinkCacheSettings;
  private stats: CacheStats = {
    totalFiles: 0,
    totalLinks: 0,
    buildTime: 0,
    canvasFiles: 0,
    isComplete: false,
    lastBuild: 0,
  };

  constructor(settings: Partial<BacklinkCacheSettings> = {}) {
    this.settings = { ...DEFAULT_CACHE_SETTINGS, ...settings };
  }

  // ─── Path resolution helpers ─────────────────────────────────────────

  private titleToPath = new Map<string, string>();

  private resolveTarget(target: string): string | null {
    if (target.endsWith('.md')) return target;
    return this.titleToPath.get(target.toLowerCase()) ?? null;
  }

  // ─── Build ───────────────────────────────────────────────────────────

  /** Build cache from all notes. Call once on startup and on bulk changes. */
  buildFromNotes(notes: NoteInput[]): void {
    const start = performance.now();
    this.entries.clear();
    this.reverseIndex.clear();
    this.titleToPath.clear();

    // Build title → path lookup
    for (const n of notes) {
      const title = n.title || n.path.split('/').pop()?.replace('.md', '') || '';
      this.titleToPath.set(title.toLowerCase(), n.path);
      const fileName = n.path.split('/').pop()?.replace('.md', '') || '';
      if (fileName.toLowerCase() !== title.toLowerCase()) {
        this.titleToPath.set(fileName.toLowerCase(), n.path);
      }
    }

    let canvasCount = 0;

    for (const note of notes) {
      const outgoing = this.extractAllLinks(note);
      const entry: BacklinkCacheEntry = {
        path: note.path,
        outgoingLinks: outgoing,
        contentHash: hashContent(note.content),
        timestamp: Date.now(),
      };
      this.entries.set(note.path, entry);

      if (isCanvasFile(note.path)) canvasCount++;
    }

    // Build reverse index
    this.rebuildReverseIndex();

    const elapsed = performance.now() - start;
    this.stats = {
      totalFiles: notes.length,
      totalLinks: [...this.entries.values()].reduce((s, e) => s + e.outgoingLinks.length, 0),
      buildTime: Math.round(elapsed),
      canvasFiles: canvasCount,
      isComplete: true,
      lastBuild: Date.now(),
    };
  }

  /** Extract all outgoing links from a note */
  private extractAllLinks(note: NoteInput): OutgoingLink[] {
    const ctx = this.settings.contextLength;

    // Canvas files
    if (isCanvasFile(note.path) && this.settings.includeCanvas) {
      const canvasLinks = extractCanvasLinks(note.path, note.content);
      return canvasLinks.map((cl) => ({
        target: cl.targetPath,
        resolvedPath: cl.targetPath.endsWith('.md')
          ? cl.targetPath
          : this.resolveTarget(cl.targetPath),
        source: 'canvas' as BacklinkSource,
        line: 0,
        context: `Canvas ${cl.cardType} card`,
        alias: undefined,
      }));
    }

    // Markdown files
    const links: OutgoingLink[] = [
      ...extractWikilinks(note.content, ctx),
      ...extractMarkdownLinks(note.content, ctx),
    ];

    // Frontmatter links
    if (this.settings.includeFrontmatterLinks && note.frontmatter) {
      const fmLinks = extractFrontmatterLinks(note.frontmatter);
      for (const fl of fmLinks) {
        links.push({
          target: fl.targetPath,
          resolvedPath: fl.targetPath.endsWith('.md') ? fl.targetPath : null,
          source: 'frontmatter',
          line: 0,
          context: `Frontmatter ${fl.key}: ${fl.title}`,
          alias: fl.title,
        });
      }
    }

    // Resolve targets
    for (const link of links) {
      if (!link.resolvedPath) {
        link.resolvedPath = this.resolveTarget(link.target);
      }
    }

    return links;
  }

  /** Rebuild the reverse index from current entries */
  private rebuildReverseIndex(): void {
    this.reverseIndex.clear();
    for (const [sourcePath, entry] of this.entries) {
      const title = sourcePath.split('/').pop()?.replace('.md', '') || sourcePath;
      for (const link of entry.outgoingLinks) {
        const targetKey = link.resolvedPath ?? link.target.toLowerCase();
        if (!this.reverseIndex.has(targetKey)) this.reverseIndex.set(targetKey, []);
        this.reverseIndex.get(targetKey)!.push({
          sourcePath,
          sourceTitle: title,
          targetPath: targetKey,
          source: link.source,
          line: link.line,
          context: link.context,
          alias: link.alias,
          isResolved: link.resolvedPath !== null,
        });
      }
    }
  }

  // ─── Incremental updates ─────────────────────────────────────────────

  /** Update cache for a single changed file */
  updateFile(note: NoteInput): boolean {
    const existing = this.entries.get(note.path);
    const newHash = hashContent(note.content);
    if (existing && existing.contentHash === newHash) return false;

    const title = note.title || note.path.split('/').pop()?.replace('.md', '') || '';
    this.titleToPath.set(title.toLowerCase(), note.path);

    const outgoing = this.extractAllLinks(note);
    this.entries.set(note.path, {
      path: note.path,
      outgoingLinks: outgoing,
      contentHash: newHash,
      timestamp: Date.now(),
    });

    this.rebuildReverseIndex();
    return true;
  }

  /** Remove a file from the cache */
  removeFile(path: string): void {
    this.entries.delete(path);
    this.rebuildReverseIndex();
  }

  // ─── Lookups ─────────────────────────────────────────────────────────

  /** Get all backlinks pointing to a file (fast O(1) lookup) */
  getBacklinksForFile(pathOrTitle: string): CachedBacklink[] {
    // Try direct path match first
    const byPath = this.reverseIndex.get(pathOrTitle);
    if (byPath) return byPath;

    // Try title match
    const resolved = this.resolveTarget(pathOrTitle);
    if (resolved) return this.reverseIndex.get(resolved) ?? [];

    // Try lowercase
    return this.reverseIndex.get(pathOrTitle.toLowerCase()) ?? [];
  }

  /** Get outgoing links from a file */
  getOutgoingLinksForFile(path: string): OutgoingLink[] {
    return this.entries.get(path)?.outgoingLinks ?? [];
  }

  /** Check if a file has any backlinks */
  hasBacklinks(path: string): boolean {
    return (this.reverseIndex.get(path)?.length ?? 0) > 0;
  }

  /** Get backlink count for a file */
  getBacklinkCount(path: string): number {
    return this.reverseIndex.get(path)?.length ?? 0;
  }

  /** Get cache statistics */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /** Get all cached file paths */
  getCachedPaths(): string[] {
    return [...this.entries.keys()];
  }

  /** Clear entire cache */
  clear(): void {
    this.entries.clear();
    this.reverseIndex.clear();
    this.titleToPath.clear();
    this.stats = {
      totalFiles: 0,
      totalLinks: 0,
      buildTime: 0,
      canvasFiles: 0,
      isComplete: false,
      lastBuild: 0,
    };
  }
}
