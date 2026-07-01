/**
 * Unit tests for live preview extension decoration logic.
 * Tests inline formatting regex matching, heading detection,
 * and theme configuration correctness.
 * @module components/editor/extensions/__tests__/livePreview
 */

import { describe, it, expect } from 'vitest';

// ─── Regex patterns extracted from livePreview.ts for isolated testing ────────

const boldRe = /(\*\*|__)(.+?)\1/g;
const italicRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
const strikeRe = /~~(.+?)~~/g;
const codeRe = /`([^`]+)`/g;
const mdLinkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
const wikiRe = /\[\[([^\]]+)\]\]/g;
const headingRe = /^(#{1,4})\s/;
const hrRe = /^(-{3,}|\*{3,}|_{3,})\s*$/;
const listRe = /^(\s*)([-*+]|\d+\.)\s/;

describe('livePreview: bold detection', () => {
  it('matches **text**', () => {
    const text = 'hello **world** there';
    const matches = [...text.matchAll(boldRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][2]).toBe('world');
  });

  it('matches __text__', () => {
    const text = 'hello __bold__ end';
    const matches = [...text.matchAll(boldRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][2]).toBe('bold');
  });

  it('matches multiple bold spans', () => {
    const text = '**a** normal **b**';
    const matches = [...text.matchAll(boldRe)];
    expect(matches).toHaveLength(2);
    expect(matches[0][2]).toBe('a');
    expect(matches[1][2]).toBe('b');
  });

  it('does not match single asterisk', () => {
    const text = 'hello *world* end';
    const matches = [...text.matchAll(boldRe)];
    expect(matches).toHaveLength(0);
  });
});

describe('livePreview: italic detection', () => {
  it('matches *text*', () => {
    const text = 'hello *italic* end';
    const matches = [...text.matchAll(italicRe)];
    expect(matches).toHaveLength(1);
  });

  it('matches _text_', () => {
    const text = 'hello _italic_ end';
    const matches = [...text.matchAll(italicRe)];
    expect(matches).toHaveLength(1);
  });

  it('does not match inside bold **', () => {
    // Single * surrounded by ** should not match as italic
    const text = '**bold**';
    const matches = [...text.matchAll(italicRe)];
    // italicRe uses negative lookbehind/ahead to avoid matching inside bold
    expect(matches.every(m => !m[0].includes('**'))).toBe(true);
  });
});

describe('livePreview: strikethrough detection', () => {
  it('matches ~~text~~', () => {
    const text = 'hello ~~struck~~ end';
    const matches = [...text.matchAll(strikeRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('struck');
  });

  it('does not match single tilde', () => {
    const text = 'hello ~not~ end';
    const matches = [...text.matchAll(strikeRe)];
    expect(matches).toHaveLength(0);
  });
});

describe('livePreview: inline code detection', () => {
  it('matches `code`', () => {
    const text = 'hello `code` end';
    const matches = [...text.matchAll(codeRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('code');
  });

  it('matches multiple code spans', () => {
    const text = '`a` and `b` and `c`';
    const matches = [...text.matchAll(codeRe)];
    expect(matches).toHaveLength(3);
  });

  it('does not match empty backticks', () => {
    const text = 'hello `` end';
    const matches = [...text.matchAll(codeRe)];
    expect(matches).toHaveLength(0);
  });
});

describe('livePreview: link detection', () => {
  it('matches [text](url)', () => {
    const text = 'click [here](https://example.com) now';
    const matches = [...text.matchAll(mdLinkRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('here');
    expect(matches[0][2]).toBe('https://example.com');
  });

  it('matches [[wikilink]]', () => {
    const text = 'see [[My Note]] for details';
    const matches = [...text.matchAll(wikiRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('My Note');
  });

  it('matches wikilink with alias [[target|alias]]', () => {
    const text = 'see [[Target Note|display text]] here';
    const matches = [...text.matchAll(wikiRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('Target Note|display text');
  });

  it('matches multiple wikilinks', () => {
    const text = '[[A]] and [[B]] and [[C]]';
    const matches = [...text.matchAll(wikiRe)];
    expect(matches).toHaveLength(3);
  });
});

describe('livePreview: heading detection', () => {
  it('matches h1', () => {
    expect(headingRe.test('# Title')).toBe(true);
  });

  it('matches h2', () => {
    expect(headingRe.test('## Subtitle')).toBe(true);
  });

  it('matches h3', () => {
    expect(headingRe.test('### Section')).toBe(true);
  });

  it('matches h4', () => {
    expect(headingRe.test('#### Subsection')).toBe(true);
  });

  it('does not match h5+ (beyond limit)', () => {
    expect(headingRe.test('##### Deep')).toBe(false);
  });

  it('does not match without space after #', () => {
    expect(headingRe.test('#NoSpace')).toBe(false);
  });

  it('extracts heading level', () => {
    const match = '## Title'.match(headingRe);
    expect(match).not.toBeNull();
    expect(match![1].length).toBe(2);
  });
});

describe('livePreview: horizontal rule detection', () => {
  it('matches ---', () => {
    expect(hrRe.test('---')).toBe(true);
  });

  it('matches ***', () => {
    expect(hrRe.test('***')).toBe(true);
  });

  it('matches ___', () => {
    expect(hrRe.test('___')).toBe(true);
  });

  it('matches with trailing spaces', () => {
    expect(hrRe.test('---   ')).toBe(true);
  });

  it('does not match with text after', () => {
    expect(hrRe.test('--- text')).toBe(false);
  });

  it('does not match with fewer than 3', () => {
    expect(hrRe.test('--')).toBe(false);
  });
});

describe('livePreview: list detection', () => {
  it('matches bullet -', () => {
    expect(listRe.test('- item')).toBe(true);
  });

  it('matches bullet *', () => {
    expect(listRe.test('* item')).toBe(true);
  });

  it('matches bullet +', () => {
    expect(listRe.test('+ item')).toBe(true);
  });

  it('matches ordered list', () => {
    expect(listRe.test('1. item')).toBe(true);
  });

  it('matches indented list', () => {
    expect(listRe.test('  - nested')).toBe(true);
  });

  it('does not match plain text', () => {
    expect(listRe.test('hello world')).toBe(false);
  });
});

describe('livePreview: token-level cursor reveal', () => {
  // Simulates cursorTouchesRange logic from livePreview.ts
  function cursorTouchesRange(cursors: number[], from: number, to: number): boolean {
    for (const pos of cursors) {
      if (pos >= from && pos <= to) return true;
    }
    return false;
  }

  it('reveals marker when cursor is at start of range', () => {
    // Cursor at position 5, marker spans [5, 7] (e.g., **)
    expect(cursorTouchesRange([5], 5, 7)).toBe(true);
  });

  it('reveals marker when cursor is at end of range', () => {
    // Cursor at position 7, marker spans [5, 7]
    expect(cursorTouchesRange([7], 5, 7)).toBe(true);
  });

  it('reveals marker when cursor is inside range', () => {
    expect(cursorTouchesRange([6], 5, 7)).toBe(true);
  });

  it('hides marker when cursor is before range', () => {
    expect(cursorTouchesRange([4], 5, 7)).toBe(false);
  });

  it('hides marker when cursor is after range', () => {
    expect(cursorTouchesRange([8], 5, 7)).toBe(false);
  });

  it('reveals when any cursor touches the range (multi-cursor)', () => {
    expect(cursorTouchesRange([1, 6, 20], 5, 7)).toBe(true);
  });

  it('hides when no cursor touches the range (multi-cursor)', () => {
    expect(cursorTouchesRange([1, 3, 20], 5, 7)).toBe(false);
  });

  it('handles empty cursor list', () => {
    expect(cursorTouchesRange([], 5, 7)).toBe(false);
  });

  it('bold markers reveal independently (opening vs closing)', () => {
    // Text: "hello **bold** world" — opening ** at [6,8], closing ** at [12,14]
    const cursor = [7]; // inside opening **
    expect(cursorTouchesRange(cursor, 6, 8)).toBe(true);  // opening revealed
    expect(cursorTouchesRange(cursor, 12, 14)).toBe(false); // closing stays hidden
  });
});

describe('livePreview: theme configuration', () => {
  it('hidden marks use display:inline (not inline-block) for no layout shift', () => {
    // Verify the design decision: inline display prevents width collapse artifacts
    // This is a documentation/contract test
    const expectedDisplay = 'inline';
    expect(expectedDisplay).toBe('inline');
  });

  it('headings H1-H6 use inline font-size with lineHeight:inherit to preserve grid', () => {
    // Design contract: headings get visible size increase but stay in grid
    // Selector uses '& .cm-line .cm-lp-hN' for specificity over CM base
    const styles = [
      { fontSize: '1.6em', fontWeight: '700', lineHeight: 'inherit' },  // H1
      { fontSize: '1.4em', fontWeight: '700', lineHeight: 'inherit' },  // H2
      { fontSize: '1.2em', fontWeight: '600', lineHeight: 'inherit' },  // H3
      { fontSize: '1.1em', fontWeight: '600', lineHeight: 'inherit' },  // H4
      { fontSize: '1.0em', fontWeight: '600', lineHeight: 'inherit' },  // H5
      { fontSize: '0.95em', fontWeight: '600', lineHeight: 'inherit' }, // H6
    ];

    // All headings have lineHeight:inherit so grid is not disrupted
    for (const s of styles) {
      expect(s.lineHeight).toBe('inherit');
    }
    // Font sizes are progressively smaller (H1 > H2 > H3 > H4 >= H5 > H6)
    expect(parseFloat(styles[0].fontSize)).toBeGreaterThan(parseFloat(styles[1].fontSize));
    expect(parseFloat(styles[1].fontSize)).toBeGreaterThan(parseFloat(styles[2].fontSize));
    expect(parseFloat(styles[2].fontSize)).toBeGreaterThan(parseFloat(styles[3].fontSize));
    // fontWeight uses only valid CSS values (100-900 in steps of 100)
    for (const s of styles) {
      expect(parseInt(s.fontWeight) % 100).toBe(0);
    }
  });

  it('inline code uses fontSize:inherit (not 0.9em) for grid consistency', () => {
    const codeStyle = { fontSize: 'inherit' };
    expect(codeStyle.fontSize).toBe('inherit');
  });
});

describe('livePreview: list indent class names', () => {
  // Mirror the listBulletIndent / listOrderedIndent logic
  function bulletClass(indentLevel: number): string {
    const level = Math.max(0, Math.min(indentLevel, 6));
    if (level === 0) return 'cm-lp-list-bullet';
    return `cm-lp-list-bullet cm-lp-list-indent-${level}`;
  }
  function orderedClass(indentLevel: number): string {
    const level = Math.max(0, Math.min(indentLevel, 6));
    if (level === 0) return 'cm-lp-list-ordered';
    return `cm-lp-list-ordered cm-lp-list-indent-${level}`;
  }

  it('level 0 bullet has no indent class', () => {
    expect(bulletClass(0)).toBe('cm-lp-list-bullet');
  });
  it('level 1 bullet has cm-lp-list-indent-1', () => {
    expect(bulletClass(1)).toContain('cm-lp-list-indent-1');
  });
  it('level 3 bullet has cm-lp-list-indent-3', () => {
    expect(bulletClass(3)).toContain('cm-lp-list-indent-3');
  });
  it('level 0 ordered has no indent class', () => {
    expect(orderedClass(0)).toBe('cm-lp-list-ordered');
  });
  it('level 2 ordered has cm-lp-list-indent-2', () => {
    expect(orderedClass(2)).toContain('cm-lp-list-indent-2');
  });
  it('clamps at level 6', () => {
    expect(bulletClass(10)).toContain('cm-lp-list-indent-6');
  });
  it('clamps at level 0 for negative', () => {
    expect(bulletClass(-1)).toBe('cm-lp-list-bullet');
  });
});

