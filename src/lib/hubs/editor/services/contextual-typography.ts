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

export function applyContextualTypography(container: HTMLElement): void {
  const children = Array.from(container.children) as HTMLElement[];

  for (const child of children) {
    if (child.hasAttribute('data-tag-name')) continue;
    if (child.parentElement !== container) continue;

    const tagName = child.tagName.toLowerCase();

    if (BLOCK_TAGS.has(child.tagName)) {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-tag-name', tagName);
      container.insertBefore(wrapper, child);
      wrapper.appendChild(child);
    }
  }
}

function removeContextualTypography(container: HTMLElement): void {
  const wrappers = container.querySelectorAll('div[data-tag-name]');
  for (const wrapper of wrappers) {
    const child = wrapper.firstElementChild;
    if (child && wrapper.parentElement) {
      wrapper.parentElement.insertBefore(child, wrapper);
      wrapper.remove();
    }
  }
}

export function detectLineTagName(text: string): string | null {
  const headingMatch = text.match(/^(#{1,6})\s/);
  if (headingMatch) return `h${headingMatch[1].length}`;

  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(text)) return 'hr';
  if (/^>\s?/.test(text)) return 'blockquote';
  if (/^\s*[-*+]\s/.test(text)) return 'ul';
  if (/^\s*\d+\.\s/.test(text)) return 'ol';
  if (/^(`{3,}|~{3,})/.test(text)) return 'pre';
  if (text.trimStart().startsWith('|')) return 'table';
  if (/^!\[/.test(text)) return 'figure';
  if (text.trim().length > 0) return 'p';

  return null;
}
