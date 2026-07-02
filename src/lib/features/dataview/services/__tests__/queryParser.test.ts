import { describe, it, expect } from 'vitest';
import { parseQuery, parseExpr } from '../queryParser';

describe('parseQuery', () => {
  it('parses a basic TABLE query', () => {
    const q = parseQuery('TABLE rating, genre\nFROM "books"\nSORT rating desc');
    expect(q.type).toBe('table');
    expect(q.fields).toHaveLength(2);
    expect(q.fields[0].expr).toEqual({ type: 'field', path: 'rating' });
    expect(q.fields[1].expr).toEqual({ type: 'field', path: 'genre' });
    expect(q.from).toEqual({ type: 'folder', value: 'books' });
    expect(q.sort).toHaveLength(1);
    expect(q.sort[0].direction).toBe('desc');
  });

  it('parses a TABLE query with AS aliases', () => {
    const q = parseQuery('TABLE file.name AS "File", rating AS "Rating"\nFROM #book');
    expect(q.fields[0].alias).toBe('File');
    expect(q.fields[0].expr).toEqual({ type: 'field', path: 'file.name' });
    expect(q.fields[1].alias).toBe('Rating');
    expect(q.from).toEqual({ type: 'tag', value: '#book' });
  });

  it('parses a LIST query', () => {
    const q = parseQuery('LIST\nFROM #game/moba or #game/crpg');
    expect(q.type).toBe('list');
    expect(q.from?.type).toBe('tag');
    expect(q.from?.combinator).toBe('or');
    expect(q.from?.right?.value).toBe('#game/crpg');
  });

  it('parses a TASK query', () => {
    const q = parseQuery('TASK\nFROM #projects/active');
    expect(q.type).toBe('task');
    expect(q.from).toEqual({ type: 'tag', value: '#projects/active' });
  });

  it('parses WHERE clause', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nWHERE rating > 7');
    expect(q.where).toBeTruthy();
    expect(q.where?.type).toBe('binary');
  });

  it('parses LIMIT clause', () => {
    const q = parseQuery('TABLE title\nFROM "books"\nLIMIT 10');
    expect(q.limit).toBe(10);
  });

  it('parses GROUP BY clause', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nGROUP BY genre');
    expect(q.groupBy).toEqual({ type: 'field', path: 'genre' });
  });

  it('parses SORT with multiple fields', () => {
    const q = parseQuery('TABLE title\nFROM "books"\nSORT genre asc, rating desc');
    expect(q.sort).toHaveLength(2);
    expect(q.sort[0].direction).toBe('asc');
    expect(q.sort[1].direction).toBe('desc');
  });

  it('parses FROM with AND combinator', () => {
    const q = parseQuery('LIST\nFROM #book and #fiction');
    expect(q.from?.combinator).toBe('and');
    expect(q.from?.right?.value).toBe('#fiction');
  });
});

describe('parseExpr', () => {
  it('parses a field reference', () => {
    expect(parseExpr('rating')).toEqual({ type: 'field', path: 'rating' });
  });

  it('parses a number literal', () => {
    expect(parseExpr('42')).toEqual({ type: 'literal', value: 42 });
  });

  it('parses a string literal', () => {
    expect(parseExpr('"hello"')).toEqual({ type: 'literal', value: 'hello' });
  });

  it('parses boolean literals', () => {
    expect(parseExpr('true')).toEqual({ type: 'literal', value: true });
    expect(parseExpr('false')).toEqual({ type: 'literal', value: false });
  });

  it('parses a comparison expression', () => {
    const expr = parseExpr('rating > 7');
    expect(expr.type).toBe('binary');
    if (expr.type === 'binary') {
      expect(expr.op).toBe('>');
      expect(expr.left).toEqual({ type: 'field', path: 'rating' });
      expect(expr.right).toEqual({ type: 'literal', value: 7 });
    }
  });

  it('parses a function call', () => {
    const expr = parseExpr('length(tags)');
    expect(expr.type).toBe('function');
    if (expr.type === 'function') {
      expect(expr.name).toBe('length');
      expect(expr.args).toHaveLength(1);
    }
  });

  it('parses contains operator', () => {
    const expr = parseExpr('genre contains "fiction"');
    expect(expr.type).toBe('binary');
    if (expr.type === 'binary') {
      expect(expr.op).toBe('contains');
    }
  });

  it('parses AND/OR expressions', () => {
    const expr = parseExpr('rating > 7 and genre = "fiction"');
    expect(expr.type).toBe('binary');
    if (expr.type === 'binary') {
      expect(expr.op).toBe('and');
    }
  });
});
