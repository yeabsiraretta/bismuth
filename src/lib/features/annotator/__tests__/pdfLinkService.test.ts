import { describe, it, expect } from 'vitest';
import {
  parsePdfLink,
  findPdfLinks,
  renderCopyTemplate,
  generatePdfLink,
} from '../services/pdfLinkService';
import type { LinkTemplateVars } from '../services/pdfLinkService';
import { DEFAULT_PDF_PLUS_CONFIG } from '../types';

describe('parsePdfLink', () => {
  it('parses a full PDF link with all params', () => {
    const link = '[[notes/paper.pdf#page=3&selection=4,0,5,20&color=red|Paper, page 3]]';
    const result = parsePdfLink(link);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe('notes/paper.pdf');
    expect(result!.page).toBe(3);
    expect(result!.selection).toEqual({ startLine: 4, startChar: 0, endLine: 5, endChar: 20 });
    expect(result!.color).toBe('red');
    expect(result!.displayText).toBe('Paper, page 3');
  });

  it('parses a minimal PDF link with page only', () => {
    const link = '[[file.pdf#page=1]]';
    const result = parsePdfLink(link);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe('file.pdf');
    expect(result!.page).toBe(1);
    expect(result!.selection).toBeUndefined();
    expect(result!.color).toBeUndefined();
  });

  it('handles case-insensitive color names', () => {
    const link = '[[file.pdf#page=1&color=BLUE]]';
    const result = parsePdfLink(link);
    expect(result!.color).toBe('blue');
  });

  it('parses rect parameter', () => {
    const link = '[[file.pdf#page=2&rect=10,20,100,50]]';
    const result = parsePdfLink(link);
    expect(result!.rect).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('returns null for non-PDF links', () => {
    expect(parsePdfLink('[[note.md]]')).toBeNull();
    expect(parsePdfLink('just text')).toBeNull();
    expect(parsePdfLink('')).toBeNull();
  });

  it('returns null for invalid page numbers', () => {
    expect(parsePdfLink('[[file.pdf#page=0]]')).toBeNull();
    expect(parsePdfLink('[[file.pdf#page=abc]]')).toBeNull();
  });
});

describe('findPdfLinks', () => {
  it('finds multiple PDF links in markdown', () => {
    const md = `
See [[paper.pdf#page=1&color=yellow|Paper]] for details.
Also check [[thesis.pdf#page=42&selection=1,0,2,30|Thesis, p42]].
And [[notes.md]] is not a PDF link.
    `;
    const links = findPdfLinks(md);
    expect(links).toHaveLength(2);
    expect(links[0].filePath).toBe('paper.pdf');
    expect(links[1].filePath).toBe('thesis.pdf');
    expect(links[1].page).toBe(42);
  });

  it('returns empty for no PDF links', () => {
    expect(findPdfLinks('no links here')).toHaveLength(0);
  });
});

describe('renderCopyTemplate', () => {
  it('replaces template variables', () => {
    const vars: LinkTemplateVars = {
      filePath: 'path/file.pdf',
      fileName: 'file',
      page: 5,
      selection: '1,2,3,4',
      color: 'green',
      text: 'selected text',
      displayText: 'file, page 5',
    };
    const template = '[[{{filePath}}#page={{page}}&color={{color}}|{{displayText}}]]';
    const result = renderCopyTemplate(template, vars);
    expect(result).toBe('[[path/file.pdf#page=5&color=green|file, page 5]]');
  });

  it('handles missing variables gracefully', () => {
    const result = renderCopyTemplate('{{missing}}', {} as LinkTemplateVars);
    expect(result).toBe('');
  });
});

describe('generatePdfLink', () => {
  it('generates a link using default config', () => {
    const link = generatePdfLink(
      'docs/paper.pdf',
      3,
      'hello world',
      null,
      'yellow',
      DEFAULT_PDF_PLUS_CONFIG
    );
    expect(link).toContain('docs/paper.pdf');
    expect(link).toContain('page=3');
    expect(link).toContain('color=yellow');
    expect(link).toContain('paper, page 3');
  });

  it('includes selection coordinates when provided', () => {
    const link = generatePdfLink(
      'file.pdf',
      1,
      'text',
      { startLine: 0, startChar: 5, endLine: 2, endChar: 10 },
      'red',
      DEFAULT_PDF_PLUS_CONFIG
    );
    expect(link).toContain('selection=0,5,2,10');
  });
});
