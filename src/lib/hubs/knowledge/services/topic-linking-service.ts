/**
 * Topic Linking Service — detect unlinked mentions of note titles in content.
 *
 * Pure functions. No store/DOM dependencies.
 * Scans note content for plain-text occurrences of other notes' titles
 * that are NOT already wrapped in [[wikilinks]], code fences, or inline code.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface UnlinkedMention {
  /** Title of the note being mentioned */
  targetTitle: string;
  /** 0-based line index where the mention was found */
  line: number;
  /** 0-based column offset within the line */
  column: number;
  /** Length of the matched text */
  length: number;
  /** The surrounding line text for preview */
  context: string;
}

export interface TopicLinkResult {
  /** Path of the source note that was scanned */
  sourcePath: string;
  /** All unlinked mentions found */
  mentions: UnlinkedMention[];
}

// ── Exclusion zones ──────────────────────────────────────────────────────────

interface ExclusionZone {
  start: number;
  end: number;
}

/**
 * Build exclusion zones for regions where mentions should NOT be detected:
 * - Wikilinks: [[...]]
 * - Markdown links: [text](url)
 * - Inline code: `...`
 * - Fenced code blocks: ```...```  or ~~~...~~~
 * - Frontmatter: ---...---
 * - HTML tags: <...>
 */
export function buildExclusionZones(content: string): ExclusionZone[] {
  const zones: ExclusionZone[] = [];

  // Frontmatter (must start at position 0)
  const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (fmMatch) {
    zones.push({ start: 0, end: fmMatch[0].length });
  }

  // Fenced code blocks
  const fenceRe = /^(`{3,}|~{3,}).*\n[\s\S]*?\n\1\s*$/gm;
  let m: RegExpExecArray | null;
  fenceRe.lastIndex = 0;
  while ((m = fenceRe.exec(content)) !== null) {
    zones.push({ start: m.index, end: m.index + m[0].length });
  }

  // Wikilinks (including embeds)
  const wlRe = /!?\[\[[^\]]*\]\]/g;
  wlRe.lastIndex = 0;
  while ((m = wlRe.exec(content)) !== null) {
    zones.push({ start: m.index, end: m.index + m[0].length });
  }

  // Markdown links [text](url)
  const mdLinkRe = /\[[^\]]*\]\([^)]*\)/g;
  mdLinkRe.lastIndex = 0;
  while ((m = mdLinkRe.exec(content)) !== null) {
    zones.push({ start: m.index, end: m.index + m[0].length });
  }

  // Inline code
  const codeRe = /`[^`]+`/g;
  codeRe.lastIndex = 0;
  while ((m = codeRe.exec(content)) !== null) {
    zones.push({ start: m.index, end: m.index + m[0].length });
  }

  // HTML tags
  const htmlRe = /<[^>]+>/g;
  htmlRe.lastIndex = 0;
  while ((m = htmlRe.exec(content)) !== null) {
    zones.push({ start: m.index, end: m.index + m[0].length });
  }

  return zones;
}

function isExcluded(offset: number, length: number, zones: ExclusionZone[]): boolean {
  const end = offset + length;
  return zones.some((z) => offset >= z.start && end <= z.end);
}

// ── Word-boundary helpers ────────────────────────────────────────────────────

function isWordBoundary(ch: string | undefined): boolean {
  if (ch === undefined) return true;
  return /[\s.,;:!?'"()[\]{}<>/\\|@#$%^&*+=~`\-–—]/.test(ch);
}

// ── Core detection ───────────────────────────────────────────────────────────

/**
 * Scan `content` for plain-text mentions of titles in `noteTitles`.
 * Returns matches that are NOT inside excluded zones and sit on word boundaries.
 *
 * @param content      — markdown source to scan
 * @param sourcePath   — path of the note being scanned (excluded from title list)
 * @param noteTitles   — map of note title (lowercase) → original title
 * @param ignoreSet    — set of lowercase titles to skip
 */
export function detectUnlinkedMentions(
  content: string,
  sourcePath: string,
  noteTitles: Map<string, string>,
  ignoreSet: Set<string> = new Set()
): TopicLinkResult {
  const zones = buildExclusionZones(content);
  const mentions: UnlinkedMention[] = [];
  const lines = content.split('\n');

  // Build line offset table for fast line/col lookup
  const lineOffsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineOffsets.push(offset);
    offset += line.length + 1; // +1 for \n
  }

  // Sort titles longest-first so "Machine Learning" matches before "Machine"
  const sortedTitles = Array.from(noteTitles.entries()).sort((a, b) => b[0].length - a[0].length);

  const contentLower = content.toLowerCase();
  const seen = new Set<string>(); // dedup by "line:col"

  for (const [titleLower, originalTitle] of sortedTitles) {
    if (titleLower.length < 2) continue; // skip single-char titles
    if (ignoreSet.has(titleLower)) continue;

    // Skip if this title is the source note's own name
    const sourceName = sourcePath.split('/').pop()?.replace(/\.md$/, '')?.toLowerCase() ?? '';
    if (titleLower === sourceName) continue;

    let searchFrom = 0;
    while (searchFrom < contentLower.length) {
      const idx = contentLower.indexOf(titleLower, searchFrom);
      if (idx === -1) break;
      searchFrom = idx + 1;

      const matchLen = titleLower.length;

      // Word boundary check
      const before = idx > 0 ? content[idx - 1] : undefined;
      const after = idx + matchLen < content.length ? content[idx + matchLen] : undefined;
      if (!isWordBoundary(before) || !isWordBoundary(after)) continue;

      // Exclusion zone check
      if (isExcluded(idx, matchLen, zones)) continue;

      // Find line and column
      let lineIdx = 0;
      for (let l = lineOffsets.length - 1; l >= 0; l--) {
        if (lineOffsets[l] <= idx) {
          lineIdx = l;
          break;
        }
      }
      const col = idx - lineOffsets[lineIdx];

      const key = `${lineIdx}:${col}`;
      if (seen.has(key)) continue;
      seen.add(key);

      mentions.push({
        targetTitle: originalTitle,
        line: lineIdx,
        column: col,
        length: matchLen,
        context: lines[lineIdx],
      });
    }
  }

  // Sort by position
  mentions.sort((a, b) => a.line - b.line || a.column - b.column);

  return { sourcePath, mentions };
}

// ── Link insertion ───────────────────────────────────────────────────────────

/**
 * Replace a single mention in content with a [[wikilink]].
 * Returns the updated content string.
 */
export function linkMention(content: string, mention: UnlinkedMention): string {
  const lines = content.split('\n');
  const line = lines[mention.line];
  if (!line) return content;

  const before = line.slice(0, mention.column);
  const matched = line.slice(mention.column, mention.column + mention.length);
  const after = line.slice(mention.column + mention.length);

  // If the matched text differs in case from the title, use alias syntax
  const wikilink =
    matched === mention.targetTitle
      ? `[[${mention.targetTitle}]]`
      : `[[${mention.targetTitle}|${matched}]]`;

  lines[mention.line] = before + wikilink + after;
  return lines.join('\n');
}

/**
 * Replace all mentions in content with [[wikilinks]].
 * Applies replacements from bottom to top to preserve offsets.
 */
export function linkAllMentions(content: string, mentions: UnlinkedMention[]): string {
  // Sort bottom-to-top, right-to-left so replacements don't shift earlier offsets
  const sorted = [...mentions].sort((a, b) => b.line - a.line || b.column - a.column);

  let result = content;
  for (const mention of sorted) {
    result = linkMention(result, mention);
  }
  return result;
}

// ── Title extraction helper ──────────────────────────────────────────────────

/**
 * Build a Map<lowercaseTitle, originalTitle> from an array of note paths.
 * Strips .md extension and uses the filename as the title.
 */
export function buildTitleMap(notePaths: string[], minLength = 2): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of notePaths) {
    const name = p.split('/').pop()?.replace(/\.md$/, '');
    if (name && name.length >= minLength) {
      map.set(name.toLowerCase(), name);
    }
  }
  return map;
}
