import { describe, it, expect } from 'vitest';
import { parseMetaBindSyntax, isMetaBindSyntax } from '../services/metabindParser';

describe('isMetaBindSyntax', () => {
  it('detects INPUT syntax', () => {
    expect(isMetaBindSyntax('INPUT[toggle:done]')).toBe(true);
  });
  it('detects VIEW syntax', () => {
    expect(isMetaBindSyntax('VIEW[progress:hp]')).toBe(true);
  });
  it('detects BUTTON syntax', () => {
    expect(isMetaBindSyntax('BUTTON[Save:command(save)]')).toBe(true);
  });
  it('rejects non-metabind text', () => {
    expect(isMetaBindSyntax('just some code')).toBe(false);
    expect(isMetaBindSyntax('input[toggle:done]')).toBe(false);
  });
});

describe('parseMetaBindSyntax — INPUT', () => {
  it('parses basic toggle input', () => {
    const result = parseMetaBindSyntax('INPUT[toggle:done]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'toggle',
      property: 'done',
      options: {},
    });
  });

  it('parses text input with placeholder', () => {
    const result = parseMetaBindSyntax('INPUT[text:title(placeholder=Enter title)]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'text',
      property: 'title',
      options: { placeholder: 'Enter title' },
    });
  });

  it('parses slider with min/max/step', () => {
    const result = parseMetaBindSyntax('INPUT[slider:progress(min=0,max=100,step=5)]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'slider',
      property: 'progress',
      options: { min: 0, max: 100, step: 5 },
    });
  });

  it('parses select with choices', () => {
    const result = parseMetaBindSyntax('INPUT[select:status(choices=draft|review|done)]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'select',
      property: 'status',
      options: { choices: ['draft', 'review', 'done'] },
    });
  });

  it('parses number input', () => {
    const result = parseMetaBindSyntax('INPUT[number:count]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'number',
      property: 'count',
      options: {},
    });
  });

  it('parses date input', () => {
    const result = parseMetaBindSyntax('INPUT[date:due_date]');
    expect(result).toEqual({
      kind: 'input',
      fieldType: 'date',
      property: 'due_date',
      options: {},
    });
  });

  it('rejects unknown input type', () => {
    expect(parseMetaBindSyntax('INPUT[unknown:field]')).toBeNull();
  });

  it('parses dotted property paths', () => {
    const result = parseMetaBindSyntax('INPUT[text:meta.author]');
    expect(result?.kind).toBe('input');
    expect((result as any).property).toBe('meta.author');
  });
});

describe('parseMetaBindSyntax — VIEW', () => {
  it('parses text view', () => {
    const result = parseMetaBindSyntax('VIEW[text:title]');
    expect(result).toEqual({
      kind: 'view',
      fieldType: 'text',
      property: 'title',
      options: {},
    });
  });

  it('parses progress view with max', () => {
    const result = parseMetaBindSyntax('VIEW[progress:hp(max=200)]');
    expect(result).toEqual({
      kind: 'view',
      fieldType: 'progress',
      property: 'hp',
      options: { max: 200 },
    });
  });

  it('parses rating view with maxStars', () => {
    const result = parseMetaBindSyntax('VIEW[rating:score(maxStars=10)]');
    expect(result).toEqual({
      kind: 'view',
      fieldType: 'rating',
      property: 'score',
      options: { maxStars: 10 },
    });
  });

  it('parses boolean view', () => {
    const result = parseMetaBindSyntax('VIEW[boolean:completed]');
    expect(result).toEqual({
      kind: 'view',
      fieldType: 'boolean',
      property: 'completed',
      options: {},
    });
  });

  it('rejects unknown view type', () => {
    expect(parseMetaBindSyntax('VIEW[unknown:field]')).toBeNull();
  });
});

describe('parseMetaBindSyntax — BUTTON', () => {
  it('parses command button', () => {
    const result = parseMetaBindSyntax('BUTTON[Save:command(save-note)]');
    expect(result).toEqual({
      kind: 'button',
      label: 'Save',
      action: 'command',
      actionArgs: 'save-note',
      options: {},
    });
  });

  it('parses update button', () => {
    const result = parseMetaBindSyntax('BUTTON[Archive:update(lifecycle=archived)]');
    expect(result).toEqual({
      kind: 'button',
      label: 'Archive',
      action: 'update',
      actionArgs: 'lifecycle=archived',
      options: {},
    });
  });

  it('parses open button', () => {
    const result = parseMetaBindSyntax('BUTTON[Open Note:open(path/to/note.md)]');
    expect(result).toEqual({
      kind: 'button',
      label: 'Open Note',
      action: 'open',
      actionArgs: 'path/to/note.md',
      options: {},
    });
  });

  it('parses button without args', () => {
    const result = parseMetaBindSyntax('BUTTON[Run:command]');
    expect(result).toEqual({
      kind: 'button',
      label: 'Run',
      action: 'command',
      actionArgs: '',
      options: {},
    });
  });

  it('rejects unknown button action', () => {
    expect(parseMetaBindSyntax('BUTTON[Bad:nope(x)]')).toBeNull();
  });
});

describe('parseMetaBindSyntax — edge cases', () => {
  it('returns null for non-metabind strings', () => {
    expect(parseMetaBindSyntax('console.log("hello")')).toBeNull();
    expect(parseMetaBindSyntax('')).toBeNull();
  });

  it('handles whitespace-trimmed input', () => {
    const result = parseMetaBindSyntax('  INPUT[toggle:done]  ');
    expect(result?.kind).toBe('input');
  });
});
