import { describe, expect, it } from 'vitest';

import {
  buildCopyContext,
  buildDefaultDisplayText,
  buildOutlineLink,
  buildPdfLink,
  buildPdfLinkWithDisplay,
  colorToRgb,
  createAnnotation,
  findOutlineItemByPage,
  findPdfColor,
  flattenOutline,
  formatPageLabel,
  generatePdfColorCSS,
  parsePageLabels,
  parsePdfLink,
  PRESET_TEMPLATES,
  renderCopyTemplate,
  updateAnnotationColor,
  updateAnnotationComment,
} from '@/hubs/media/services/pdf-service';
import type { PdfOutlineItem } from '@/hubs/media/types/pdf-types';
import { DEFAULT_PDF_HIGHLIGHT_COLORS } from '@/hubs/media/types/pdf-types';

// ── Link generation ──────────────────────────────────────────────────────────

describe('buildPdfLink', () => {
  it('generates basic page link', () => {
    const link = buildPdfLink({ filePath: 'docs/paper.pdf', page: 5 });
    expect(link).toBe('[[docs/paper.pdf#page=5]]');
  });

  it('includes selection params', () => {
    const link = buildPdfLink({
      filePath: 'test.pdf',
      page: 3,
      selection: {
        page: 3,
        startIndex: 4,
        startOffset: 0,
        endIndex: 5,
        endOffset: 20,
        text: 'hello',
      },
    });
    expect(link).toBe('[[test.pdf#page=3&selection=4,0,5,20]]');
  });

  it('includes color param', () => {
    const link = buildPdfLink({ filePath: 'test.pdf', page: 1, colorName: 'Yellow' });
    expect(link).toBe('[[test.pdf#page=1&color=yellow]]');
  });

  it('includes rect param', () => {
    const link = buildPdfLink({
      filePath: 'test.pdf',
      page: 2,
      rect: { page: 2, x: 10.5, y: 20.3, width: 100, height: 50 },
    });
    expect(link).toBe('[[test.pdf#page=2&rect=11,20,100,50]]');
  });
});

describe('buildPdfLinkWithDisplay', () => {
  it('appends display text', () => {
    const link = buildPdfLinkWithDisplay({ filePath: 'test.pdf', page: 1 }, 'Test, page 1');
    expect(link).toBe('[[test.pdf#page=1|Test, page 1]]');
  });
});

describe('buildDefaultDisplayText', () => {
  it('strips .pdf extension', () => {
    expect(buildDefaultDisplayText('research.pdf', 3)).toBe('research, page 3');
  });

  it('handles uppercase extension', () => {
    expect(buildDefaultDisplayText('Paper.PDF', 1)).toBe('Paper, page 1');
  });
});

// ── Link parsing ─────────────────────────────────────────────────────────────

describe('parsePdfLink', () => {
  it('parses basic link', () => {
    const result = parsePdfLink('[[test.pdf#page=5]]');
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe('test.pdf');
    expect(result!.page).toBe(5);
    expect(result!.selection).toBeNull();
    expect(result!.colorName).toBeNull();
  });

  it('parses link with selection', () => {
    const result = parsePdfLink('[[test.pdf#page=3&selection=4,0,5,20]]');
    expect(result!.selection).not.toBeNull();
    expect(result!.selection!.startIndex).toBe(4);
    expect(result!.selection!.endOffset).toBe(20);
  });

  it('parses link with color', () => {
    const result = parsePdfLink('[[test.pdf#page=1&color=red]]');
    expect(result!.colorName).toBe('red');
  });

  it('parses link with display text', () => {
    const result = parsePdfLink('[[test.pdf#page=1|Test, page 1]]');
    expect(result!.page).toBe(1);
  });

  it('parses link with rect', () => {
    const result = parsePdfLink('[[test.pdf#page=2&rect=10,20,100,50]]');
    expect(result!.rect).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('returns null for invalid input', () => {
    expect(parsePdfLink('not a link')).toBeNull();
    expect(parsePdfLink('[[test.pdf]]')).toBeNull();
  });
});

// ── Copy templates ───────────────────────────────────────────────────────────

describe('renderCopyTemplate', () => {
  it('renders simple template', () => {
    const result = renderCopyTemplate('{{text}} — {{link}}', {
      text: 'Hello world',
      link: '[[test.pdf#page=1]]',
      linkWithDisplay: '',
      page: 1,
      pageLabel: '1',
      fileName: 'test.pdf',
      fileTitle: 'test',
      colorName: '',
      color: '',
      callout: '',
    });
    expect(result).toBe('Hello world — [[test.pdf#page=1]]');
  });

  it('preserves unknown placeholders', () => {
    const result = renderCopyTemplate('{{unknown}}', {
      text: '',
      link: '',
      linkWithDisplay: '',
      page: 1,
      pageLabel: '1',
      fileName: '',
      fileTitle: '',
      colorName: '',
      color: '',
      callout: '',
    });
    expect(result).toBe('{{unknown}}');
  });
});

describe('PRESET_TEMPLATES', () => {
  it('has 5 presets', () => {
    expect(PRESET_TEMPLATES).toHaveLength(5);
  });

  it('includes callout template', () => {
    expect(PRESET_TEMPLATES.find((t) => t.name === 'Callout')).toBeTruthy();
  });
});

describe('buildCopyContext', () => {
  it('builds context from params', () => {
    const ctx = buildCopyContext(
      { filePath: 'docs/paper.pdf', page: 3, colorName: 'Yellow' },
      'Selected text'
    );
    expect(ctx.fileName).toBe('paper.pdf');
    expect(ctx.fileTitle).toBe('paper');
    expect(ctx.page).toBe(3);
    expect(ctx.text).toBe('Selected text');
    expect(ctx.colorName).toBe('Yellow');
    expect(ctx.link).toContain('page=3');
    expect(ctx.linkWithDisplay).toContain('paper, page 3');
    expect(ctx.callout).toContain('[!PDF|Yellow]');
  });

  it('builds callout without color', () => {
    const ctx = buildCopyContext({ filePath: 'test.pdf', page: 1 }, 'Text');
    expect(ctx.callout).toContain('[!PDF]');
    expect(ctx.colorName).toBe('');
  });
});

// ── Annotations ──────────────────────────────────────────────────────────────

describe('createAnnotation', () => {
  it('creates annotation with UUID', () => {
    const a = createAnnotation('highlight', 1, 'text', '#ff0000', 'Red');
    expect(a.id).toBeTruthy();
    expect(a.type).toBe('highlight');
    expect(a.page).toBe(1);
    expect(a.color).toBe('#ff0000');
    expect(a.colorName).toBe('Red');
    expect(a.text).toBe('text');
    expect(a.createdAt).toBeGreaterThan(0);
  });
});

describe('updateAnnotationComment', () => {
  it('updates comment and timestamp', () => {
    const a = createAnnotation('highlight', 1, 'text', '#ff0000', 'Red');
    const updated = updateAnnotationComment(a, 'My note');
    expect(updated.comment).toBe('My note');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(a.updatedAt);
    expect(updated.id).toBe(a.id);
  });
});

describe('updateAnnotationColor', () => {
  it('changes color and name', () => {
    const a = createAnnotation('highlight', 1, 'text', '#ff0000', 'Red');
    const updated = updateAnnotationColor(a, '#00ff00', 'Green');
    expect(updated.color).toBe('#00ff00');
    expect(updated.colorName).toBe('Green');
  });
});

// ── Color helpers ────────────────────────────────────────────────────────────

describe('findPdfColor', () => {
  it('finds by case-insensitive name', () => {
    const c = findPdfColor('yellow');
    expect(c).toBeTruthy();
    expect(c!.color).toBe('#ffd400');
  });

  it('returns undefined for unknown', () => {
    expect(findPdfColor('nonexistent')).toBeUndefined();
  });
});

describe('colorToRgb', () => {
  it('converts hex to rgb tuple', () => {
    expect(colorToRgb('#ff0000')).toBe('255, 0, 0');
    expect(colorToRgb('#00ff00')).toBe('0, 255, 0');
    expect(colorToRgb('#0000ff')).toBe('0, 0, 255');
  });
});

describe('generatePdfColorCSS', () => {
  it('generates CSS variable declarations', () => {
    const css = generatePdfColorCSS(DEFAULT_PDF_HIGHLIGHT_COLORS);
    expect(css).toContain('--pdf-plus-yellow-rgb');
    expect(css).toContain('--pdf-plus-red-rgb');
    expect(css).toContain('--pdf-plus-blue-rgb');
  });
});

// ── Outline helpers ──────────────────────────────────────────────────────────

describe('flattenOutline', () => {
  const outline: PdfOutlineItem[] = [
    {
      title: 'Chapter 1',
      page: 1,
      dest: null,
      level: 0,
      children: [
        { title: 'Section 1.1', page: 2, dest: null, level: 1, children: [] },
        { title: 'Section 1.2', page: 5, dest: null, level: 1, children: [] },
      ],
    },
    { title: 'Chapter 2', page: 10, dest: null, level: 0, children: [] },
  ];

  it('flattens nested outline', () => {
    const flat = flattenOutline(outline);
    expect(flat).toHaveLength(4);
    expect(flat[0].title).toBe('Chapter 1');
    expect(flat[1].title).toBe('Section 1.1');
    expect(flat[3].title).toBe('Chapter 2');
  });
});

describe('findOutlineItemByPage', () => {
  const outline: PdfOutlineItem[] = [
    { title: 'Intro', page: 1, dest: null, level: 0, children: [] },
    { title: 'Body', page: 5, dest: null, level: 0, children: [] },
    { title: 'End', page: 20, dest: null, level: 0, children: [] },
  ];

  it('finds item for exact page', () => {
    expect(findOutlineItemByPage(outline, 5)?.title).toBe('Body');
  });

  it('finds nearest preceding item', () => {
    expect(findOutlineItemByPage(outline, 7)?.title).toBe('Body');
  });

  it('returns null for page before all items', () => {
    expect(findOutlineItemByPage(outline, 0)).toBeNull();
  });
});

describe('buildOutlineLink', () => {
  it('generates wikilink', () => {
    const link = buildOutlineLink('test.pdf', {
      title: 'Chapter 1',
      page: 5,
      dest: null,
      level: 0,
      children: [],
    });
    expect(link).toBe('[[test.pdf#page=5|Chapter 1]]');
  });
});

// ── Page label helpers ───────────────────────────────────────────────────────

describe('formatPageLabel', () => {
  it('returns number as string by default', () => {
    expect(formatPageLabel(5)).toBe('5');
  });

  it('uses custom label when provided', () => {
    const labels = new Map([[5, 'v']]);
    expect(formatPageLabel(5, labels)).toBe('v');
  });
});

describe('parsePageLabels', () => {
  it('converts 0-indexed to 1-indexed', () => {
    const map = parsePageLabels([
      { pageIndex: 0, label: 'i' },
      { pageIndex: 4, label: '1' },
    ]);
    expect(map.get(1)).toBe('i');
    expect(map.get(5)).toBe('1');
  });
});
