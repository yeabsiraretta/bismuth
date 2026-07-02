import { describe, it, expect } from 'vitest';
import {
  findHeadings,
  findListItems,
  headingRange,
  listItemRange,
  calculateZoomRange,
  targetAtLine,
  buildBreadcrumbs,
} from '../zoomService';

const DOC = [
  '# Title', // 1
  '', // 2
  '## Section A', // 3
  'Some text here.', // 4
  '', // 5
  '### Subsection A1', // 6
  'Details about A1.', // 7
  '', // 8
  '## Section B', // 9
  'Text in B.', // 10
].join('\n');

const LIST_DOC = [
  '- Item 1', // 1
  '  - Nested 1a', // 2
  '  - Nested 1b', // 3
  '    - Deep 1b-i', // 4
  '- Item 2', // 5
  '  - Nested 2a', // 6
  '', // 7
  '# Heading after list', // 8
].join('\n');

// ─── findHeadings ───────────────────────────────────────────────────────────

describe('findHeadings', () => {
  it('finds all headings with correct levels', () => {
    const headings = findHeadings(DOC);
    expect(headings).toHaveLength(4);
    expect(headings[0]).toEqual({ kind: 'heading', line: 1, level: 1, text: 'Title' });
    expect(headings[1]).toEqual({ kind: 'heading', line: 3, level: 2, text: 'Section A' });
    expect(headings[2]).toEqual({ kind: 'heading', line: 6, level: 3, text: 'Subsection A1' });
    expect(headings[3]).toEqual({ kind: 'heading', line: 9, level: 2, text: 'Section B' });
  });

  it('returns empty for content with no headings', () => {
    expect(findHeadings('just plain text')).toEqual([]);
  });
});

// ─── findListItems ──────────────────────────────────────────────────────────

describe('findListItems', () => {
  it('finds all list items with indent levels', () => {
    const items = findListItems(LIST_DOC);
    expect(items).toHaveLength(6);
    expect(items[0]).toEqual({ kind: 'list', line: 1, level: 0, text: 'Item 1' });
    expect(items[1]).toEqual({ kind: 'list', line: 2, level: 1, text: 'Nested 1a' });
    expect(items[3]).toEqual({ kind: 'list', line: 4, level: 2, text: 'Deep 1b-i' });
    expect(items[4]).toEqual({ kind: 'list', line: 5, level: 0, text: 'Item 2' });
  });

  it('returns empty for content with no lists', () => {
    expect(findListItems('# Just a heading')).toEqual([]);
  });
});

// ─── headingRange ───────────────────────────────────────────────────────────

describe('headingRange', () => {
  it('calculates range for top-level heading (includes everything)', () => {
    const range = headingRange(DOC, 1);
    expect(range).not.toBeNull();
    expect(range!.from).toBe(0);
    expect(range!.to).toBe(DOC.length);
  });

  it('calculates range for H2 section (stops at next H2)', () => {
    const range = headingRange(DOC, 3);
    expect(range).not.toBeNull();
    // Should start at "## Section A" and end before "## Section B"
    const startIdx = DOC.indexOf('## Section A');
    const endIdx = DOC.indexOf('## Section B');
    expect(range!.from).toBe(startIdx);
    // to should be right before the "## Section B" line (trimmed trailing newlines)
    expect(range!.to).toBeLessThanOrEqual(endIdx);
  });

  it('calculates range for H3 subsection', () => {
    const range = headingRange(DOC, 6);
    expect(range).not.toBeNull();
    const startIdx = DOC.indexOf('### Subsection A1');
    expect(range!.from).toBe(startIdx);
    // Should end before ## Section B
    const endIdx = DOC.indexOf('## Section B');
    expect(range!.to).toBeLessThanOrEqual(endIdx);
  });

  it('returns null for invalid line', () => {
    expect(headingRange(DOC, 0)).toBeNull();
    expect(headingRange(DOC, 999)).toBeNull();
  });

  it('returns null for non-heading line', () => {
    expect(headingRange(DOC, 4)).toBeNull(); // "Some text here."
  });
});

// ─── listItemRange ──────────────────────────────────────────────────────────

describe('listItemRange', () => {
  it('calculates range for top-level list item (includes children)', () => {
    const range = listItemRange(LIST_DOC, 1);
    expect(range).not.toBeNull();
    expect(range!.from).toBe(0);
    // Should include nested items but stop at Item 2
    const item2Start = LIST_DOC.indexOf('- Item 2');
    expect(range!.to).toBeLessThanOrEqual(item2Start);
  });

  it('calculates range for nested list item', () => {
    const range = listItemRange(LIST_DOC, 2);
    expect(range).not.toBeNull();
    const startIdx = LIST_DOC.indexOf('  - Nested 1a');
    expect(range!.from).toBe(startIdx);
    // Should stop at "  - Nested 1b" (same level)
    const nextIdx = LIST_DOC.indexOf('  - Nested 1b');
    expect(range!.to).toBeLessThanOrEqual(nextIdx);
  });

  it('calculates range for deeply nested item (no children)', () => {
    const range = listItemRange(LIST_DOC, 4);
    expect(range).not.toBeNull();
    const startIdx = LIST_DOC.indexOf('    - Deep 1b-i');
    expect(range!.from).toBe(startIdx);
  });

  it('returns null for non-list line', () => {
    expect(listItemRange(LIST_DOC, 7)).toBeNull(); // blank line
    expect(listItemRange(LIST_DOC, 8)).toBeNull(); // heading
  });
});

// ─── calculateZoomRange ─────────────────────────────────────────────────────

describe('calculateZoomRange', () => {
  it('delegates to headingRange for heading targets', () => {
    const target = { kind: 'heading' as const, line: 3, level: 2, text: 'Section A' };
    const range = calculateZoomRange(DOC, target);
    expect(range).toEqual(headingRange(DOC, 3));
  });

  it('delegates to listItemRange for list targets', () => {
    const target = { kind: 'list' as const, line: 1, level: 0, text: 'Item 1' };
    const range = calculateZoomRange(LIST_DOC, target);
    expect(range).toEqual(listItemRange(LIST_DOC, 1));
  });
});

// ─── targetAtLine ───────────────────────────────────────────────────────────

describe('targetAtLine', () => {
  it('detects heading at line', () => {
    const target = targetAtLine(DOC, 3);
    expect(target).not.toBeNull();
    expect(target!.kind).toBe('heading');
    expect(target!.level).toBe(2);
    expect(target!.text).toBe('Section A');
  });

  it('detects list item at line', () => {
    const target = targetAtLine(LIST_DOC, 2);
    expect(target).not.toBeNull();
    expect(target!.kind).toBe('list');
    expect(target!.level).toBe(1);
    expect(target!.text).toBe('Nested 1a');
  });

  it('returns null for plain text', () => {
    expect(targetAtLine(DOC, 4)).toBeNull();
  });

  it('returns null for out-of-range lines', () => {
    expect(targetAtLine(DOC, 0)).toBeNull();
    expect(targetAtLine(DOC, 999)).toBeNull();
  });

  it('prefers heading over list when line is a heading', () => {
    const mixed = '# Heading\n- List item';
    expect(targetAtLine(mixed, 1)!.kind).toBe('heading');
    expect(targetAtLine(mixed, 2)!.kind).toBe('list');
  });
});

// ─── buildBreadcrumbs ───────────────────────────────────────────────────────

describe('buildBreadcrumbs', () => {
  it('builds breadcrumb trail for nested heading', () => {
    const target = { kind: 'heading' as const, line: 6, level: 3, text: 'Subsection A1' };
    const crumbs = buildBreadcrumbs(DOC, target);
    // Should have: Title (H1) -> Section A (H2) -> Subsection A1 (H3)
    expect(crumbs.length).toBeGreaterThanOrEqual(2);
    expect(crumbs[crumbs.length - 1].target.text).toBe('Subsection A1');
  });

  it('builds single breadcrumb for top-level heading', () => {
    const target = { kind: 'heading' as const, line: 1, level: 1, text: 'Title' };
    const crumbs = buildBreadcrumbs(DOC, target);
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].target.text).toBe('Title');
  });

  it('builds breadcrumbs for nested list items', () => {
    const target = { kind: 'list' as const, line: 4, level: 2, text: 'Deep 1b-i' };
    const crumbs = buildBreadcrumbs(LIST_DOC, target);
    // Should have: Item 1 (level 0) -> Nested 1b (level 1) -> Deep 1b-i (level 2)
    expect(crumbs.length).toBeGreaterThanOrEqual(2);
    expect(crumbs[crumbs.length - 1].target.text).toBe('Deep 1b-i');
    expect(crumbs[0].target.level).toBe(0);
  });

  it('breadcrumbs have correct from offsets', () => {
    const target = { kind: 'heading' as const, line: 3, level: 2, text: 'Section A' };
    const crumbs = buildBreadcrumbs(DOC, target);
    for (const crumb of crumbs) {
      expect(crumb.from).toBeGreaterThanOrEqual(0);
      expect(crumb.from).toBeLessThan(DOC.length);
    }
  });
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles empty document', () => {
    expect(findHeadings('')).toEqual([]);
    expect(findListItems('')).toEqual([]);
    expect(targetAtLine('', 1)).toBeNull();
  });

  it('handles single-line heading document', () => {
    const doc = '## Solo Heading';
    const range = headingRange(doc, 1);
    expect(range).not.toBeNull();
    expect(range!.from).toBe(0);
    expect(range!.to).toBe(doc.length);
  });

  it('handles ordered lists', () => {
    const doc = '1. First\n2. Second\n   1. Nested';
    const items = findListItems(doc);
    expect(items).toHaveLength(3);
    expect(items[0].text).toBe('First');
    expect(items[2].level).toBe(1);
  });

  it('handles tabs as indent', () => {
    const doc = '-\tItem\n\t-\tNested';
    const items = findListItems(doc);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
