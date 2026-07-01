import { describe, it, expect } from 'vitest';
import type { Note } from '@/types/data/vault';
import type { WaypointConfig } from '../../types/waypoint';
import { DEFAULT_WAYPOINT_CONFIG } from '../../types/waypoint';
import {
  stemOf,
  parentDir,
  folderName,
  isFolderNote,
  findFolderNotes,
  findMarkers,
  getMarkerKind,
  collectTocEntries,
  renderToc,
  generateWaypointBlock,
  updateNoteContent,
  folderNoteContent,
  folderNotePath,
} from '../waypointService';

const cfg: WaypointConfig = { ...DEFAULT_WAYPOINT_CONFIG };

function makeNote(path: string, content = ''): Note {
  return { path, title: stemOf(path), content, frontmatter: {}, created_at: '', modified_at: '' };
}

// ─── Path helpers ───────────────────────────────────────────────────────────

describe('stemOf', () => {
  it('extracts stem from a file path', () => {
    expect(stemOf('/vault/notes/hello.md')).toBe('hello');
  });
  it('handles no extension', () => {
    expect(stemOf('/vault/README')).toBe('README');
  });
  it('handles deeply nested paths', () => {
    expect(stemOf('/a/b/c/d/test.txt')).toBe('test');
  });
});

describe('parentDir', () => {
  it('returns parent directory', () => {
    expect(parentDir('/vault/notes/hello.md')).toBe('/vault/notes');
  });
  it('returns empty for root-level file', () => {
    expect(parentDir('hello.md')).toBe('');
  });
});

describe('folderName', () => {
  it('extracts folder name', () => {
    expect(folderName('/vault/notes')).toBe('notes');
  });
});

// ─── Folder note detection ──────────────────────────────────────────────────

describe('isFolderNote', () => {
  it('detects folder notes (filename matches parent folder)', () => {
    expect(isFolderNote('/vault/Latin/Latin.md')).toBe(true);
  });
  it('rejects non-folder notes', () => {
    expect(isFolderNote('/vault/Latin/vocab.md')).toBe(false);
  });
  it('rejects root-level notes', () => {
    expect(isFolderNote('note.md')).toBe(false);
  });
});

describe('findFolderNotes', () => {
  it('maps folder paths to folder note paths', () => {
    const notes = [
      makeNote('/vault/Latin/Latin.md'),
      makeNote('/vault/Latin/vocab.md'),
      makeNote('/vault/History/History.md'),
    ];
    const map = findFolderNotes(notes);
    expect(map.size).toBe(2);
    expect(map.get('/vault/Latin')).toBe('/vault/Latin/Latin.md');
    expect(map.get('/vault/History')).toBe('/vault/History/History.md');
  });
});

// ─── Marker scanning ────────────────────────────────────────────────────────

describe('findMarkers', () => {
  it('finds waypoint trigger', () => {
    const content = '# Title\n\n%% Waypoint %%\n';
    const markers = findMarkers(content, cfg);
    expect(markers).toHaveLength(1);
    expect(markers[0].kind).toBe('waypoint');
    expect(markers[0].line).toBe(2);
  });

  it('finds landmark trigger', () => {
    const content = '%% Landmark %%\n';
    const markers = findMarkers(content, cfg);
    expect(markers).toHaveLength(1);
    expect(markers[0].kind).toBe('landmark');
  });

  it('finds both triggers', () => {
    const content = '%% Waypoint %%\n%% Landmark %%\n';
    const markers = findMarkers(content, cfg);
    expect(markers).toHaveLength(2);
  });

  it('ignores non-trigger text', () => {
    const content = '# Waypoint\nSome text about waypoints\n';
    expect(findMarkers(content, cfg)).toHaveLength(0);
  });

  it('uses custom trigger text', () => {
    const custom: WaypointConfig = { ...cfg, waypointTrigger: 'TOC' };
    const content = '%% TOC %%\n';
    expect(findMarkers(content, custom)).toHaveLength(1);
  });
});

describe('getMarkerKind', () => {
  it('returns waypoint when present', () => {
    expect(getMarkerKind('# X\n%% Waypoint %%\n', cfg)).toBe('waypoint');
  });
  it('returns landmark when present', () => {
    expect(getMarkerKind('%% Landmark %%\n', cfg)).toBe('landmark');
  });
  it('waypoint takes priority', () => {
    expect(getMarkerKind('%% Landmark %%\n%% Waypoint %%\n', cfg)).toBe('waypoint');
  });
  it('returns null when no markers', () => {
    expect(getMarkerKind('# Plain note\n', cfg)).toBeNull();
  });
});

// ─── TOC generation ─────────────────────────────────────────────────────────

describe('collectTocEntries', () => {
  const allNotes = [
    makeNote('/vault/Latin/Latin.md'),
    makeNote('/vault/Latin/intro.md'),
    makeNote('/vault/Latin/Chapter1/Chapter1.md'),
    makeNote('/vault/Latin/Chapter1/vocab.md'),
    makeNote('/vault/Latin/Chapter1/grammar.md'),
    makeNote('/vault/Latin/Chapter2/Chapter2.md'),
    makeNote('/vault/Latin/Chapter2/verbs.md'),
  ];

  const fnMap = new Map([
    ['/vault/Latin', '/vault/Latin/Latin.md'],
    ['/vault/Latin/Chapter1', '/vault/Latin/Chapter1/Chapter1.md'],
    ['/vault/Latin/Chapter2', '/vault/Latin/Chapter2/Chapter2.md'],
  ]);

  it('collects all entries without pruning', () => {
    const markerMap = new Map<string, 'waypoint' | 'landmark'>();
    const entries = collectTocEntries('/vault/Latin', allNotes, fnMap, markerMap, cfg);
    // Should include everything except the Latin.md folder note itself
    expect(entries.length).toBe(6);
  });

  it('prunes at nested waypoints', () => {
    const markerMap = new Map<string, 'waypoint' | 'landmark'>([
      ['/vault/Latin/Chapter1/Chapter1.md', 'waypoint'],
    ]);
    const entries = collectTocEntries('/vault/Latin', allNotes, fnMap, markerMap, cfg);
    // Chapter1 contents pruned — only Chapter1.md folder note + intro + Chapter2 stuff
    const names = entries.map(e => e.name);
    expect(names).toContain('Chapter1');
    expect(names).not.toContain('vocab');
    expect(names).not.toContain('grammar');
    expect(names).toContain('verbs');
  });

  it('landmarks do NOT prune parent', () => {
    const markerMap = new Map<string, 'waypoint' | 'landmark'>([
      ['/vault/Latin/Chapter1/Chapter1.md', 'landmark'],
    ]);
    const entries = collectTocEntries('/vault/Latin', allNotes, fnMap, markerMap, cfg);
    const names = entries.map(e => e.name);
    // Landmark doesn't prune — all chapter1 files still visible
    expect(names).toContain('vocab');
    expect(names).toContain('grammar');
  });

  it('stopAtFolderNotes stops at any folder note', () => {
    const markerMap = new Map<string, 'waypoint' | 'landmark'>();
    const stopCfg = { ...cfg, stopAtFolderNotes: true };
    const entries = collectTocEntries('/vault/Latin', allNotes, fnMap, markerMap, stopCfg);
    const names = entries.map(e => e.name);
    // Folder notes prune even without markers
    expect(names).toContain('Chapter1');
    expect(names).toContain('Chapter2');
    expect(names).not.toContain('vocab');
    expect(names).not.toContain('verbs');
  });

  it('sorts folder notes before regular files', () => {
    const markerMap = new Map<string, 'waypoint' | 'landmark'>();
    const entries = collectTocEntries('/vault/Latin', allNotes, fnMap, markerMap, cfg);
    const depth1 = entries.filter(e => e.depth === 1);
    const folderNoteIdx = depth1.findIndex(e => e.isFolderNote);
    const regularIdx = depth1.findIndex(e => !e.isFolderNote);
    if (folderNoteIdx >= 0 && regularIdx >= 0) {
      expect(folderNoteIdx).toBeLessThan(regularIdx);
    }
  });
});

// ─── TOC rendering ──────────────────────────────────────────────────────────

describe('renderToc', () => {
  it('renders wikilinks with indentation', () => {
    const entries = [
      { name: 'intro', path: '/vault/Latin/intro.md', depth: 0, isFolderNote: false },
      { name: 'Chapter1', path: '/vault/Latin/Chapter1/Chapter1.md', depth: 1, isFolderNote: true },
      { name: 'vocab', path: '/vault/Latin/Chapter1/vocab.md', depth: 1, isFolderNote: false },
    ];
    const result = renderToc(entries, cfg);
    expect(result).toBe('- [[intro]]\n  - [[Chapter1]]\n  - [[vocab]]');
  });

  it('includes extension when configured', () => {
    const entries = [{ name: 'note', path: '/vault/note.md', depth: 0, isFolderNote: false }];
    const extCfg = { ...cfg, includeExtension: true };
    expect(renderToc(entries, extCfg)).toBe('- [[note.md]]');
  });

  it('uses custom indent', () => {
    const entries = [{ name: 'deep', path: '/vault/a/b/deep.md', depth: 2, isFolderNote: false }];
    const tabCfg = { ...cfg, indentString: '\t' };
    expect(renderToc(entries, tabCfg)).toBe('\t\t- [[deep]]');
  });
});

describe('generateWaypointBlock', () => {
  it('generates complete block with markers', () => {
    const entries = [{ name: 'note', path: '/vault/note.md', depth: 0, isFolderNote: false }];
    const block = generateWaypointBlock('waypoint', entries, cfg);
    expect(block).toContain('%% Begin Waypoint %%');
    expect(block).toContain('- [[note]]');
    expect(block).toContain('%% End Waypoint %%');
  });

  it('uses landmark markers for landmarks', () => {
    const entries = [{ name: 'note', path: '/vault/note.md', depth: 0, isFolderNote: false }];
    const block = generateWaypointBlock('landmark', entries, cfg);
    expect(block).toContain('%% Begin Landmark %%');
    expect(block).toContain('%% End Landmark %%');
  });
});

// ─── Content updating ───────────────────────────────────────────────────────

describe('updateNoteContent', () => {
  it('inserts block after trigger when no existing block', () => {
    const content = '# Latin\n\n%% Waypoint %%\n\nSome text.';
    const entries = [{ name: 'intro', path: '/vault/Latin/intro.md', depth: 0, isFolderNote: false }];
    const result = updateNoteContent(content, 'waypoint', entries, cfg);
    expect(result).not.toBeNull();
    expect(result).toContain('%% Waypoint %%');
    expect(result).toContain('%% Begin Waypoint %%');
    expect(result).toContain('- [[intro]]');
    expect(result).toContain('%% End Waypoint %%');
    expect(result).toContain('Some text.');
  });

  it('replaces existing block', () => {
    const content = '# Latin\n\n%% Waypoint %%\n\n%% Begin Waypoint %%\n- [[old]]\n%% End Waypoint %%\n\nOther text.';
    const entries = [{ name: 'new', path: '/vault/Latin/new.md', depth: 0, isFolderNote: false }];
    const result = updateNoteContent(content, 'waypoint', entries, cfg);
    expect(result).toContain('- [[new]]');
    expect(result).not.toContain('- [[old]]');
    expect(result).toContain('Other text.');
  });

  it('returns null if no trigger found', () => {
    const result = updateNoteContent('# No trigger here', 'waypoint', [], cfg);
    expect(result).toBeNull();
  });
});

// ─── Folder note creation ───────────────────────────────────────────────────

describe('folderNoteContent', () => {
  it('creates content with waypoint trigger', () => {
    const content = folderNoteContent('Latin', 'waypoint');
    expect(content).toContain('# Latin');
    expect(content).toContain('%% Waypoint %%');
  });

  it('creates content with landmark trigger', () => {
    const content = folderNoteContent('Latin', 'landmark');
    expect(content).toContain('%% Landmark %%');
  });

  it('creates content without marker', () => {
    const content = folderNoteContent('Latin', null);
    expect(content).toContain('# Latin');
    expect(content).not.toContain('%%');
  });
});

describe('folderNotePath', () => {
  it('computes correct path', () => {
    expect(folderNotePath('/vault/Latin')).toBe('/vault/Latin/Latin.md');
  });
  it('handles nested paths', () => {
    expect(folderNotePath('/vault/a/b/c')).toBe('/vault/a/b/c/c.md');
  });
});
