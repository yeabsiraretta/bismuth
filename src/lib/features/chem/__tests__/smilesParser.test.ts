import { describe, it, expect } from 'vitest';
import {
  parseSmilesLine,
  parseSmilesBlock,
  findSmilesBlocks,
  findInlineSmiles,
  sampleSmilesBlock,
} from '../services/smilesParser';

describe('parseSmilesLine', () => {
  it('parses a plain SMILES string', () => {
    const result = parseSmilesLine('C1=CC=CC=C1');
    expect(result).toEqual({ smiles: 'C1=CC=CC=C1' });
  });

  it('parses SMILES with label', () => {
    const result = parseSmilesLine('C1=CC=CC=C1 // Benzene');
    expect(result).toEqual({ smiles: 'C1=CC=CC=C1', label: 'Benzene' });
  });

  it('returns null for empty lines', () => {
    expect(parseSmilesLine('')).toBeNull();
    expect(parseSmilesLine('   ')).toBeNull();
  });

  it('returns null for comment lines', () => {
    expect(parseSmilesLine('// This is a comment')).toBeNull();
  });

  it('handles trailing label with empty comment', () => {
    const result = parseSmilesLine('CCO //');
    expect(result).toEqual({ smiles: 'CCO', label: undefined });
  });

  it('trims whitespace', () => {
    const result = parseSmilesLine('  C1=CC=CC=C1  ');
    expect(result).toEqual({ smiles: 'C1=CC=CC=C1' });
  });
});

describe('parseSmilesBlock', () => {
  it('parses multiple lines', () => {
    const body = 'C1=CC=CC=C1 // Benzene\nCC(=O)O // Acetic acid\n';
    const entries = parseSmilesBlock(body);
    expect(entries).toHaveLength(2);
    expect(entries[0].smiles).toBe('C1=CC=CC=C1');
    expect(entries[0].label).toBe('Benzene');
    expect(entries[1].smiles).toBe('CC(=O)O');
  });

  it('skips empty lines and comments', () => {
    const body = '// Header\n\nC1=CC=CC=C1\n\n// Footer\n';
    const entries = parseSmilesBlock(body);
    expect(entries).toHaveLength(1);
  });

  it('returns empty for blank input', () => {
    expect(parseSmilesBlock('')).toEqual([]);
    expect(parseSmilesBlock('\n\n')).toEqual([]);
  });
});

describe('findSmilesBlocks', () => {
  it('finds a single smiles code block', () => {
    const text = 'Hello\n```smiles\nC1=CC=CC=C1\n```\nWorld';
    const blocks = findSmilesBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries).toHaveLength(1);
    expect(blocks[0].entries[0].smiles).toBe('C1=CC=CC=C1');
  });

  it('finds multiple blocks', () => {
    const text = '```smiles\nCCO\n```\nSome text\n```smiles\nCC\n```';
    const blocks = findSmilesBlocks(text);
    expect(blocks).toHaveLength(2);
  });

  it('ignores non-smiles code blocks', () => {
    const text = '```js\nconsole.log("hi")\n```\n```smiles\nCCO\n```';
    const blocks = findSmilesBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries[0].smiles).toBe('CCO');
  });

  it('skips blocks with only comments', () => {
    const text = '```smiles\n// just a comment\n```';
    const blocks = findSmilesBlocks(text);
    expect(blocks).toHaveLength(0);
  });

  it('records from/to positions', () => {
    const text = '```smiles\nCCO\n```';
    const blocks = findSmilesBlocks(text);
    expect(blocks[0].from).toBe(0);
    expect(blocks[0].to).toBe(text.length);
  });

  it('returns empty for no blocks', () => {
    expect(findSmilesBlocks('No blocks here')).toEqual([]);
  });
});

describe('findInlineSmiles', () => {
  it('finds default inline syntax', () => {
    const text = 'See $smiles=C1=CC=CC=C1 for benzene';
    const results = findInlineSmiles(text);
    expect(results).toHaveLength(1);
    expect(results[0].smiles).toBe('C1=CC=CC=C1');
  });

  it('finds multiple inline SMILES', () => {
    const text = '$smiles=CCO and $smiles=CC(=O)O';
    const results = findInlineSmiles(text);
    expect(results).toHaveLength(2);
  });

  it('supports custom prefix', () => {
    const text = 'mol:CCO here';
    const results = findInlineSmiles(text, 'mol:');
    expect(results).toHaveLength(1);
    expect(results[0].smiles).toBe('CCO');
  });

  it('returns empty for no matches', () => {
    expect(findInlineSmiles('No smiles here')).toEqual([]);
  });

  it('returns empty for empty prefix', () => {
    expect(findInlineSmiles('$smiles=CCO', '')).toEqual([]);
  });

  it('records from/to positions', () => {
    const text = 'X $smiles=CCO Y';
    const results = findInlineSmiles(text);
    expect(results[0].from).toBe(2);
    expect(results[0].to).toBe(13);
  });

  it('stops at whitespace', () => {
    const text = '$smiles=C1=CC=CC=C1 end';
    const results = findInlineSmiles(text);
    expect(results[0].smiles).toBe('C1=CC=CC=C1');
  });
});

describe('sampleSmilesBlock', () => {
  it('generates a valid code block', () => {
    const block = sampleSmilesBlock();
    expect(block).toContain('```smiles');
    expect(block).toContain('```');
    expect(block).toContain('C1=CC=CC=C1');
    expect(block).toContain('Benzene');
  });
});
