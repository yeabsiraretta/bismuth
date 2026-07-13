export interface WikiLink {
  sourcePath: string;
  targetTitle: string;
  targetPath: string | null;
  alias?: string;
  isResolved: boolean;
}

const WIKILINK_REGEX = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

function parseWikilink(linkText: string): WikiLink | null {
  const match = linkText.match(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/);
  if (!match) return null;
  const [, targetTitle, , alias] = match;
  return {
    sourcePath: '',
    targetTitle: targetTitle.trim(),
    targetPath: null,
    alias: alias?.trim(),
    isResolved: false,
  };
}

export function extractWikilinks(content: string, sourcePath: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  WIKILINK_REGEX.lastIndex = 0;

  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const [, targetTitle, , alias] = match;
    links.push({
      sourcePath,
      targetTitle: targetTitle.trim(),
      targetPath: null,
      alias: alias?.trim(),
      isResolved: false,
    });
  }
  return links;
}

function hasWikilinks(text: string): boolean {
  WIKILINK_REGEX.lastIndex = 0;
  return WIKILINK_REGEX.test(text);
}

export function resolveWikilink(targetTitle: string, allNotePaths: string[]): string | null {
  const normalized = targetTitle.toLowerCase().replace(/\s+/g, '-');

  const exact = allNotePaths.find((p) => {
    const name = p.split('/').pop()?.replace('.md', '').toLowerCase();
    return name === normalized;
  });
  if (exact) return exact;

  const fuzzy = allNotePaths.find((p) => {
    const name = p.split('/').pop()?.replace('.md', '').toLowerCase();
    return name?.includes(normalized);
  });
  return fuzzy ?? null;
}

function isValidWikilink(linkText: string): boolean {
  if (!linkText.startsWith('[[') || !linkText.endsWith(']]')) return false;
  return linkText.slice(2, -2).trim().length > 0;
}

function wikilinkToMarkdown(link: WikiLink, baseUrl = ''): string {
  const display = link.alias ?? link.targetTitle;
  const href = link.targetPath
    ? `${baseUrl}${link.targetPath}`
    : `${baseUrl}${link.targetTitle}.md`;
  return `[${display}](${href})`;
}

function getBacklinks(notePath: string, allLinks: Map<string, WikiLink[]>): WikiLink[] {
  const backlinks: WikiLink[] = [];
  for (const [sourcePath, links] of allLinks.entries()) {
    for (const link of links) {
      if (link.targetPath === notePath) {
        backlinks.push({ ...link, sourcePath });
      }
    }
  }
  return backlinks;
}
