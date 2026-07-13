export interface NoteMetadata {
  title: string;
  tags: string[];
  aliases: string[];
  created: string;
  modified: string;
  custom: Record<string, unknown>;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

function parseYamlLike(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentList: string[] | null = null;

  for (const line of lines) {
    const listMatch = line.match(/^\s+-\s+(.*)/);
    if (listMatch && currentKey) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1].trim());
      continue;
    }

    if (currentKey && currentList) {
      result[currentKey] = currentList;
      currentList = null;
    }

    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value === '') {
        currentList = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        result[currentKey] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''));
      } else {
        result[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  if (currentKey && currentList) {
    result[currentKey] = currentList;
  }

  return result;
}

export function extractMetadata(content: string): NoteMetadata {
  const meta: NoteMetadata = {
    title: '',
    tags: [],
    aliases: [],
    created: '',
    modified: '',
    custom: {},
  };

  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch) {
    const h1Match = content.match(/^#\s+(.+)/m);
    if (h1Match) meta.title = h1Match[1].trim();
    return meta;
  }

  const parsed = parseYamlLike(fmMatch[1]);
  meta.title = String(parsed['title'] ?? '');
  meta.created = String(parsed['created'] ?? parsed['date'] ?? '');
  meta.modified = String(parsed['modified'] ?? parsed['updated'] ?? '');

  const tags = parsed['tags'];
  if (Array.isArray(tags)) {
    meta.tags = tags.map(String);
  } else if (typeof tags === 'string') {
    meta.tags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const aliases = parsed['aliases'];
  if (Array.isArray(aliases)) {
    meta.aliases = aliases.map(String);
  } else if (typeof aliases === 'string') {
    meta.aliases = [aliases];
  }

  const knownKeys = new Set(['title', 'tags', 'aliases', 'created', 'date', 'modified', 'updated']);
  for (const [k, v] of Object.entries(parsed)) {
    if (!knownKeys.has(k)) meta.custom[k] = v;
  }

  if (!meta.title) {
    const h1Match = content.match(/^#\s+(.+)/m);
    if (h1Match) meta.title = h1Match[1].trim();
  }

  return meta;
}

export function buildFrontmatter(meta: NoteMetadata): string {
  const lines: string[] = ['---'];
  if (meta.title) lines.push(`title: "${meta.title}"`);
  if (meta.tags.length) lines.push(`tags: [${meta.tags.join(', ')}]`);
  if (meta.aliases.length) lines.push(`aliases: [${meta.aliases.join(', ')}]`);
  if (meta.created) lines.push(`created: ${meta.created}`);
  if (meta.modified) lines.push(`modified: ${meta.modified}`);
  for (const [k, v] of Object.entries(meta.custom)) {
    lines.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}
