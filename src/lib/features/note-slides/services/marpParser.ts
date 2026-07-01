/**
 * Marp Parser — extracts slides from markdown notes with `marp: true`
 * frontmatter and `---` slide separators.
 *
 * Handles:
 * - Frontmatter extraction (YAML between ---)
 * - Slide splitting on horizontal rules (---)
 * - Per-slide directives (<!-- directive: value -->)
 * - Speaker notes (<!-- notes content -->)
 * - Image path resolution (wikilinks + commonmark)
 */
import type { MarpSlide, MarpPresentation, MarpDirectives } from '../types/marp';
import { DEFAULT_DIRECTIVES } from '../types/marp';

// ─── Frontmatter ─────────────────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

/** Extract YAML frontmatter as key-value pairs */
export function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: {}, body: markdown };

  const yamlStr = match[1];
  const body = markdown.slice(match[0].length).trimStart();
  const frontmatter: Record<string, unknown> = {};

  for (const line of yamlStr.split('\n')) {
    const kv = line.match(/^\s*([a-zA-Z_-]+)\s*:\s*(.+?)\s*$/);
    if (kv) {
      const key = kv[1];
      let value: unknown = kv[2];
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (/^\d+$/.test(value as string)) value = parseInt(value as string, 10);
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/** Check if a note is a Marp presentation */
export function isMarpNote(markdown: string): boolean {
  const { frontmatter } = parseFrontmatter(markdown);
  return frontmatter['marp'] === true;
}

/** Extract global Marp directives from frontmatter */
export function extractDirectives(frontmatter: Record<string, unknown>): MarpDirectives {
  const d = { ...DEFAULT_DIRECTIVES };
  if (typeof frontmatter['theme'] === 'string') d.theme = frontmatter['theme'];
  if (typeof frontmatter['paginate'] === 'boolean') d.paginate = frontmatter['paginate'];
  if (typeof frontmatter['header'] === 'string') d.header = frontmatter['header'];
  if (typeof frontmatter['footer'] === 'string') d.footer = frontmatter['footer'];
  if (typeof frontmatter['class'] === 'string') d.class = frontmatter['class'];
  if (typeof frontmatter['backgroundColor'] === 'string') d.backgroundColor = frontmatter['backgroundColor'];
  if (typeof frontmatter['backgroundImage'] === 'string') d.backgroundImage = frontmatter['backgroundImage'];
  if (typeof frontmatter['color'] === 'string') d.color = frontmatter['color'];
  if (typeof frontmatter['size'] === 'string') d.size = frontmatter['size'];
  if (typeof frontmatter['transition'] === 'string') d.transition = frontmatter['transition'];
  if (typeof frontmatter['math'] === 'string') d.math = frontmatter['math'];
  if (typeof frontmatter['style'] === 'string') d.style = frontmatter['style'];
  return d;
}

// ─── Slide splitting ─────────────────────────────────────────────────────────

/** Split body into slide content strings on `---` separators */
export function splitSlides(body: string): string[] {
  // Split on lines that are exactly `---` (horizontal rule as slide separator)
  // But not code block fences
  const lines = body.split('\n');
  const slides: string[] = [];
  let current: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) inCodeBlock = !inCodeBlock;

    if (!inCodeBlock && /^---\s*$/.test(line)) {
      slides.push(current.join('\n'));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0 || slides.length > 0) {
    slides.push(current.join('\n'));
  }

  return slides.filter(s => s.trim().length > 0 || slides.length === 1);
}

// ─── Per-slide directives & speaker notes ────────────────────────────────────

const DIRECTIVE_RE = /<!--\s*(\w+)\s*:\s*(.+?)\s*-->/g;
const SPEAKER_NOTES_RE = /<!--\s*(?:notes?)\s*\n([\s\S]*?)-->/gi;

/** Extract per-slide directives from HTML comments */
export function extractSlideDirectives(content: string): Record<string, string> {
  const directives: Record<string, string> = {};
  let match;
  const re = new RegExp(DIRECTIVE_RE.source, 'g');
  while ((match = re.exec(content)) !== null) {
    const key = match[1].toLowerCase();
    // Skip "note" / "notes" — those are speaker notes
    if (key !== 'note' && key !== 'notes') {
      directives[key] = match[2];
    }
  }
  return directives;
}

/** Extract speaker notes from <!-- note(s) ... --> comments */
export function extractSpeakerNotes(content: string): string {
  const notes: string[] = [];
  let match;
  const re = new RegExp(SPEAKER_NOTES_RE.source, 'gi');
  while ((match = re.exec(content)) !== null) {
    notes.push(match[1].trim());
  }
  return notes.join('\n');
}

// ─── Image embedding ─────────────────────────────────────────────────────────

/** Convert wikilink images to commonmark: ![[path]] → ![](path) */
export function resolveWikilinks(content: string): string {
  return content.replace(/!\[\[([^\]]+)\]\]/g, (_m, path: string) => {
    return `![](${encodeURI(path.trim())})`;
  });
}

// ─── Simple markdown → HTML ──────────────────────────────────────────────────

/** Basic markdown to HTML conversion for slide rendering */
export function markdownToHtml(md: string): string {
  let html = md;
  // Remove speaker notes comments
  html = html.replace(/<!--\s*notes?\s*\n[\s\S]*?-->/gi, '');
  // Remove directive comments
  html = html.replace(/<!--\s*\w+\s*:\s*.+?\s*-->/g, '');
  // Resolve wikilinks
  html = resolveWikilinks(html);

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>');

  // Paragraphs (non-empty lines not already wrapped)
  html = html.replace(/^(?!<[hulo]|<img|<a|<li|<code|<strong|<em|\s*$)(.+)$/gm, '<p>$1</p>');

  return html.trim();
}

// ─── Full parser ─────────────────────────────────────────────────────────────

/** Parse a full markdown note into a MarpPresentation */
export function parseMarpPresentation(
  markdown: string,
  notePath: string = '',
): MarpPresentation | null {
  const { frontmatter, body } = parseFrontmatter(markdown);
  if (frontmatter['marp'] !== true) return null;

  const globalDirectives = extractDirectives(frontmatter);
  const slideTexts = splitSlides(body);

  const slides: MarpSlide[] = slideTexts.map((content, index) => {
    const directives = extractSlideDirectives(content);
    const speakerNotes = extractSpeakerNotes(content);
    const html = markdownToHtml(content);

    return {
      index,
      content: content.trim(),
      html,
      directives,
      speakerNotes,
      transition: directives['transition'] ?? (globalDirectives.transition || undefined),
    };
  });

  return {
    notePath,
    globalDirectives,
    slides,
    themeCss: globalDirectives.style || '',
    frontmatter,
  };
}
