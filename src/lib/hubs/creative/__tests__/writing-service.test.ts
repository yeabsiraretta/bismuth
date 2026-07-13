import { describe, expect, it } from 'vitest';

import {
  advanceStatus,
  compileScenes,
  computeProgress,
  computeStreak,
  computeWpm,
  countByStatus,
  countWords,
  createDraft,
  createGroup,
  createProject,
  createScene,
  createSprintEntry,
  dateKey,
  flattenScenes,
  formatNumber,
  formatTimer,
  getRecentDays,
  insertScene,
  moveScene,
  recordDaily,
  removeScene,
  renumberScenes,
  revertStatus,
  sortScenes,
  stripFrontmatter,
  thisMonthWords,
  thisWeekWords,
  todayKey,
  totalWordCount,
} from '@/hubs/creative/services/writing-service';
import type { SceneNode } from '@/hubs/creative/types/writing-types';
import { DEFAULT_COMPILE_WORKFLOW } from '@/hubs/creative/types/writing-types';

// ── Helpers ──────────────────────────────────────────────────────

function makeScene(overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: overrides.id ?? 'test-1',
    title: overrides.title ?? 'Test Scene',
    type: overrides.type ?? 'file',
    status: overrides.status ?? 'idea',
    wordCount: overrides.wordCount ?? 0,
    targetWordCount: overrides.targetWordCount ?? 0,
    order: overrides.order ?? 0,
    indent: overrides.indent ?? 0,
    children: overrides.children ?? [],
    tags: overrides.tags ?? [],
    excluded: overrides.excluded ?? false,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    modifiedAt: overrides.modifiedAt ?? '2025-01-01T00:00:00Z',
  };
}

// ── Word counting ────────────────────────────────────────────────

describe('countWords', () => {
  it('counts basic latin words', () => {
    expect(countWords('hello world foo bar')).toBe(4);
  });

  it('strips YAML frontmatter', () => {
    const text = `---\ntitle: Test\n---\nHello world`;
    expect(countWords(text)).toBe(2);
  });

  it('strips inline code', () => {
    expect(countWords('use `const x = 1` here')).toBe(2);
  });

  it('strips code blocks', () => {
    const text = 'Before\n```\ncode block\n```\nAfter';
    expect(countWords(text)).toBe(2);
  });

  it('strips obsidian comments', () => {
    expect(countWords('Hello %%hidden%% world')).toBe(2);
  });

  it('counts CJK characters individually', () => {
    expect(countWords('你好世界')).toBe(4);
  });

  it('counts mixed CJK and latin', () => {
    expect(countWords('Hello 你好世界 world')).toBe(6);
  });

  it('counts Japanese kana', () => {
    expect(countWords('こんにちは')).toBe(5);
  });

  it('handles empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('strips markdown syntax', () => {
    expect(countWords('# Heading\n**bold** _italic_')).toBe(3);
  });
});

// ── Strip frontmatter ────────────────────────────────────────────

describe('stripFrontmatter', () => {
  it('removes frontmatter', () => {
    expect(stripFrontmatter('---\ntitle: X\n---\nContent')).toBe('Content');
  });

  it('returns text unchanged if no frontmatter', () => {
    expect(stripFrontmatter('No frontmatter here')).toBe('No frontmatter here');
  });
});

// ── Scene management ─────────────────────────────────────────────

describe('createScene', () => {
  it('creates a scene with defaults', () => {
    const scene = createScene('My Scene');
    expect(scene.title).toBe('My Scene');
    expect(scene.type).toBe('file');
    expect(scene.status).toBe('idea');
    expect(scene.id).toMatch(/^scene-/);
  });

  it('applies template defaults', () => {
    const scene = createScene('Action', {
      name: 'Action',
      description: 'test',
      defaultStatus: 'draft',
      bodyTemplate: '',
      defaultTags: ['action', 'fight'],
    });
    expect(scene.status).toBe('draft');
    expect(scene.tags).toEqual(['action', 'fight']);
  });
});

describe('createGroup', () => {
  it('creates a group node', () => {
    const group = createGroup('Chapter 1');
    expect(group.type).toBe('group');
    expect(group.title).toBe('Chapter 1');
  });
});

describe('insertScene', () => {
  it('inserts at given index and renumbers', () => {
    const scenes = [makeScene({ id: 'a', order: 0 }), makeScene({ id: 'b', order: 1 })];
    const newScene = makeScene({ id: 'c' });
    const result = insertScene(scenes, newScene, 1);
    expect(result.map((s) => s.id)).toEqual(['a', 'c', 'b']);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
  });
});

describe('removeScene', () => {
  it('removes by id and renumbers', () => {
    const scenes = [
      makeScene({ id: 'a', order: 0 }),
      makeScene({ id: 'b', order: 1 }),
      makeScene({ id: 'c', order: 2 }),
    ];
    const result = removeScene(scenes, 'b');
    expect(result.map((s) => s.id)).toEqual(['a', 'c']);
    expect(result.map((s) => s.order)).toEqual([0, 1]);
  });
});

describe('moveScene', () => {
  it('moves scene from one index to another', () => {
    const scenes = [makeScene({ id: 'a' }), makeScene({ id: 'b' }), makeScene({ id: 'c' })];
    const result = moveScene(scenes, 0, 2);
    expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('renumberScenes', () => {
  it('sets sequential order', () => {
    const scenes = [makeScene({ order: 5 }), makeScene({ order: 3 })];
    const result = renumberScenes(scenes);
    expect(result.map((s) => s.order)).toEqual([0, 1]);
  });
});

// ── Status pipeline ──────────────────────────────────────────────

describe('advanceStatus', () => {
  it('advances through pipeline', () => {
    expect(advanceStatus('idea')).toBe('outlined');
    expect(advanceStatus('outlined')).toBe('draft');
    expect(advanceStatus('draft')).toBe('written');
    expect(advanceStatus('written')).toBe('revised');
    expect(advanceStatus('revised')).toBe('final');
  });

  it('stays at final', () => {
    expect(advanceStatus('final')).toBe('final');
  });
});

describe('revertStatus', () => {
  it('reverts through pipeline', () => {
    expect(revertStatus('final')).toBe('revised');
    expect(revertStatus('draft')).toBe('outlined');
  });

  it('stays at idea', () => {
    expect(revertStatus('idea')).toBe('idea');
  });
});

// ── Sorting ──────────────────────────────────────────────────────

describe('sortScenes', () => {
  it('sorts by title asc', () => {
    const scenes = [makeScene({ id: 'b', title: 'Beta' }), makeScene({ id: 'a', title: 'Alpha' })];
    const result = sortScenes(scenes, 'title', 'asc');
    expect(result.map((s) => s.title)).toEqual(['Alpha', 'Beta']);
  });

  it('sorts by wordCount desc', () => {
    const scenes = [makeScene({ id: 'a', wordCount: 100 }), makeScene({ id: 'b', wordCount: 500 })];
    const result = sortScenes(scenes, 'wordCount', 'desc');
    expect(result.map((s) => s.wordCount)).toEqual([500, 100]);
  });

  it('sorts by status', () => {
    const scenes = [
      makeScene({ id: 'a', status: 'final' }),
      makeScene({ id: 'b', status: 'idea' }),
    ];
    const result = sortScenes(scenes, 'status', 'asc');
    expect(result.map((s) => s.status)).toEqual(['idea', 'final']);
  });
});

// ── Flatten / totals ─────────────────────────────────────────────

describe('flattenScenes', () => {
  it('flattens nested tree with indent levels', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [makeScene({ id: 's1' }), makeScene({ id: 's2' })],
      }),
      makeScene({ id: 's3' }),
    ];
    const flat = flattenScenes(tree);
    expect(flat.map((s) => s.id)).toEqual(['ch1', 's1', 's2', 's3']);
    expect(flat.map((s) => s.indent)).toEqual([0, 1, 1, 0]);
  });
});

describe('totalWordCount', () => {
  it('sums word counts recursively', () => {
    const scenes = [
      makeScene({ wordCount: 100, children: [makeScene({ wordCount: 50 })] }),
      makeScene({ wordCount: 200 }),
    ];
    expect(totalWordCount(scenes)).toBe(350);
  });

  it('excludes excluded scenes', () => {
    const scenes = [makeScene({ wordCount: 100 }), makeScene({ wordCount: 200, excluded: true })];
    expect(totalWordCount(scenes)).toBe(100);
  });
});

describe('countByStatus', () => {
  it('counts scenes per status', () => {
    const scenes = [
      makeScene({ status: 'idea' }),
      makeScene({ status: 'idea' }),
      makeScene({ status: 'draft' }),
      makeScene({ status: 'final', excluded: true }),
    ];
    const counts = countByStatus(scenes);
    expect(counts.idea).toBe(2);
    expect(counts.draft).toBe(1);
    expect(counts.final).toBe(0);
  });
});

describe('computeProgress', () => {
  it('returns 0 for empty list', () => {
    expect(computeProgress([])).toBe(0);
  });

  it('returns 1 for all final', () => {
    const scenes = [makeScene({ status: 'final' }), makeScene({ status: 'final' })];
    expect(computeProgress(scenes)).toBe(1);
  });

  it('returns correct weighted average', () => {
    const scenes = [makeScene({ status: 'idea' }), makeScene({ status: 'final' })];
    expect(computeProgress(scenes)).toBe(0.5);
  });
});

// ── Draft / Project ──────────────────────────────────────────────

describe('createDraft', () => {
  it('creates a draft with title', () => {
    const draft = createDraft('Draft 1');
    expect(draft.title).toBe('Draft 1');
    expect(draft.id).toMatch(/^draft-/);
    expect(draft.scenes).toEqual([]);
  });
});

describe('createProject', () => {
  it('creates a project with one draft', () => {
    const project = createProject('My Novel', 'Author');
    expect(project.title).toBe('My Novel');
    expect(project.author).toBe('Author');
    expect(project.drafts).toHaveLength(1);
    expect(project.activeDraftId).toBe(project.drafts[0].id);
  });
});

// ── Compile ──────────────────────────────────────────────────────

describe('compileScenes', () => {
  it('compiles scenes with default workflow', () => {
    const scenes = [
      makeScene({ id: 'a', title: 'Scene A' }),
      makeScene({ id: 'b', title: 'Scene B' }),
    ];
    const contents = new Map([
      ['a', '---\ntitle: A\n---\nContent of A'],
      ['b', 'Content of B'],
    ]);
    const result = compileScenes(scenes, contents, DEFAULT_COMPILE_WORKFLOW);
    expect(result.text).toContain('Scene A');
    expect(result.text).toContain('Content of A');
    expect(result.text).toContain('Scene B');
    expect(result.text).toContain('Content of B');
    expect(result.text).not.toContain('title: A');
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('skips excluded scenes', () => {
    const scenes = [
      makeScene({ id: 'a', title: 'A' }),
      makeScene({ id: 'b', title: 'B', excluded: true }),
    ];
    const contents = new Map([
      ['a', 'hello'],
      ['b', 'hidden'],
    ]);
    const result = compileScenes(scenes, contents, DEFAULT_COMPILE_WORKFLOW);
    expect(result.text).toContain('hello');
    expect(result.text).not.toContain('hidden');
  });
});

// ── Session / history ────────────────────────────────────────────

describe('todayKey / dateKey', () => {
  it('returns ISO date', () => {
    const key = todayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats a Date', () => {
    const d = new Date(2025, 2, 15); // local March 15
    expect(dateKey(d)).toBe('2025-03-15');
  });
});

describe('recordDaily', () => {
  it('adds words to existing day', () => {
    const h = { '2025-01-01': 100 };
    const result = recordDaily(h, '2025-01-01', 50);
    expect(result['2025-01-01']).toBe(150);
  });

  it('creates new day entry', () => {
    const result = recordDaily({}, '2025-01-02', 200);
    expect(result['2025-01-02']).toBe(200);
  });
});

describe('getRecentDays', () => {
  it('returns last N days', () => {
    const result = getRecentDays({ [todayKey()]: 500 }, 3);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe(todayKey());
    expect(result[0].words).toBe(500);
  });
});

describe('computeStreak', () => {
  it('returns 0 for empty history', () => {
    expect(computeStreak({})).toBe(0);
  });

  it('counts consecutive days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const h: Record<string, number> = {
      [dateKey(today)]: 100,
      [dateKey(yesterday)]: 200,
    };
    expect(computeStreak(h)).toBe(2);
  });
});

describe('thisWeekWords', () => {
  it('returns 0 for empty history', () => {
    expect(thisWeekWords({})).toBe(0);
  });

  it('includes today', () => {
    expect(thisWeekWords({ [todayKey()]: 500 })).toBe(500);
  });
});

describe('thisMonthWords', () => {
  it('includes today', () => {
    expect(thisMonthWords({ [todayKey()]: 300 })).toBe(300);
  });
});

// ── Sprint ───────────────────────────────────────────────────────

describe('computeWpm', () => {
  it('returns 0 for very short durations', () => {
    expect(computeWpm(100, 10_000)).toBe(0);
  });

  it('computes WPM', () => {
    expect(computeWpm(100, 60_000)).toBe(100);
  });
});

describe('createSprintEntry', () => {
  it('creates entry with computed WPM', () => {
    const entry = createSprintEntry(200, 120_000);
    expect(entry.words).toBe(200);
    expect(entry.durationMs).toBe(120_000);
    expect(entry.wpm).toBe(100);
    expect(entry.date).toBe(todayKey());
  });
});

// ── Formatting ───────────────────────────────────────────────────

describe('formatTimer', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatTimer(0)).toBe('00:00');
    expect(formatTimer(65)).toBe('01:05');
    expect(formatTimer(3600)).toBe('60:00');
  });
});

describe('formatNumber', () => {
  it('formats with locale separators', () => {
    const result = formatNumber(1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });
});
