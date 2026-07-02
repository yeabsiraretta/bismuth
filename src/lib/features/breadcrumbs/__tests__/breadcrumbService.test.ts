import { describe, it, expect } from 'vitest';
import {
  buildTrail,
  buildContext,
  parseWikilinkValue,
  resolveSiblings,
} from '../breadcrumbService';

describe('buildTrail', () => {
  const vault = '/Users/test/vault';

  it('builds segments from vault-relative path', () => {
    const trail = buildTrail(`${vault}/folder/note.md`, vault);
    expect(trail).toHaveLength(2);
    expect(trail[0]).toEqual({
      label: 'folder',
      path: `${vault}/folder`,
      isActive: false,
      type: 'folder',
    });
    expect(trail[1]).toEqual({
      label: 'note',
      path: `${vault}/folder/note.md`,
      isActive: true,
      type: 'note',
    });
  });

  it('handles root-level note', () => {
    const trail = buildTrail(`${vault}/note.md`, vault);
    expect(trail).toHaveLength(1);
    expect(trail[0].label).toBe('note');
    expect(trail[0].isActive).toBe(true);
    expect(trail[0].type).toBe('note');
  });

  it('handles deeply nested paths', () => {
    const trail = buildTrail(`${vault}/a/b/c/note.md`, vault);
    expect(trail).toHaveLength(4);
    expect(trail[0].label).toBe('a');
    expect(trail[1].label).toBe('b');
    expect(trail[2].label).toBe('c');
    expect(trail[3].label).toBe('note');
    expect(trail[3].isActive).toBe(true);
  });

  it('strips .md from note label', () => {
    const trail = buildTrail(`${vault}/My Note.md`, vault);
    expect(trail[0].label).toBe('My Note');
  });

  it('returns empty for empty path', () => {
    expect(buildTrail('', vault)).toEqual([]);
  });

  it('returns empty for empty vault', () => {
    expect(buildTrail('/some/path.md', '')).toEqual([]);
  });

  it('handles trailing slash on vault root', () => {
    const trail = buildTrail(`${vault}/note.md`, `${vault}/`);
    expect(trail).toHaveLength(1);
    expect(trail[0].label).toBe('note');
  });
});

describe('parseWikilinkValue', () => {
  it('parses [[Note Name]]', () => {
    expect(parseWikilinkValue('[[My Note]]')).toBe('My Note');
  });

  it('strips alias from [[Note|alias]]', () => {
    expect(parseWikilinkValue('[[My Note|display]]')).toBe('My Note');
  });

  it('strips heading from [[Note#heading]]', () => {
    expect(parseWikilinkValue('[[My Note#Section]]')).toBe('My Note');
  });

  it('handles plain string', () => {
    expect(parseWikilinkValue('My Note')).toBe('My Note');
  });

  it('returns null for empty string', () => {
    expect(parseWikilinkValue('')).toBeNull();
  });

  it('returns null for non-string', () => {
    expect(parseWikilinkValue(42)).toBeNull();
    expect(parseWikilinkValue(null)).toBeNull();
    expect(parseWikilinkValue(undefined)).toBeNull();
  });
});

describe('buildContext', () => {
  const vault = '/Users/test/vault';

  it('builds context with trail', () => {
    const ctx = buildContext(`${vault}/folder/note.md`, vault, {});
    expect(ctx.trail).toHaveLength(2);
    expect(ctx.parent).toBeNull();
    expect(ctx.prev).toBeNull();
    expect(ctx.next).toBeNull();
  });

  it('extracts parent from frontmatter', () => {
    const ctx = buildContext(`${vault}/note.md`, vault, {
      parent: '[[Parent Note]]',
    });
    expect(ctx.parent).toBe('Parent Note');
  });

  it('extracts up as parent', () => {
    const ctx = buildContext(`${vault}/note.md`, vault, {
      up: '[[Parent Note]]',
    });
    expect(ctx.parent).toBe('Parent Note');
  });

  it('extracts prev/next from frontmatter', () => {
    const ctx = buildContext(`${vault}/note.md`, vault, {
      prev: '[[Prev Note]]',
      next: '[[Next Note]]',
    });
    expect(ctx.prev).toBe('Prev Note');
    expect(ctx.next).toBe('Next Note');
  });

  it('handles previous as alias for prev', () => {
    const ctx = buildContext(`${vault}/note.md`, vault, {
      previous: '[[Prev Note]]',
    });
    expect(ctx.prev).toBe('Prev Note');
  });
});

describe('resolveSiblings', () => {
  it('finds prev and next siblings', () => {
    const paths = ['/v/a.md', '/v/b.md', '/v/c.md'];
    const result = resolveSiblings('/v/b.md', paths);
    expect(result.prev).toBe('/v/a.md');
    expect(result.next).toBe('/v/c.md');
  });

  it('returns null prev for first sibling', () => {
    const paths = ['/v/a.md', '/v/b.md'];
    const result = resolveSiblings('/v/a.md', paths);
    expect(result.prev).toBeNull();
    expect(result.next).toBe('/v/b.md');
  });

  it('returns null next for last sibling', () => {
    const paths = ['/v/a.md', '/v/b.md'];
    const result = resolveSiblings('/v/b.md', paths);
    expect(result.prev).toBe('/v/a.md');
    expect(result.next).toBeNull();
  });

  it('returns both null for single note', () => {
    const result = resolveSiblings('/v/a.md', ['/v/a.md']);
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it('returns both null if note not found', () => {
    const result = resolveSiblings('/v/x.md', ['/v/a.md', '/v/b.md']);
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });
});
