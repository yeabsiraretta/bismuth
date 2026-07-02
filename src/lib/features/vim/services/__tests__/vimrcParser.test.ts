import { describe, it, expect } from 'vitest';
import { parseVimrc, expandLeader, extractLeader, extractSetOptions } from '../vimrcParser';

describe('parseVimrc', () => {
  it('parses blank and comment lines without error', () => {
    const result = parseVimrc('  \n" this is a comment\n\n');
    expect(result.commands).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('parses nmap commands', () => {
    const result = parseVimrc('nmap j gj\nnmap k gk');
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]).toMatchObject({ type: 'nmap', args: ['j', 'gj'], line: 1 });
    expect(result.commands[1]).toMatchObject({ type: 'nmap', args: ['k', 'gk'], line: 2 });
  });

  it('parses imap and vmap commands', () => {
    const result = parseVimrc('imap jk <Esc>\nvmap < <gv');
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0].type).toBe('imap');
    expect(result.commands[1].type).toBe('vmap');
  });

  it('parses noremap commands', () => {
    const result = parseVimrc('noremap H ^');
    expect(result.commands[0]).toMatchObject({ type: 'noremap', args: ['H', '^'] });
  });

  it('parses unmap commands', () => {
    const result = parseVimrc('unmap j\nnunmap k\niunmap jk\nvunmap <');
    expect(result.commands).toHaveLength(4);
    expect(result.commands.map((c) => c.type)).toEqual(['unmap', 'nunmap', 'iunmap', 'vunmap']);
  });

  it('parses exmap commands', () => {
    const result = parseVimrc('exmap togglefold obcommand editor:toggle-fold');
    expect(result.commands[0]).toMatchObject({
      type: 'exmap',
      args: ['togglefold', 'obcommand', 'editor:toggle-fold'],
    });
  });

  it('parses set commands', () => {
    const result = parseVimrc('set clipboard=unnamed\nset tabstop=4');
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]).toMatchObject({ type: 'set', args: ['clipboard=unnamed'] });
  });

  it('parses let mapleader', () => {
    const result = parseVimrc('let mapleader = " "');
    expect(result.commands[0].type).toBe('let');
    expect(result.commands[0].raw).toContain('mapleader');
  });

  it('reports errors for unknown commands', () => {
    const result = parseVimrc('foobar arg1 arg2');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ line: 1, message: 'Unknown command: foobar' });
    expect(result.commands[0].type).toBe('unknown');
  });

  it('reports errors for map with no args', () => {
    const result = parseVimrc('nmap');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('requires at least 1 argument');
  });

  it('reports errors for exmap with only one arg', () => {
    const result = parseVimrc('exmap justName');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('exmap requires a name and command');
  });

  it('strips inline comments', () => {
    const result = parseVimrc('nmap j gj " go down visual line');
    expect(result.commands[0].args).toEqual(['j', 'gj']);
  });

  it('handles mixed content correctly', () => {
    const vimrc = `
" My vimrc
let mapleader = ","

nmap j gj
nmap k gk
set clipboard=unnamed

exmap togglefold obcommand editor:toggle-fold
nmap <leader>z :togglefold
`;
    const result = parseVimrc(vimrc);
    expect(result.commands).toHaveLength(6);
    expect(result.errors).toHaveLength(0);
  });

  it('is case-insensitive for command names', () => {
    const result = parseVimrc('NMAP j gj\nSet clipboard=unnamed');
    expect(result.commands[0].type).toBe('nmap');
    expect(result.commands[1].type).toBe('set');
  });
});

describe('expandLeader', () => {
  it('replaces <leader> with the leader key', () => {
    expect(expandLeader('<leader>f', ',')).toBe(',f');
  });

  it('is case-insensitive', () => {
    expect(expandLeader('<Leader>p', ' ')).toBe(' p');
  });

  it('handles multiple leader occurrences', () => {
    expect(expandLeader('<leader><leader>x', ',')).toBe(',,x');
  });

  it('returns unchanged string if no leader token', () => {
    expect(expandLeader('gj', ',')).toBe('gj');
  });
});

describe('extractLeader', () => {
  it('returns default backslash when no mapleader set', () => {
    const { commands } = parseVimrc('nmap j gj');
    expect(extractLeader(commands)).toBe('\\');
  });

  it('extracts leader from let mapleader', () => {
    const { commands } = parseVimrc('let mapleader = ","');
    expect(extractLeader(commands)).toBe(',');
  });

  it('uses the last mapleader definition', () => {
    const { commands } = parseVimrc('let mapleader = ","\nlet mapleader = " "');
    expect(extractLeader(commands)).toBe(' ');
  });
});

describe('extractSetOptions', () => {
  it('extracts key=value options', () => {
    const { commands } = parseVimrc('set clipboard=unnamed\nset tabstop=4');
    const opts = extractSetOptions(commands);
    expect(opts).toHaveLength(2);
    expect(opts[0]).toEqual({ key: 'clipboard', value: 'unnamed' });
    expect(opts[1]).toEqual({ key: 'tabstop', value: '4' });
  });

  it('extracts boolean options (no = sign)', () => {
    const { commands } = parseVimrc('set number');
    const opts = extractSetOptions(commands);
    expect(opts[0]).toEqual({ key: 'number', value: true });
  });

  it('returns empty array when no set commands', () => {
    const { commands } = parseVimrc('nmap j gj');
    expect(extractSetOptions(commands)).toHaveLength(0);
  });
});
