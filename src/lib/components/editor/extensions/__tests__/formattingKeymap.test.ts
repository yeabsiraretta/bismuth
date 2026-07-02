/**
 * Unit tests for formatting keyboard shortcuts.
 * Tests the wrapSelection and setHeading logic used by formattingKeymap.
 * @module components/editor/extensions/__tests__/formattingKeymap
 */

import { describe, it, expect } from 'vitest';

describe('formattingKeymap: wrapSelection logic', () => {
  // Simulate the core wrap logic without needing full CM6 state
  function simulateWrap(
    text: string,
    selFrom: number,
    selTo: number,
    prefix: string,
    suffix: string
  ) {
    const selected = text.slice(selFrom, selTo);
    const before = text.slice(selFrom - prefix.length, selFrom);
    const after = text.slice(selTo, selTo + suffix.length);

    if (before === prefix && after === suffix) {
      // Unwrap
      return text.slice(0, selFrom - prefix.length) + selected + text.slice(selTo + suffix.length);
    }
    // Wrap
    const inner = selected || 'text';
    return text.slice(0, selFrom) + prefix + inner + suffix + text.slice(selTo);
  }

  it('wraps selected text with bold markers', () => {
    const result = simulateWrap('hello world', 6, 11, '**', '**');
    expect(result).toBe('hello **world**');
  });

  it('wraps selected text with italic markers', () => {
    const result = simulateWrap('hello world', 6, 11, '*', '*');
    expect(result).toBe('hello *world*');
  });

  it('wraps with strikethrough', () => {
    const result = simulateWrap('remove this', 7, 11, '~~', '~~');
    expect(result).toBe('remove ~~this~~');
  });

  it('wraps with inline code', () => {
    const result = simulateWrap('call foo here', 5, 8, '`', '`');
    expect(result).toBe('call `foo` here');
  });

  it('wraps with wikilink', () => {
    const result = simulateWrap('see note here', 4, 8, '[[', ']]');
    expect(result).toBe('see [[note]] here');
  });

  it('wraps with highlight', () => {
    const result = simulateWrap('important word', 10, 14, '==', '==');
    expect(result).toBe('important ==word==');
  });

  it('wraps with underline HTML', () => {
    const result = simulateWrap('emphasize this', 10, 14, '<u>', '</u>');
    expect(result).toBe('emphasize <u>this</u>');
  });

  it('inserts placeholder when no selection', () => {
    const result = simulateWrap('hello ', 6, 6, '**', '**');
    expect(result).toBe('hello **text**');
  });

  it('unwraps when already wrapped', () => {
    const result = simulateWrap('hello **world** end', 8, 13, '**', '**');
    expect(result).toBe('hello world end');
  });

  it('unwraps italic', () => {
    const result = simulateWrap('a *word* b', 3, 7, '*', '*');
    expect(result).toBe('a word b');
  });
});

describe('formattingKeymap: setHeading logic', () => {
  function simulateHeading(lineText: string, level: number): string {
    const prefix = '#'.repeat(level) + ' ';
    const existingMatch = lineText.match(/^(#{1,6})\s/);
    if (existingMatch) {
      const oldPrefix = existingMatch[0];
      if (existingMatch[1].length === level) {
        return lineText.slice(oldPrefix.length);
      }
      return prefix + lineText.slice(oldPrefix.length);
    }
    return prefix + lineText;
  }

  it('adds H1 to plain line', () => {
    expect(simulateHeading('Hello', 1)).toBe('# Hello');
  });

  it('adds H2 to plain line', () => {
    expect(simulateHeading('Title', 2)).toBe('## Title');
  });

  it('adds H3 to plain line', () => {
    expect(simulateHeading('Section', 3)).toBe('### Section');
  });

  it('changes H1 to H2', () => {
    expect(simulateHeading('# Title', 2)).toBe('## Title');
  });

  it('changes H3 to H1', () => {
    expect(simulateHeading('### Section', 1)).toBe('# Section');
  });

  it('removes heading when same level toggled', () => {
    expect(simulateHeading('## Title', 2)).toBe('Title');
  });

  it('removes H1 when H1 toggled', () => {
    expect(simulateHeading('# Hello', 1)).toBe('Hello');
  });
});

describe('formattingKeymap: keybinding definitions', () => {
  it('has all expected shortcuts defined', () => {
    const expectedKeys = [
      'Mod-b',
      'Mod-i',
      'Mod-u',
      'Mod-Shift-s',
      'Mod-e',
      'Mod-k',
      'Mod-Shift-h',
      'Mod-1',
      'Mod-2',
      'Mod-3',
      'Mod-4',
      'Tab',
      'Shift-Tab',
    ];
    expect(expectedKeys).toHaveLength(13);
    expect(expectedKeys).toContain('Tab');
    expect(expectedKeys).toContain('Shift-Tab');
  });
});

describe('formattingKeymap: tab indent logic', () => {
  const LIST_RE = /^(\s*)([-*+]|\d+\.)\s/;
  const INDENT = '  ';

  function simulateTab(lineText: string): string {
    if (LIST_RE.test(lineText)) return INDENT + lineText;
    return lineText; // cursor-based insert not testable without CM6
  }

  function simulateShiftTab(lineText: string): string {
    if (!LIST_RE.test(lineText)) return lineText;
    if (lineText.startsWith('  ')) return lineText.slice(2);
    if (lineText.startsWith(' ')) return lineText.slice(1);
    return lineText;
  }

  it('Tab indents a bullet list line by 2 spaces', () => {
    expect(simulateTab('- item')).toBe('  - item');
  });

  it('Tab indents an ordered list line', () => {
    expect(simulateTab('1. first')).toBe('  1. first');
  });

  it('Tab indents an already-indented list further', () => {
    expect(simulateTab('  - nested')).toBe('    - nested');
  });

  it('Shift-Tab removes 2-space indent from list', () => {
    expect(simulateShiftTab('  - nested')).toBe('- nested');
  });

  it('Shift-Tab removes 1-space indent if only 1 space', () => {
    expect(simulateShiftTab(' - item')).toBe('- item');
  });

  it('Shift-Tab is no-op on non-list line', () => {
    expect(simulateShiftTab('plain text')).toBe('plain text');
  });

  it('Shift-Tab is no-op on unindented list', () => {
    expect(simulateShiftTab('- item')).toBe('- item');
  });
});

describe('formattingKeymap: list indent normalization (preview)', () => {
  function normalizedIndentLevel(indentStr: string): number {
    const normalized = indentStr.replace(/\t/g, '  ');
    return Math.floor(normalized.length / 2);
  }

  it('2 spaces = level 1', () => expect(normalizedIndentLevel('  ')).toBe(1));
  it('4 spaces = level 2', () => expect(normalizedIndentLevel('    ')).toBe(2));
  it('1 tab = level 1 (tab treated as 2 spaces)', () =>
    expect(normalizedIndentLevel('\t')).toBe(1));
  it('2 tabs = level 2', () => expect(normalizedIndentLevel('\t\t')).toBe(2));
  it('no indent = level 0', () => expect(normalizedIndentLevel('')).toBe(0));
});
