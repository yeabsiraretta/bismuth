/**
 * HTML → Markdown converter.
 * Handles HTML files including exports from Apple Notes, OneNote, Google Keep.
 * Uses DOM parsing for accurate conversion.
 */

import type { ConvertedNote } from '../../types/importer';

/** Convert an HTML string to Markdown. */
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return convertNode(doc.body).trim();
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\n\s+/g, ' ') ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map(convertNode).join('');

  switch (tag) {
    case 'h1': return `\n# ${children.trim()}\n\n`;
    case 'h2': return `\n## ${children.trim()}\n\n`;
    case 'h3': return `\n### ${children.trim()}\n\n`;
    case 'h4': return `\n#### ${children.trim()}\n\n`;
    case 'h5': return `\n##### ${children.trim()}\n\n`;
    case 'h6': return `\n###### ${children.trim()}\n\n`;
    case 'p': return `\n${children.trim()}\n\n`;
    case 'br': return '\n';
    case 'hr': return '\n---\n\n';
    case 'strong':
    case 'b': return `**${children}**`;
    case 'em':
    case 'i': return `*${children}*`;
    case 'u': return `<u>${children}</u>`;
    case 's':
    case 'strike':
    case 'del': return `~~${children}~~`;
    case 'code': return `\`${children}\``;
    case 'pre': return `\n\`\`\`\n${el.textContent?.trim() ?? ''}\n\`\`\`\n\n`;
    case 'blockquote': return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      return href ? `[${children}](${href})` : children;
    }
    case 'img': {
      const src = el.getAttribute('src') ?? '';
      const alt = el.getAttribute('alt') ?? '';
      return `![${alt}](${src})`;
    }
    case 'ul': return `\n${convertList(el, '-')}\n`;
    case 'ol': return `\n${convertList(el, '1.')}\n`;
    case 'li': return children;
    case 'table': return `\n${convertTable(el)}\n\n`;
    case 'sup': return `<sup>${children}</sup>`;
    case 'sub': return `<sub>${children}</sub>`;
    case 'mark': return `==${children}==`;
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'span':
      return children;
    case 'head':
    case 'style':
    case 'script':
      return '';
    default:
      return children;
  }
}

function convertList(el: HTMLElement, marker: string): string {
  const items = Array.from(el.children).filter(c => c.tagName.toLowerCase() === 'li');
  return items.map((li, i) => {
    const bullet = marker === '1.' ? `${i + 1}.` : marker;
    const content = convertNode(li).trim();
    return `${bullet} ${content}`;
  }).join('\n');
}

function convertTable(el: HTMLElement): string {
  const rows = Array.from(el.querySelectorAll('tr'));
  if (rows.length === 0) return '';

  const headerRow = rows[0];
  const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
  const headers = headerCells.map(c => convertNode(c).trim());

  const lines: string[] = [];
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);

  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td'));
    const values = cells.map(c => convertNode(c).trim());
    // Pad to match header length
    while (values.length < headers.length) values.push('');
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/** Extract the title from an HTML document. */
function extractTitle(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Try <title> tag first
  const titleEl = doc.querySelector('title');
  if (titleEl?.textContent?.trim()) return titleEl.textContent.trim();
  // Try first heading
  const h1 = doc.querySelector('h1');
  if (h1?.textContent?.trim()) return h1.textContent.trim();
  return 'Untitled';
}

/** Convert an HTML file (content + filename) into a ConvertedNote. */
export function convertHtmlFile(html: string, fileName: string, sourcePath?: string): ConvertedNote {
  const title = extractTitle(html) || fileName.replace(/\.html?$/i, '');
  const markdown = htmlToMarkdown(html);

  return {
    title: sanitizeTitle(title),
    content: markdown,
    sourcePath,
  };
}

function sanitizeTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}
