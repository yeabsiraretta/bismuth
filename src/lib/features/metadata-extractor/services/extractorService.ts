/**
 * Metadata Extractor service — builds the four JSON exports from vault data.
 *
 * Pure functions that transform vault notes into the export formats.
 * No Tauri IPC calls here — those are injected by the store/caller.
 */

import type {
  TagToFile,
  NoteMetadataExport,
  MdLink,
  MdBacklink,
  MdHeading,
  NonMdExport,
  FolderEntry,
  FileEntry,
  CanvasEntry,
} from '../types';

interface NoteInput {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

// ─── Tag export builder ────────────────────────────────────────────────────────

/** Extract all tags from note content and frontmatter. */
export function extractTags(content: string, frontmatter: Record<string, unknown>): string[] {
  const tagSet = new Set<string>();

  // Inline tags: #tag-name (not inside code blocks)
  const stripped = stripCodeBlocks(content);
  const inlineRegex = /#([a-zA-Z][\w/-]*)/g;
  let match;
  while ((match = inlineRegex.exec(stripped)) !== null) {
    tagSet.add(match[1].toLowerCase());
  }

  // Frontmatter tags
  const fmTags = frontmatter['tags'];
  if (Array.isArray(fmTags)) {
    for (const t of fmTags) {
      if (typeof t === 'string') tagSet.add(t.toLowerCase().replace(/^#/, ''));
    }
  } else if (typeof fmTags === 'string') {
    tagSet.add(fmTags.toLowerCase().replace(/^#/, ''));
  }

  return [...tagSet].sort();
}

/** Build the tag-to-file JSON export. */
export function buildTagExport(notes: NoteInput[]): TagToFile[] {
  const tagMap = new Map<string, Set<string>>();

  for (const note of notes) {
    const tags = extractTags(note.content, note.frontmatter);
    for (const tag of tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, new Set());
      tagMap.get(tag)!.add(note.path);
    }
  }

  const result: TagToFile[] = [];
  for (const [tag, paths] of tagMap) {
    result.push({
      tag,
      tagCount: paths.size,
      relativePaths: [...paths].sort(),
    });
  }

  return result.sort((a, b) => b.tagCount - a.tagCount);
}

// ─── Markdown metadata export builder ──────────────────────────────────────────

/** Extract headings from markdown content. */
export function extractHeadings(content: string): MdHeading[] {
  const headings: MdHeading[] = [];
  const stripped = stripCodeBlocks(content);
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(stripped)) !== null) {
    headings.push({ heading: match[2].trim(), level: match[1].length });
  }
  return headings;
}

/** Extract wikilinks from content. */
export function extractLinks(content: string, allPaths: Map<string, string>): MdLink[] {
  const stripped = stripCodeBlocks(content);
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: MdLink[] = [];
  let match;

  while ((match = regex.exec(stripped)) !== null) {
    const full = match[1];
    const [linkPart, aliasPart] = full.split('|');
    const [target, ...fragments] = linkPart.split('#');
    const hasFragment = fragments.length > 0;

    const link: MdLink = { link: linkPart.trim() };

    // Resolve relative path
    const targetLower = target.trim().toLowerCase();
    const resolved = allPaths.get(targetLower);
    if (resolved) {
      link.relativePath = resolved;
    }

    // cleanLink only if there's a heading/block reference
    if (hasFragment && target.trim()) {
      link.cleanLink = target.trim();
    }

    // displayText
    if (aliasPart) {
      link.displayText = aliasPart.trim();
    } else if (hasFragment) {
      link.displayText = fragments.join('#');
    }

    links.push(link);
  }

  return links;
}

/** Extract aliases from frontmatter. */
export function extractAliases(frontmatter: Record<string, unknown>): string[] | undefined {
  const aliases = frontmatter['aliases'];
  if (Array.isArray(aliases)) {
    const result = aliases.filter((a): a is string => typeof a === 'string');
    return result.length > 0 ? result : undefined;
  }
  if (typeof aliases === 'string') return [aliases];
  return undefined;
}

/** Build backlinks map: for each note path, who links to it. */
export function buildBacklinksMap(
  notes: NoteInput[],
  allPaths: Map<string, string>,
): Map<string, MdBacklink[]> {
  const map = new Map<string, MdBacklink[]>();

  for (const note of notes) {
    const links = extractLinks(note.content, allPaths);
    for (const link of links) {
      if (!link.relativePath) continue;
      const targetPath = link.relativePath;
      if (!map.has(targetPath)) map.set(targetPath, []);

      const fileName = note.path.split('/').pop()?.replace('.md', '') || '';
      const backlink: MdBacklink = {
        fileName,
        link: link.link,
        relativePath: note.path,
      };
      if (link.cleanLink) backlink.cleanLink = link.cleanLink;
      if (link.displayText) backlink.displayText = link.displayText;

      map.get(targetPath)!.push(backlink);
    }
  }

  return map;
}

/** Build the full markdown metadata export. */
export function buildMetadataExport(notes: NoteInput[]): NoteMetadataExport[] {
  // Build lookup: lowercase title → path
  const allPaths = new Map<string, string>();
  for (const note of notes) {
    const name = note.path.split('/').pop()?.replace('.md', '') || '';
    allPaths.set(name.toLowerCase(), note.path);
    allPaths.set(note.title.toLowerCase(), note.path);
  }

  const backlinksMap = buildBacklinksMap(notes, allPaths);

  return notes.map(note => {
    const fileName = note.path.split('/').pop()?.replace('.md', '') || '';
    const tags = extractTags(note.content, note.frontmatter);
    const headings = extractHeadings(note.content);
    const aliases = extractAliases(note.frontmatter);
    const links = extractLinks(note.content, allPaths);
    const backlinks = backlinksMap.get(note.path);

    const entry: NoteMetadataExport = {
      fileName,
      relativePath: note.path,
    };

    if (tags.length > 0) entry.tags = tags;
    if (headings.length > 0) entry.headings = headings;
    if (aliases) entry.aliases = aliases;
    if (links.length > 0) entry.links = links;
    if (backlinks && backlinks.length > 0) entry.backlinks = backlinks;

    // Include frontmatter only if it has content beyond 'position'
    const fmKeys = Object.keys(note.frontmatter).filter(k => k !== 'position');
    if (fmKeys.length > 0) entry.frontmatter = note.frontmatter;

    return entry;
  });
}

// ─── Non-markdown export builder ───────────────────────────────────────────────

/** Build the non-MD files + folders export. */
export function buildNonMdExport(
  folders: string[],
  nonMdFiles: Array<{ name: string; relativePath: string }>,
): NonMdExport {
  const folderEntries: FolderEntry[] = folders.map(p => ({
    name: p.split('/').pop() || p,
    relativePath: p,
  }));

  const fileEntries: FileEntry[] = nonMdFiles.map(f => ({
    name: f.name,
    basename: f.name.replace(/\.[^.]+$/, ''),
    relativePath: f.relativePath,
  }));

  const result: NonMdExport = { folders: folderEntries };
  if (fileEntries.length > 0) result.nonMdFiles = fileEntries;
  return result;
}

// ─── Canvas export builder ─────────────────────────────────────────────────────

/** Build the canvas files export. */
export function buildCanvasExport(
  canvasFiles: Array<{ name: string; relativePath: string }>,
): CanvasEntry[] {
  return canvasFiles.map(f => ({
    name: f.name,
    basename: f.name.replace(/\.canvas$/, ''),
    relativePath: f.relativePath,
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Remove fenced code blocks from content to avoid false matches. */
function stripCodeBlocks(content: string): string {
  return content.replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1/gm, '');
}
