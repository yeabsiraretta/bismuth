import { describe, it, expect } from 'vitest';
import {
  formatDate,
  expandVariables,
  sanitizePath,
  resolveRootPath,
  findOverride,
  isExcludedPath,
  isExcludedExtension,
  buildAttachmentPath,
  buildContext,
  extractNoteName,
  extractDir,
  extractParent,
} from '../services/pathResolver';
import { DEFAULT_ATTACHMENT_CONFIG } from '../types';
import type { AttachmentOverride, AttachmentPathContext } from '../types';

const fixedDate = new Date(2026, 0, 15, 14, 30, 45, 123);

const mkCtx = (overrides?: Partial<AttachmentPathContext>): AttachmentPathContext => ({
  notePath: 'notes/projects',
  noteName: 'hello-world',
  parentFolder: 'projects',
  originalName: 'screenshot',
  md5: 'abc123def456',
  date: fixedDate,
  ...overrides,
});

describe('formatDate', () => {
  it('formats all components', () => {
    expect(formatDate(fixedDate, 'YYYYMMDDHHmmssSSS')).toBe('20260115143045123');
  });
  it('handles partial formats', () => {
    expect(formatDate(fixedDate, 'YYYY-MM-DD')).toBe('2026-01-15');
  });
});

describe('expandVariables', () => {
  it('expands all supported variables', () => {
    const result = expandVariables(
      '${notepath}/${notename}/${parent}-${originalname}-${md5}-${date}',
      mkCtx(),
      'YYYYMMDD'
    );
    expect(result).toBe('notes/projects/hello-world/projects-screenshot-abc123def456-20260115');
  });
  it('handles missing variables gracefully', () => {
    const result = expandVariables('${unknown}', mkCtx(), 'YYYY');
    expect(result).toBe('${unknown}');
  });
});

describe('sanitizePath', () => {
  it('strips unsafe characters', () => {
    expect(sanitizePath('foo:bar<baz>')).toBe('foo_bar_baz_');
  });
  it('collapses double slashes', () => {
    expect(sanitizePath('a//b///c')).toBe('a/b/c');
  });
});

describe('resolveRootPath', () => {
  it('obsidian mode uses vault root', () => {
    const cfg = { ...DEFAULT_ATTACHMENT_CONFIG, rootPathMode: 'obsidian' as const };
    expect(resolveRootPath(cfg, '/vault/notes', '/vault')).toBe('/vault');
  });
  it('fixed mode uses fixedRoot', () => {
    const cfg = {
      ...DEFAULT_ATTACHMENT_CONFIG,
      rootPathMode: 'fixed' as const,
      fixedRoot: 'media',
    };
    expect(resolveRootPath(cfg, '/vault/notes', '/vault')).toBe('/vault/media');
  });
  it('subfolder mode uses note dir + subfolder', () => {
    const cfg = {
      ...DEFAULT_ATTACHMENT_CONFIG,
      rootPathMode: 'subfolder' as const,
      subfolderName: 'assets',
    };
    expect(resolveRootPath(cfg, '/vault/notes', '/vault')).toBe('/vault/notes/assets');
  });
});

describe('findOverride', () => {
  const overrides: AttachmentOverride[] = [
    {
      id: '1',
      targetPath: '/vault/notes/hello.md',
      targetType: 'file',
      attachmentPath: 'fp',
      attachmentFormat: 'ff',
      dateFormat: '',
    },
    {
      id: '2',
      targetPath: '/vault/notes',
      targetType: 'folder',
      attachmentPath: 'dp',
      attachmentFormat: 'df',
      dateFormat: '',
    },
    {
      id: '3',
      targetPath: 'pdf',
      targetType: 'extension',
      attachmentPath: 'ep',
      attachmentFormat: 'ef',
      dateFormat: '',
    },
  ];

  it('file override takes priority', () => {
    expect(findOverride(overrides, '/vault/notes/hello.md', '.png')?.id).toBe('1');
  });
  it('folder override when no file match', () => {
    expect(findOverride(overrides, '/vault/notes/other.md', '.png')?.id).toBe('2');
  });
  it('extension override matches', () => {
    expect(findOverride(overrides, '/vault/docs/x.md', '.pdf')?.id).toBe('3');
  });
  it('returns null when nothing matches', () => {
    expect(findOverride(overrides, '/other/path.md', '.jpg')).toBeNull();
  });
});

describe('isExcludedPath', () => {
  it('excludes exact folder', () => {
    expect(isExcludedPath('templates/foo.md', 'templates', false)).toBe(true);
  });
  it('does not exclude unrelated path', () => {
    expect(isExcludedPath('notes/bar.md', 'templates', false)).toBe(false);
  });
  it('excludes subpaths when enabled', () => {
    expect(isExcludedPath('archive/2024/note.md', 'archive', true)).toBe(true);
  });
  it('handles semicolons', () => {
    expect(isExcludedPath('drafts/x.md', 'templates;drafts', false)).toBe(true);
  });
});

describe('isExcludedExtension', () => {
  it('matches regex pattern', () => {
    expect(isExcludedExtension('.exe', 'exe|dll')).toBe(true);
  });
  it('does not match unrelated', () => {
    expect(isExcludedExtension('.png', 'exe|dll')).toBe(false);
  });
  it('empty pattern excludes nothing', () => {
    expect(isExcludedExtension('.png', '')).toBe(false);
  });
});

describe('buildAttachmentPath', () => {
  it('builds correct full path with subfolder mode', () => {
    const cfg = { ...DEFAULT_ATTACHMENT_CONFIG };
    const ctx = mkCtx({ notePath: '/vault/notes' });
    const result = buildAttachmentPath(cfg, [], ctx, '.png', '/vault');
    expect(result).toContain('.png');
    expect(result).toContain('hello-world');
    expect(result).toContain('assets');
  });

  it('builds correct full path with fixed mode', () => {
    const cfg = {
      ...DEFAULT_ATTACHMENT_CONFIG,
      rootPathMode: 'fixed' as const,
      fixedRoot: 'media',
    };
    const ctx = mkCtx({ notePath: '/vault/notes' });
    const result = buildAttachmentPath(cfg, [], ctx, '.png', '/vault');
    expect(result).toContain('/vault/media');
    expect(result).toContain('.png');
  });
});

describe('extraction helpers', () => {
  it('extractNoteName works', () => {
    expect(extractNoteName('/vault/notes/Hello.md')).toBe('Hello');
  });
  it('extractDir works', () => {
    expect(extractDir('/vault/notes/Hello.md')).toBe('/vault/notes');
  });
  it('extractParent works', () => {
    expect(extractParent('/vault/notes/Hello.md')).toBe('notes');
  });
});

describe('buildContext', () => {
  it('fills all fields', () => {
    const ctx = buildContext('/vault/notes/Hello.md', 'orig', 'md5hash');
    expect(ctx.notePath).toBe('/vault/notes');
    expect(ctx.noteName).toBe('Hello');
    expect(ctx.parentFolder).toBe('notes');
    expect(ctx.originalName).toBe('orig');
    expect(ctx.md5).toBe('md5hash');
    expect(ctx.date).toBeInstanceOf(Date);
  });
});
