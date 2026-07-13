const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'i',
  'em',
  'strong',
  'a',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'cite',
  'hr',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'del',
  'ins',
  'sub',
  'sup',
  'mark',
  'input',
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clippath',
  'use',
  'marker',
  'foreignobject',
  'style',
]);

const ALLOWED_ATTRS = new Set([
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'target',
  'rel',
  'width',
  'height',
  'type',
  'checked',
  'disabled',
  'viewbox',
  'xmlns',
  'fill',
  'stroke',
  'stroke-width',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'style',
  'clip-path',
  'marker-end',
  'marker-start',
  'text-anchor',
  'dominant-baseline',
  'font-size',
  'font-family',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stroke-dasharray',
  'aria-roledescription',
  'role',
]);

const DANGEROUS_URL_RE = /^\s*(javascript|vbscript|data):/i;

export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        el.replaceWith(...Array.from(el.childNodes));
        continue;
      }

      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (
          attr.name.startsWith('on') ||
          (!ALLOWED_ATTRS.has(attr.name) && !attr.name.startsWith('data-'))
        ) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (attr.name === 'href' || attr.name === 'src') {
          if (DANGEROUS_URL_RE.test(attr.value)) {
            el.removeAttribute(attr.name);
          }
        }
      }

      sanitizeNode(el);
    }
  }
}
