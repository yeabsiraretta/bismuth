/**
 * Review Frontmatter — extract creation dates and previews from note files.
 * Prefers frontmatter `created` field; falls back to file metadata.
 * Ensures all notes have proper frontmatter for review.
 */

// ─── Frontmatter parsing ────────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

/** Extract frontmatter key-value pairs from markdown */
export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^\s*([a-zA-Z_-]+)\s*:\s*(.+?)\s*$/);
    if (kv) result[kv[1]] = kv[2];
  }
  return result;
}

/** Extract the body content (after frontmatter) from markdown */
export function extractBody(content: string): string {
  const match = content.match(FRONTMATTER_RE);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

/** Extract creation date from frontmatter or return null */
export function extractCreatedDate(
  content: string,
  createdField: string = 'created'
): string | null {
  const fm = parseFrontmatter(content);
  const raw = fm[createdField];
  if (!raw) return null;

  // Strip quotes and try to parse
  const cleaned = raw.replace(/^["']|["']$/g, '');
  const parsed = parseFlexibleDate(cleaned);
  return parsed;
}

/** Parse various date formats into YYYY-MM-DD */
export function parseFlexibleDate(input: string): string | null {
  // YYYY-MM-DD
  const iso = input.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  // YYYY-MM-DDTHH:MM:SS (ISO with time)
  const isoFull = input.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoFull) return isoFull[1];

  // DD/MM/YYYY or MM/DD/YYYY — assume YYYY-MM-DD is preferred
  const slashed = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashed) {
    const [, a, b, year] = slashed;
    const month = parseInt(a, 10) > 12 ? b : a;
    const day = parseInt(a, 10) > 12 ? a : b;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try native Date parse as last resort
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

// ─── Preview extraction ─────────────────────────────────────────────────────

/** Extract plain text preview from markdown body */
export function extractPreview(content: string, maxLength: number = 200): string {
  const body = extractBody(content);

  let text = body
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/!\[\[[^\]]+\]\]/g, '')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, path, alias) => alias || path)
    // Remove bold/italic markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove list markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove task markers
    .replace(/^- \[[ x]\]\s*/gm, '')
    // Collapse whitespace
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  return text;
}

// ─── Tags extraction ────────────────────────────────────────────────────────

/** Extract tags from frontmatter */
export function extractTags(content: string): string[] {
  const fm = parseFrontmatter(content);
  const tagsRaw = fm['tags'];
  if (!tagsRaw) return [];

  // YAML array: [tag1, tag2]
  const arrayMatch = tagsRaw.match(/^\[(.+)\]$/);
  if (arrayMatch) {
    return arrayMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));
  }

  // Comma-separated
  return tagsRaw.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));
}

// ─── Title extraction ───────────────────────────────────────────────────────

/** Extract note title from frontmatter or first heading or filename */
export function extractTitle(content: string, filePath: string): string {
  // From frontmatter
  const fm = parseFrontmatter(content);
  if (fm['title']) return fm['title'].replace(/^["']|["']$/g, '');

  // From first heading
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();

  // From filename
  const filename = filePath.split('/').pop() ?? filePath;
  return filename.replace(/\.[^.]+$/, '');
}

// ─── Frontmatter generation ─────────────────────────────────────────────────

/** Generate frontmatter block with creation date for a new file */
export function generateCreatedFrontmatter(createdField: string = 'created', date?: Date): string {
  const d = date ?? new Date();
  const iso = d.toISOString().slice(0, 10);
  return `---\n${createdField}: ${iso}\n---\n`;
}

/** Ensure a note has a creation date in frontmatter. Returns updated content. */
export function ensureCreatedField(
  content: string,
  createdField: string = 'created',
  date?: string
): string {
  const fm = parseFrontmatter(content);

  // Already has creation date
  if (fm[createdField]) return content;

  const isoDate = date ?? new Date().toISOString().slice(0, 10);
  const match = content.match(FRONTMATTER_RE);

  if (match) {
    // Add field to existing frontmatter
    const existingYaml = match[1];
    const newYaml = `${existingYaml}\n${createdField}: ${isoDate}`;
    return content.replace(FRONTMATTER_RE, `---\n${newYaml}\n---`);
  }

  // No frontmatter — prepend it
  return `---\n${createdField}: ${isoDate}\n---\n\n${content}`;
}

/** Get file extension from path */
export function getFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return ext;
}
