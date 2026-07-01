import { describe, it, expect } from 'vitest';
import {
  flattenOutline, findOutlineForPage, outlineToLink,
} from '../services/pdfOutlineService';
import type { PDFOutlineItem } from '../types';

const OUTLINE: PDFOutlineItem[] = [
  {
    title: 'Chapter 1',
    page: 1,
    level: 0,
    children: [
      { title: 'Section 1.1', page: 3, level: 1, children: [] },
      { title: 'Section 1.2', page: 8, level: 1, children: [] },
    ],
  },
  {
    title: 'Chapter 2',
    page: 15,
    level: 0,
    children: [
      { title: 'Section 2.1', page: 16, level: 1, children: [] },
    ],
  },
  {
    title: 'Appendix',
    page: 30,
    level: 0,
    children: [],
  },
];

describe('flattenOutline', () => {
  it('flattens hierarchical outline to linear list', () => {
    const flat = flattenOutline(OUTLINE);
    expect(flat).toHaveLength(6);
    expect(flat[0].title).toBe('Chapter 1');
    expect(flat[1].title).toBe('Section 1.1');
    expect(flat[2].title).toBe('Section 1.2');
    expect(flat[3].title).toBe('Chapter 2');
    expect(flat[5].title).toBe('Appendix');
  });

  it('handles empty outline', () => {
    expect(flattenOutline([])).toHaveLength(0);
  });
});

describe('findOutlineForPage', () => {
  it('finds chapter for page 1', () => {
    const item = findOutlineForPage(OUTLINE, 1);
    expect(item).not.toBeNull();
    expect(item!.title).toBe('Chapter 1');
  });

  it('finds section for page 5 (between 1.1 and 1.2)', () => {
    const item = findOutlineForPage(OUTLINE, 5);
    expect(item).not.toBeNull();
    expect(item!.title).toBe('Section 1.1');
  });

  it('finds section for page 8 exactly', () => {
    const item = findOutlineForPage(OUTLINE, 8);
    expect(item!.title).toBe('Section 1.2');
  });

  it('finds section for page 20 (in Chapter 2)', () => {
    const item = findOutlineForPage(OUTLINE, 20);
    expect(item!.title).toBe('Section 2.1');
  });

  it('finds appendix for page 35', () => {
    const item = findOutlineForPage(OUTLINE, 35);
    expect(item!.title).toBe('Appendix');
  });

  it('returns null for empty outline', () => {
    expect(findOutlineForPage([], 5)).toBeNull();
  });
});

describe('outlineToLink', () => {
  it('generates Obsidian-style link from outline item', () => {
    const link = outlineToLink('docs/paper.pdf', OUTLINE[0]);
    expect(link).toBe('[[docs/paper.pdf#page=1|paper, Chapter 1]]');
  });
});
