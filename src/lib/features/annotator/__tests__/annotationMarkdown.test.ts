import { describe, it, expect } from 'vitest';
import {
  serializeAnnotations,
  deserializeAnnotations,
  resolveTargetType,
} from '../services/annotationMarkdown';
import type { DocumentAnnotation } from '../types';

describe('resolveTargetType', () => {
  it('returns explicit type when provided', () => {
    expect(resolveTargetType('file.txt', 'pdf')).toBe('pdf');
    expect(resolveTargetType('file.txt', 'epub')).toBe('epub');
  });

  it('detects PDF from extension', () => {
    expect(resolveTargetType('papers/arxiv.pdf')).toBe('pdf');
    expect(resolveTargetType('DOCUMENT.PDF')).toBe('pdf');
  });

  it('detects EPUB from extension', () => {
    expect(resolveTargetType('books/novel.epub')).toBe('epub');
    expect(resolveTargetType('BOOK.EPUB')).toBe('epub');
  });

  it('defaults to PDF for unknown extensions', () => {
    expect(resolveTargetType('file.txt')).toBe('pdf');
    expect(resolveTargetType('https://example.com/doc')).toBe('pdf');
  });
});

describe('serializeAnnotations', () => {
  const sampleAnnotation: DocumentAnnotation = {
    id: 'ann-001',
    target: 'papers/test.pdf',
    targetType: 'pdf',
    page: 5,
    quoteSelector: {
      exact: 'important text here',
      prefix: 'some context before',
      suffix: 'some context after',
    },
    color: 'yellow',
    comment: 'This is a key insight',
    tags: ['research', 'important'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('generates valid frontmatter', () => {
    const output = serializeAnnotations('papers/test.pdf', 'pdf', []);
    expect(output).toContain('---');
    expect(output).toContain('annotation-target: papers/test.pdf');
    expect(output).toContain('annotation-target-type: pdf');
  });

  it('serializes an annotation as a blockquote', () => {
    const output = serializeAnnotations('papers/test.pdf', 'pdf', [sampleAnnotation]);
    expect(output).toContain('> [!annotation] (Page 5)');
    expect(output).toContain('> **HIGHLIGHT**: ==important text here== [yellow]');
    expect(output).toContain('> **PREFIX**: some context before');
    expect(output).toContain('> **POSTFIX**: some context after');
    expect(output).toContain('> **COMMENT**: This is a key insight');
    expect(output).toContain('> **TAGS**: #research, #important');
    expect(output).toContain('> ^ann-001');
  });

  it('omits empty prefix/suffix/comment/tags', () => {
    const minimal: DocumentAnnotation = {
      ...sampleAnnotation,
      quoteSelector: { exact: 'test', prefix: '', suffix: '' },
      comment: '',
      tags: [],
    };
    const output = serializeAnnotations('test.pdf', 'pdf', [minimal]);
    expect(output).not.toContain('PREFIX');
    expect(output).not.toContain('POSTFIX');
    expect(output).not.toContain('COMMENT');
    expect(output).not.toContain('TAGS');
  });

  it('sorts annotations by page number', () => {
    const ann1: DocumentAnnotation = { ...sampleAnnotation, id: 'ann-a', page: 10 };
    const ann2: DocumentAnnotation = { ...sampleAnnotation, id: 'ann-b', page: 2 };
    const output = serializeAnnotations('test.pdf', 'pdf', [ann1, ann2]);
    const idxPage2 = output.indexOf('Page 2');
    const idxPage10 = output.indexOf('Page 10');
    expect(idxPage2).toBeLessThan(idxPage10);
  });
});

describe('deserializeAnnotations', () => {
  const markdown = `---
annotation-target: papers/test.pdf
annotation-target-type: pdf
---

> [!annotation] (Page 5)
> **PREFIX**: some context before
> **HIGHLIGHT**: ==important text here== [yellow]
> **POSTFIX**: some context after
> **COMMENT**: This is a key insight
> **TAGS**: #research, #important
> ^ann-001

> [!annotation] (Page 12)
> **HIGHLIGHT**: ==another highlight== [blue]
> ^ann-002`;

  it('extracts target from frontmatter', () => {
    const result = deserializeAnnotations(markdown);
    expect(result.target).toBe('papers/test.pdf');
    expect(result.targetType).toBe('pdf');
  });

  it('parses all annotations', () => {
    const result = deserializeAnnotations(markdown);
    expect(result.annotations).toHaveLength(2);
  });

  it('parses first annotation correctly', () => {
    const result = deserializeAnnotations(markdown);
    const ann = result.annotations[0];
    expect(ann.id).toBe('ann-001');
    expect(ann.page).toBe(5);
    expect(ann.quoteSelector.exact).toBe('important text here');
    expect(ann.quoteSelector.prefix).toBe('some context before');
    expect(ann.quoteSelector.suffix).toBe('some context after');
    expect(ann.color).toBe('yellow');
    expect(ann.comment).toBe('This is a key insight');
    expect(ann.tags).toEqual(['research', 'important']);
  });

  it('parses second annotation correctly', () => {
    const result = deserializeAnnotations(markdown);
    const ann = result.annotations[1];
    expect(ann.id).toBe('ann-002');
    expect(ann.page).toBe(12);
    expect(ann.quoteSelector.exact).toBe('another highlight');
    expect(ann.color).toBe('blue');
  });

  it('handles empty content', () => {
    const result = deserializeAnnotations('');
    expect(result.target).toBe('');
    expect(result.annotations).toHaveLength(0);
  });

  it('handles missing frontmatter', () => {
    const result = deserializeAnnotations('some plain text');
    expect(result.target).toBe('');
  });

  it('roundtrips through serialize/deserialize', () => {
    const ann: DocumentAnnotation = {
      id: 'ann-roundtrip',
      target: 'doc.pdf',
      targetType: 'pdf',
      page: 3,
      quoteSelector: { exact: 'roundtrip test', prefix: 'before', suffix: 'after' },
      color: 'green',
      comment: 'Test comment',
      tags: ['tag1'],
      createdAt: '2024-06-01T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z',
    };

    const serialized = serializeAnnotations('doc.pdf', 'pdf', [ann]);
    const { annotations } = deserializeAnnotations(serialized);

    expect(annotations).toHaveLength(1);
    expect(annotations[0].id).toBe('ann-roundtrip');
    expect(annotations[0].page).toBe(3);
    expect(annotations[0].quoteSelector.exact).toBe('roundtrip test');
    expect(annotations[0].color).toBe('green');
    expect(annotations[0].comment).toBe('Test comment');
    expect(annotations[0].tags).toEqual(['tag1']);
  });
});
