import { describe, it, expect } from 'vitest';
import { executeQuery } from '../queryEngine';
import { parseQuery, parseExpr } from '../queryParser';
import type { DvPage, DvTableResult, DvListResult, DvTaskResult, DvGroupedResult, DvCalendarResult } from '../../types/dataview';

function makePage(overrides: Partial<DvPage> & { name: string; fields?: Record<string, unknown> }): DvPage {
  const name = overrides.name;
  return {
    path: overrides.path ?? `${name}.md`,
    file: {
      name,
      path: overrides.path ?? `${name}.md`,
      folder: overrides.file?.folder ?? '',
      ext: 'md',
      link: { type: 'link', path: overrides.path ?? `${name}.md`, display: name },
      ctime: '2024-01-01',
      mtime: '2024-06-01',
      size: 0,
      tags: overrides.tags ?? [],
      outlinks: [],
      tasks: overrides.file?.tasks ?? [],
      day: null,
    },
    fields: (overrides.fields ?? {}) as Record<string, any>,
    inlineFields: [],
    tags: overrides.tags ?? [],
    sections: [],
  };
}

const BOOKS: DvPage[] = [
  makePage({ name: 'Dune', path: 'books/Dune.md', fields: { rating: 9, genre: 'sci-fi' }, tags: ['book', 'fiction'] }),
  makePage({ name: 'LOTR', path: 'books/LOTR.md', fields: { rating: 10, genre: 'fantasy' }, tags: ['book', 'fiction'] }),
  makePage({ name: 'Clean Code', path: 'books/Clean Code.md', fields: { rating: 7, genre: 'tech' }, tags: ['book', 'nonfiction'] }),
  makePage({ name: 'React Guide', path: 'guides/React.md', fields: { rating: 6, genre: 'tech' }, tags: ['guide'] }),
];

describe('executeQuery — TABLE', () => {
  it('returns a table with specified fields', () => {
    const q = parseQuery('TABLE rating, genre\nFROM "books"');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.type).toBe('table');
    expect(result.headers).toEqual(['File', 'rating', 'genre']);
    expect(result.rows).toHaveLength(3);
  });

  it('sorts results', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nSORT rating desc');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    const ratings = result.rows.map((r) => r[1]);
    expect(ratings).toEqual([10, 9, 7]);
  });

  it('filters with WHERE', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nWHERE rating > 8');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.rows).toHaveLength(2);
  });

  it('applies LIMIT', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nSORT rating desc\nLIMIT 2');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.rows).toHaveLength(2);
  });

  it('handles field aliases', () => {
    const q = parseQuery('TABLE rating AS "Score"\nFROM "books"');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.headers).toContain('Score');
  });
});

describe('executeQuery — LIST', () => {
  it('returns a list of matching pages', () => {
    const q = parseQuery('LIST\nFROM #book');
    const result = executeQuery(q, BOOKS) as DvListResult;
    expect(result.type).toBe('list');
    expect(result.items).toHaveLength(3);
  });

  it('handles OR in FROM', () => {
    const q = parseQuery('LIST\nFROM #fiction or #guide');
    const result = executeQuery(q, BOOKS) as DvListResult;
    expect(result.items).toHaveLength(3);
  });
});

describe('executeQuery — TASK', () => {
  it('collects tasks from matching pages', () => {
    const pages: DvPage[] = [
      makePage({
        name: 'Project',
        path: 'projects/project.md',
        tags: ['project'],
        file: {
          name: 'Project',
          path: 'projects/project.md',
          folder: 'projects',
          ext: 'md',
          link: { type: 'link', path: 'projects/project.md' },
          ctime: '2024-01-01',
          mtime: '2024-06-01',
          size: 0,
          tags: ['project'],
          outlinks: [],
          tasks: [
            { text: 'Fix bug', completed: false, line: 5, path: 'projects/project.md', tags: ['bug'] },
            { text: 'Write docs', completed: true, line: 6, path: 'projects/project.md', tags: [] },
          ],
          day: null,
        },
      }),
    ];
    const q = parseQuery('TASK\nFROM #project');
    const result = executeQuery(q, pages) as DvTaskResult;
    expect(result.type).toBe('task');
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].text).toBe('Fix bug');
  });
});

describe('executeQuery — WHERE expressions', () => {
  it('evaluates equality', () => {
    const q = parseQuery('LIST\nFROM "books"\nWHERE genre = "sci-fi"');
    const result = executeQuery(q, BOOKS) as DvListResult;
    expect(result.items).toHaveLength(1);
  });

  it('evaluates inequality', () => {
    const q = parseQuery('LIST\nFROM "books"\nWHERE genre != "tech"');
    const result = executeQuery(q, BOOKS) as DvListResult;
    expect(result.items).toHaveLength(2);
  });

  it('evaluates contains', () => {
    const q = parseQuery('LIST\nFROM "books"\nWHERE genre contains "fi"');
    const result = executeQuery(q, BOOKS) as DvListResult;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].page.display).toBe('Dune');
  });
});

describe('executeQuery — file.* fields', () => {
  it('resolves file.name', () => {
    const q = parseQuery('TABLE file.name\nFROM "books"\nLIMIT 1');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.rows[0][1]).toBe('Dune');
  });
});

// ─── New expanded tests ──────────────────────────────────────────────────────

describe('math expressions', () => {
  it('evaluates addition in TABLE columns', () => {
    const q = parseQuery('TABLE rating + 1 AS "Adjusted"\nFROM "books"\nLIMIT 1');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.rows[0][1]).toBe(10);
  });

  it('evaluates multiplication', () => {
    const q = parseQuery('TABLE rating * 2\nFROM "books"\nWHERE rating = 9');
    const result = executeQuery(q, BOOKS) as DvTableResult;
    expect(result.rows[0][1]).toBe(18);
  });

  it('evaluates division with zero guard', () => {
    const pages = [makePage({ name: 'z', fields: { a: 10, b: 0 } })];
    const q = parseQuery('TABLE a / b\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toBeNull();
  });

  it('evaluates modulo', () => {
    const pages = [makePage({ name: 'z', fields: { val: 17 } })];
    const q = parseQuery('TABLE val % 5\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toBe(2);
  });

  it('string concatenation with +', () => {
    const pages = [makePage({ name: 'z', fields: { first: 'Hello', last: 'World' } })];
    const q = parseQuery('TABLE first + " " + last AS "Full"\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toBe('Hello World');
  });
});

describe('extended functions', () => {
  it('average/avg', () => {
    const pages = [makePage({ name: 'z', fields: { nums: [2, 4, 6] } })];
    const q = parseQuery('TABLE avg(nums)\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toBe(4);
  });

  it('join', () => {
    const pages = [makePage({ name: 'z', fields: { tags: ['a', 'b', 'c'] } })];
    const q = parseQuery('TABLE join(tags, " | ")\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toBe('a | b | c');
  });

  it('reverse', () => {
    const pages = [makePage({ name: 'z', fields: { items: [1, 2, 3] } })];
    const q = parseQuery('TABLE reverse(items)\nFROM ""');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows[0][1]).toEqual([3, 2, 1]);
  });

  it('abs/ceil/floor', () => {
    const pages = [makePage({ name: 'z', fields: { val: -3.7 } })];
    const q1 = parseQuery('TABLE abs(val)\nFROM ""');
    expect((executeQuery(q1, pages) as DvTableResult).rows[0][1]).toBe(3.7);
    const q2 = parseQuery('TABLE ceil(val)\nFROM ""');
    expect((executeQuery(q2, pages) as DvTableResult).rows[0][1]).toBe(-3);
    const q3 = parseQuery('TABLE floor(val)\nFROM ""');
    expect((executeQuery(q3, pages) as DvTableResult).rows[0][1]).toBe(-4);
  });

  it('startswith/endswith', () => {
    const pages = [makePage({ name: 'z', fields: { title: 'Hello World' } })];
    const q1 = parseQuery('TABLE startswith(title, "hello")\nFROM ""');
    expect((executeQuery(q1, pages) as DvTableResult).rows[0][1]).toBe(true);
    const q2 = parseQuery('TABLE endswith(title, "WORLD")\nFROM ""');
    expect((executeQuery(q2, pages) as DvTableResult).rows[0][1]).toBe(true);
  });

  it('replace', () => {
    const pages = [makePage({ name: 'z', fields: { s: 'foo-bar-baz' } })];
    const q = parseQuery('TABLE replace(s, "-", "_")\nFROM ""');
    expect((executeQuery(q, pages) as DvTableResult).rows[0][1]).toBe('foo_bar_baz');
  });

  it('nonnull filters nulls', () => {
    const pages = [makePage({ name: 'z', fields: { items: [1, null, 3, null] } })];
    const q = parseQuery('TABLE nonnull(items)\nFROM ""');
    expect((executeQuery(q, pages) as DvTableResult).rows[0][1]).toEqual([1, 3]);
  });

  it('regexmatch', () => {
    const pages = [makePage({ name: 'z', fields: { s: 'abc123' } })];
    const q = parseQuery('TABLE regexmatch(s, "[0-9]+")\nFROM ""');
    expect((executeQuery(q, pages) as DvTableResult).rows[0][1]).toBe(true);
  });

  it('typeof', () => {
    const pages = [makePage({ name: 'z', fields: { n: 42 } })];
    const q = parseQuery('TABLE typeof(n)\nFROM ""');
    expect((executeQuery(q, pages) as DvTableResult).rows[0][1]).toBe('number');
  });
});

describe('GROUP BY', () => {
  it('groups pages by field value', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nGROUP BY genre');
    const result = executeQuery(q, BOOKS) as DvGroupedResult;
    expect(result.type).toBe('grouped');
    expect(result.groups.length).toBeGreaterThanOrEqual(2);
    const genres = result.groups.map((g) => g.key);
    expect(genres).toContain('sci-fi');
    expect(genres).toContain('tech');
  });

  it('grouped result headers include Group', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nGROUP BY genre');
    const result = executeQuery(q, BOOKS) as DvGroupedResult;
    expect(result.headers[0]).toBe('Group');
    expect(result.headers).toContain('rating');
  });
});

describe('CALENDAR', () => {
  it('produces calendar items from pages with dates', () => {
    const pages = [
      makePage({ name: '2024-01-15 Meeting', fields: { date: new Date('2024-01-15') } }),
      makePage({ name: '2024-02-20 Review', fields: { date: new Date('2024-02-20') } }),
      makePage({ name: 'No date', fields: {} }),
    ];
    const q = parseQuery('CALENDAR date');
    const result = executeQuery(q, pages) as DvCalendarResult;
    expect(result.type).toBe('calendar');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].date).toBeInstanceOf(Date);
  });
});

describe('FLATTEN', () => {
  it('expands array fields into separate rows', () => {
    const pages = [
      makePage({ name: 'a', fields: { tags: ['x', 'y', 'z'] } }),
      makePage({ name: 'b', fields: { tags: ['w'] } }),
    ];
    const q = parseQuery('TABLE tags\nFLATTEN tags');
    const result = executeQuery(q, pages) as DvTableResult;
    expect(result.rows).toHaveLength(4);
  });
});

describe('query timing', () => {
  it('includes timing metadata in results', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nLIMIT 2');
    const result = executeQuery(q, BOOKS);
    expect(result.timing).toBeDefined();
    expect(result.timing!.totalMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.timing!.filterMs).toBe('number');
    expect(typeof result.timing!.renderMs).toBe('number');
    expect(typeof result.timing!.autoLimited).toBe('boolean');
    expect(typeof result.timing!.unfilteredCount).toBe('number');
  });

  it('auto-limit is false when explicit LIMIT set', () => {
    const q = parseQuery('TABLE rating\nFROM "books"\nLIMIT 2');
    const result = executeQuery(q, BOOKS);
    expect(result.timing!.autoLimited).toBe(false);
  });
});

describe('expression parser enhancements', () => {
  it('parses parenthesized expressions', () => {
    const expr = parseExpr('(rating + 1) * 2');
    expect(expr.type).toBe('binary');
  });

  it('parses list literal', () => {
    const expr = parseExpr('[1, 2, 3]');
    expect(expr.type).toBe('literal');
    expect((expr as any).value).toEqual([1, 2, 3]);
  });

  it('parses duration literal via dur() function', () => {
    const expr = parseExpr('dur("1d2h")');
    // dur() is parsed as a function call first; the engine evaluates it
    // The parser handles dur("...") as a literal only before function matching
    // Since function regex matches first, let's verify the function form
    expect(expr.type).toBe('function');
    expect((expr as any).name).toBe('dur');
  });

  it('parses nested function calls', () => {
    const expr = parseExpr('lower(join(tags, ","))');
    expect(expr.type).toBe('function');
    expect((expr as any).name).toBe('lower');
    expect((expr as any).args[0].type).toBe('function');
  });
});
