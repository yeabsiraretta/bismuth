/**
 * Contextual Typography service.
 *
 * Inspired by obsidian-contextual-typography and Gutenberg typography:
 * http://matejlatin.github.io/Gutenberg/
 *
 * Adds `data-tag-name` attributes to top-level block wrapper divs,
 * enabling CSS selectors like:
 *   div[data-tag-name="h1"] + div > h2 { margin-top: 1.89rem; }
 *
 * This service does NOT add any styles itself — it only enables
 * contextual styling via data attributes.
 */

/** Block-level tag names that receive data-tag-name attributes. */
const BLOCK_TAGS = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'PRE',
  'TABLE',
  'HR',
  'DIV',
  'FIGURE',
  'DL',
  'DETAILS',
  'SECTION',
  'ARTICLE',
]);

/**
 * Post-process a preview container to wrap each top-level element
 * in a `<div data-tag-name="tagname">` wrapper.
 *
 * Idempotent: skips elements already wrapped.
 */
export function applyContextualTypography(container: HTMLElement): void {
  const children = Array.from(container.children) as HTMLElement[];

  for (const child of children) {
    // Skip already-wrapped elements
    if (child.hasAttribute('data-tag-name')) continue;
    if (child.parentElement !== container) continue;

    const tagName = child.tagName.toLowerCase();

    if (BLOCK_TAGS.has(child.tagName)) {
      // Wrap in a div with data-tag-name
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-tag-name', tagName);
      container.insertBefore(wrapper, child);
      wrapper.appendChild(child);
    }
  }
}

/**
 * Remove contextual typography wrappers from a container.
 * Useful when toggling the feature off.
 */
export function removeContextualTypography(container: HTMLElement): void {
  const wrappers = container.querySelectorAll('div[data-tag-name]');
  for (const wrapper of wrappers) {
    const child = wrapper.firstElementChild;
    if (child && wrapper.parentElement) {
      wrapper.parentElement.insertBefore(child, wrapper);
      wrapper.remove();
    }
  }
}

/**
 * Detect the block-level tag name for a markdown line in the editor.
 * Used by the live preview to add data-tag-name attributes to cm-line divs.
 *
 * Returns null for lines that don't represent a standalone block element
 * (e.g. continuation lines within a list or blockquote).
 */
export function detectLineTagName(text: string): string | null {
  // Heading
  const headingMatch = text.match(/^(#{1,6})\s/);
  if (headingMatch) return `h${headingMatch[1].length}`;

  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(text)) return 'hr';

  // Blockquote
  if (/^>\s?/.test(text)) return 'blockquote';

  // Unordered list item
  if (/^\s*[-*+]\s/.test(text)) return 'ul';

  // Ordered list item
  if (/^\s*\d+\.\s/.test(text)) return 'ol';

  // Fenced code block delimiter
  if (/^(`{3,}|~{3,})/.test(text)) return 'pre';

  // Table row
  if (text.trimStart().startsWith('|')) return 'table';

  // Image (standalone)
  if (/^!\[/.test(text)) return 'figure';

  // Non-empty text → paragraph
  if (text.trim().length > 0) return 'p';

  return null;
}
