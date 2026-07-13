import { describe, expect, it } from 'vitest';

import {
  BEGIN_LANDMARK,
  BEGIN_WAYPOINT,
  buildFolderNoteContent,
  buildLinkTree,
  buildSimpleMoc,
  END_LANDMARK,
  END_WAYPOINT,
  findFolderNotes,
  findMarkers,
  findWaypointFolderSet,
  generateMocContent,
  getFolder,
  getNotesInFolder,
  hasGeneratedBlock,
  isFolderNote,
  LANDMARK_TRIGGER,
  type NotePath,
  updateMocInContent,
  WAYPOINT_TRIGGER,
} from '@/hubs/navigator/services/moc-service';

// ── Helpers ───────────────────────────────────────────────────────

function np(path: string, title?: string): NotePath {
  const t = title ?? path.split('/').pop()!.replace(/\.md$/i, '');
  return { path, title: t };
}

// ── isFolderNote ──────────────────────────────────────────────────

describe('isFolderNote', () => {
  it('returns true when filename matches parent folder', () => {
    expect(isFolderNote('projects/ML/ML.md')).toBe(true);
  });

  it('returns false when filename differs from parent folder', () => {
    expect(isFolderNote('projects/ML/notes.md')).toBe(false);
  });

  it('returns false for root-level notes', () => {
    expect(isFolderNote('notes.md')).toBe(false);
  });

  it('handles nested paths', () => {
    expect(isFolderNote('a/b/c/c.md')).toBe(true);
    expect(isFolderNote('a/b/c/d.md')).toBe(false);
  });
});

// ── getFolder ─────────────────────────────────────────────────────

describe('getFolder', () => {
  it('returns parent folder', () => {
    expect(getFolder('projects/ML/ML.md')).toBe('projects/ML');
  });

  it('returns empty string for root files', () => {
    expect(getFolder('notes.md')).toBe('');
  });
});

// ── findMarkers ───────────────────────────────────────────────────

describe('findMarkers', () => {
  it('finds waypoint trigger', () => {
    const content = `# Title\n\n${WAYPOINT_TRIGGER}\n\nSome text`;
    const markers = findMarkers(content);
    expect(markers).toEqual([{ type: 'waypoint', line: 2 }]);
  });

  it('finds landmark trigger', () => {
    const content = `# Title\n${LANDMARK_TRIGGER}`;
    const markers = findMarkers(content);
    expect(markers).toEqual([{ type: 'landmark', line: 1 }]);
  });

  it('finds multiple markers', () => {
    const content = `${WAYPOINT_TRIGGER}\n${LANDMARK_TRIGGER}`;
    const markers = findMarkers(content);
    expect(markers).toHaveLength(2);
    expect(markers[0].type).toBe('waypoint');
    expect(markers[1].type).toBe('landmark');
  });

  it('returns empty for no markers', () => {
    expect(findMarkers('just text')).toEqual([]);
  });
});

// ── hasGeneratedBlock ─────────────────────────────────────────────

describe('hasGeneratedBlock', () => {
  it('detects waypoint block', () => {
    const content = `${BEGIN_WAYPOINT}\n- link\n${END_WAYPOINT}`;
    expect(hasGeneratedBlock(content, 'waypoint')).toBe(true);
  });

  it('detects landmark block', () => {
    const content = `${BEGIN_LANDMARK}\n- link\n${END_LANDMARK}`;
    expect(hasGeneratedBlock(content, 'landmark')).toBe(true);
  });

  it('returns false when missing', () => {
    expect(hasGeneratedBlock('no markers', 'waypoint')).toBe(false);
  });
});

// ── findFolderNotes ───────────────────────────────────────────────

describe('findFolderNotes', () => {
  it('filters to folder notes only', () => {
    const notes = [np('a/a.md'), np('a/other.md'), np('b/b.md')];
    const result = findFolderNotes(notes);
    expect(result.map((n) => n.path)).toEqual(['a/a.md', 'b/b.md']);
  });
});

// ── getNotesInFolder ──────────────────────────────────────────────

describe('getNotesInFolder', () => {
  const notes = [np('a/note1.md'), np('a/sub/note2.md'), np('b/note3.md')];

  it('returns notes within folder', () => {
    const result = getNotesInFolder('a', notes);
    expect(result.map((n) => n.path)).toEqual(['a/note1.md', 'a/sub/note2.md']);
  });

  it('returns all notes for empty folder (root)', () => {
    const result = getNotesInFolder('', notes);
    expect(result).toHaveLength(3);
  });
});

// ── buildLinkTree ─────────────────────────────────────────────────

describe('buildLinkTree', () => {
  it('lists direct children as links', () => {
    const notes = [np('proj/note1.md', 'Note 1'), np('proj/note2.md', 'Note 2')];
    const links = buildLinkTree('proj', notes, new Set());
    expect(links).toEqual(['- [[proj/note1.md|Note 1]]', '- [[proj/note2.md|Note 2]]']);
  });

  it('skips the folder note itself', () => {
    const notes = [np('proj/proj.md', 'Proj'), np('proj/note.md', 'Note')];
    const links = buildLinkTree('proj', notes, new Set());
    expect(links).toEqual(['- [[proj/note.md|Note]]']);
  });

  it('expands subfolders recursively when no waypoint', () => {
    const notes = [np('proj/note.md', 'Note'), np('proj/sub/deep.md', 'Deep')];
    const links = buildLinkTree('proj', notes, new Set());
    expect(links[0]).toContain('**sub**'); // folder header
    expect(links[1]).toContain('  - [[proj/sub/deep.md|Deep]]'); // indented child
  });

  it('stops at child waypoint folders', () => {
    const notes = [
      np('proj/note.md', 'Note'),
      np('proj/sub/sub.md', 'Sub'),
      np('proj/sub/child.md', 'Child'),
    ];
    const waypoints = new Set(['proj/sub']);
    const links = buildLinkTree('proj', notes, waypoints);
    // Should link to folder note, not expand contents
    expect(links.some((l) => l.includes('**[[proj/sub/sub.md|sub]]**'))).toBe(true);
    expect(links.some((l) => l.includes('child.md'))).toBe(false);
  });

  it('does not stop at landmark folders', () => {
    const notes = [np('proj/note.md', 'Note'), np('proj/sub/child.md', 'Child')];
    // Landmarks don't block parent expansion
    const links = buildLinkTree('proj', notes, new Set(), 'landmark');
    expect(links.some((l) => l.includes('Child'))).toBe(true);
  });
});

// ── generateMocContent ────────────────────────────────────────────

describe('generateMocContent', () => {
  it('returns no-notes message for empty folder', () => {
    const result = generateMocContent('empty', [], new Set());
    expect(result).toContain('No notes found');
  });

  it('generates link list for populated folder', () => {
    const notes = [np('folder/a.md', 'Alpha'), np('folder/b.md', 'Beta')];
    const result = generateMocContent('folder', notes, new Set());
    expect(result).toContain('Alpha');
    expect(result).toContain('Beta');
  });
});

// ── updateMocInContent ────────────────────────────────────────────

describe('updateMocInContent', () => {
  const notes = [np('proj/note.md', 'Note')];

  it('replaces trigger with begin/end markers and content', () => {
    const content = `# Title\n\n${WAYPOINT_TRIGGER}\n\nFooter`;
    const result = updateMocInContent(content, 'proj', notes, new Set());
    expect(result).toContain(BEGIN_WAYPOINT);
    expect(result).toContain(END_WAYPOINT);
    expect(result).toContain('note.md');
    expect(result).not.toContain(WAYPOINT_TRIGGER);
  });

  it('updates existing begin/end block', () => {
    const content = `# Title\n${BEGIN_WAYPOINT}\nold content\n${END_WAYPOINT}\nFooter`;
    const result = updateMocInContent(content, 'proj', notes, new Set());
    expect(result).toContain('note.md');
    expect(result).not.toContain('old content');
    expect(result).toContain('Footer');
  });

  it('appends when no trigger or block found', () => {
    const content = '# Title\n\nSome text';
    const result = updateMocInContent(content, 'proj', notes, new Set());
    expect(result).toContain(BEGIN_WAYPOINT);
    expect(result).toContain('note.md');
  });

  it('handles landmark markers', () => {
    const content = `${LANDMARK_TRIGGER}`;
    const result = updateMocInContent(content, 'proj', notes, new Set(), 'landmark');
    expect(result).toContain(BEGIN_LANDMARK);
    expect(result).toContain(END_LANDMARK);
  });
});

// ── findWaypointFolderSet ─────────────────────────────────────────

describe('findWaypointFolderSet', () => {
  it('finds folders with waypoint markers in folder notes', () => {
    const notes = [np('a/a.md'), np('b/b.md'), np('c/other.md')];
    const lookup = (path: string) => {
      if (path === 'a/a.md') return `${WAYPOINT_TRIGGER}`;
      if (path === 'b/b.md') return 'no markers';
      return '';
    };
    const result = findWaypointFolderSet(notes, lookup);
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(false);
  });
});

// ── buildSimpleMoc ────────────────────────────────────────────────

describe('buildSimpleMoc', () => {
  it('builds alphabetical link list', () => {
    const notes = [np('folder/beta.md', 'Beta'), np('folder/alpha.md', 'Alpha')];
    const result = buildSimpleMoc('folder', notes);
    const lines = result.split('\n');
    expect(lines[0]).toContain('Alpha');
    expect(lines[1]).toContain('Beta');
  });

  it('excludes the folder note itself', () => {
    const notes = [np('folder/folder.md', 'Folder'), np('folder/note.md', 'Note')];
    const result = buildSimpleMoc('folder', notes);
    expect(result).not.toContain('folder/folder.md');
    expect(result).toContain('note.md');
  });

  it('returns message for empty folder', () => {
    expect(buildSimpleMoc('empty', [])).toContain('No notes found');
  });
});

// ── buildFolderNoteContent ────────────────────────────────────────

describe('buildFolderNoteContent', () => {
  it('generates frontmatter with moc tag and waypoint block', () => {
    const notes = [np('proj/note.md', 'Note')];
    const result = buildFolderNoteContent('proj', 'proj', notes, new Set());
    expect(result).toContain('tags: [moc]');
    expect(result).toContain('# proj');
    expect(result).toContain(BEGIN_WAYPOINT);
    expect(result).toContain(END_WAYPOINT);
    expect(result).toContain('note.md');
  });
});
