import { describe, it, expect } from 'vitest';
import {
  parseAbcBlockContent,
  findAbcBlocks,
  sampleAbcBlock,
} from '../services/abcParser';

describe('parseAbcBlockContent', () => {
  it('parses plain ABC notation', () => {
    const body = 'X:1\nT:My Tune\nM:4/4\nK:C\nCDEF GABc |';
    const result = parseAbcBlockContent(body);
    expect(result.notation).toBe(body);
    expect(result.options).toEqual({});
    expect(result.optionsError).toBeUndefined();
  });

  it('parses JSON header with --- separator', () => {
    const body = '{"tablature": [{"instrument": "violin"}]}\n---\nX:1\nT:Test\nK:G\nCDEF |';
    const result = parseAbcBlockContent(body);
    expect(result.options).toEqual({ tablature: [{ instrument: 'violin' }] });
    expect(result.notation).toBe('X:1\nT:Test\nK:G\nCDEF |');
    expect(result.optionsError).toBeUndefined();
  });

  it('parses swing option', () => {
    const body = '{"swing": 70}\n---\nX:1\nK:C\nCDEF |';
    const result = parseAbcBlockContent(body);
    expect(result.options).toEqual({ swing: 70 });
    expect(result.notation).toBe('X:1\nK:C\nCDEF |');
  });

  it('handles invalid JSON with error', () => {
    const body = '{invalid json}\n---\nX:1\nK:C\nCDEF |';
    const result = parseAbcBlockContent(body);
    expect(result.optionsError).toBeDefined();
    expect(result.optionsError).toContain('Invalid JSON');
    expect(result.notation).toBe('X:1\nK:C\nCDEF |');
    expect(result.options).toEqual({});
  });

  it('treats non-object JSON as plain notation (first line must start with {)', () => {
    const body = '["not", "an", "object"]\n---\nX:1\nK:C\nCDEF |';
    const result = parseAbcBlockContent(body);
    expect(result.notation).toBe(body);
    expect(result.options).toEqual({});
  });

  it('treats blocks without { on first line as plain notation', () => {
    const body = 'X:1\n---\nT:Tune\nK:C\nCDEF |';
    const result = parseAbcBlockContent(body);
    // The entire block including --- is treated as notation (no JSON header)
    expect(result.notation).toBe(body);
    expect(result.options).toEqual({});
  });

  it('handles empty JSON object', () => {
    const body = '{}\n---\nX:1\nK:C\nCDEF |';
    const result = parseAbcBlockContent(body);
    expect(result.options).toEqual({});
    expect(result.notation).toBe('X:1\nK:C\nCDEF |');
  });

  it('handles multiple options', () => {
    const body = '{"responsive": "resize", "staffwidth": 600}\n---\nX:1\nK:C\nABCD |';
    const result = parseAbcBlockContent(body);
    expect(result.options).toEqual({ responsive: 'resize', staffwidth: 600 });
  });
});

describe('findAbcBlocks', () => {
  it('finds a single abc block', () => {
    const text = 'Some text\n```abc\nX:1\nT:Test\nK:C\nCDEF |\n```\nMore text';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].notation).toBe('X:1\nT:Test\nK:C\nCDEF |\n');
    expect(blocks[0].options).toEqual({});
  });

  it('finds multiple abc blocks', () => {
    const text = '```abc\nX:1\nK:C\nCDEF |\n```\n\n```abc\nX:2\nK:G\nGABc |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].notation).toContain('X:1');
    expect(blocks[1].notation).toContain('X:2');
  });

  it('handles abc block with JSON options', () => {
    const text = '```abc\n{"swing": 70}\n---\nX:1\nK:C\nCDEF |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].options).toEqual({ swing: 70 });
    expect(blocks[0].notation).toContain('X:1');
    expect(blocks[0].notation).not.toContain('swing');
  });

  it('preserves block positions', () => {
    const text = '```abc\nX:1\nK:C\nC |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks[0].from).toBe(0);
    expect(blocks[0].to).toBe(text.length);
  });

  it('ignores non-abc code blocks', () => {
    const text = '```js\nconsole.log("hi")\n```\n```abc\nX:1\nK:C\nC |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].notation).toContain('X:1');
  });

  it('returns empty array for no abc blocks', () => {
    expect(findAbcBlocks('just text')).toHaveLength(0);
    expect(findAbcBlocks('```python\nprint("hi")\n```')).toHaveLength(0);
  });

  it('handles chorus/multi-voice notation', () => {
    const text = '```abc\nX:1\nT:Chorus\nV:T1 clef=treble name="Soprano"\nV:B1 clef=bass name="Tenor"\nK:G\n[V:T1]CDEF |\n[V:B1]C3D |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].notation).toContain('V:T1');
    expect(blocks[0].notation).toContain('V:B1');
  });

  it('propagates optionsError for invalid JSON', () => {
    const text = '```abc\n{bad json}\n---\nX:1\nK:C\nC |\n```';
    const blocks = findAbcBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].optionsError).toBeDefined();
  });
});

describe('sampleAbcBlock', () => {
  it('generates valid abc block with fences', () => {
    const sample = sampleAbcBlock();
    expect(sample).toContain('```abc');
    expect(sample).toContain('X:1');
    expect(sample).toContain('T:');
    expect(sample).toContain('K:');
  });

  it('is parseable by findAbcBlocks', () => {
    const sample = sampleAbcBlock();
    const blocks = findAbcBlocks(sample);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].notation).toContain('X:1');
  });
});
