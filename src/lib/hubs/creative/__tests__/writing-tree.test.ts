import { describe, expect, it } from 'vitest';

import {
  addSceneToGroup,
  compileScenes,
  computeProgress,
  countByStatus,
  findSceneById,
  moveSceneToGroup,
  moveSceneToRoot,
  removeSceneDeep,
  updateSceneDeep,
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

// ── findSceneById ────────────────────────────────────────────────

describe('findSceneById', () => {
  it('finds scene at root', () => {
    const scenes = [makeScene({ id: 'a' }), makeScene({ id: 'b' })];
    expect(findSceneById(scenes, 'b')?.id).toBe('b');
  });

  it('finds scene nested inside group', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [makeScene({ id: 's1' }), makeScene({ id: 's2' })],
      }),
    ];
    expect(findSceneById(tree, 's2')?.id).toBe('s2');
  });

  it('returns undefined for missing id', () => {
    expect(findSceneById([makeScene({ id: 'a' })], 'z')).toBeUndefined();
  });

  it('finds deeply nested scene', () => {
    const tree = [
      makeScene({
        id: 'part',
        type: 'group',
        children: [makeScene({ id: 'ch', type: 'group', children: [makeScene({ id: 'deep' })] })],
      }),
    ];
    expect(findSceneById(tree, 'deep')?.id).toBe('deep');
  });
});

// ── removeSceneDeep ──────────────────────────────────────────────

describe('removeSceneDeep', () => {
  it('removes from root', () => {
    const scenes = [makeScene({ id: 'a' }), makeScene({ id: 'b' })];
    const result = removeSceneDeep(scenes, 'a');
    expect(result.map((s) => s.id)).toEqual(['b']);
  });

  it('removes from nested children', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [makeScene({ id: 's1' }), makeScene({ id: 's2' })],
      }),
      makeScene({ id: 's3' }),
    ];
    const result = removeSceneDeep(tree, 's1');
    expect(result[0].children.map((s) => s.id)).toEqual(['s2']);
    expect(result.map((s) => s.id)).toEqual(['ch1', 's3']);
  });

  it('no-ops if id not found', () => {
    const scenes = [makeScene({ id: 'a' })];
    const result = removeSceneDeep(scenes, 'zzz');
    expect(result).toHaveLength(1);
  });
});

// ── addSceneToGroup ──────────────────────────────────────────────

describe('addSceneToGroup', () => {
  it("adds scene into a group's children", () => {
    const tree = [makeScene({ id: 'ch1', type: 'group', children: [] }), makeScene({ id: 's1' })];
    const newScene = makeScene({ id: 'ns' });
    const result = addSceneToGroup(tree, 'ch1', newScene);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe('ns');
  });

  it('inserts at specific index', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [makeScene({ id: 's1', order: 0 }), makeScene({ id: 's2', order: 1 })],
      }),
    ];
    const newScene = makeScene({ id: 'ns' });
    const result = addSceneToGroup(tree, 'ch1', newScene, 1);
    expect(result[0].children.map((s) => s.id)).toEqual(['s1', 'ns', 's2']);
  });

  it('sets indent on added scene', () => {
    const tree = [makeScene({ id: 'ch1', type: 'group', indent: 0, children: [] })];
    const newScene = makeScene({ id: 'ns', indent: 0 });
    const result = addSceneToGroup(tree, 'ch1', newScene);
    expect(result[0].children[0].indent).toBe(1);
  });
});

// ── moveSceneToGroup ─────────────────────────────────────────────

describe('moveSceneToGroup', () => {
  it('moves a root scene into a group', () => {
    const tree = [makeScene({ id: 'ch1', type: 'group', children: [] }), makeScene({ id: 's1' })];
    const result = moveSceneToGroup(tree, 's1', 'ch1');
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe('s1');
  });

  it('moves from one group to another', () => {
    const tree = [
      makeScene({ id: 'ch1', type: 'group', children: [makeScene({ id: 's1' })] }),
      makeScene({ id: 'ch2', type: 'group', children: [] }),
    ];
    const result = moveSceneToGroup(tree, 's1', 'ch2');
    expect(result[0].children).toHaveLength(0);
    expect(result[1].children).toHaveLength(1);
    expect(result[1].children[0].id).toBe('s1');
  });

  it('no-ops if scene not found', () => {
    const tree = [makeScene({ id: 'ch1', type: 'group', children: [] })];
    const result = moveSceneToGroup(tree, 'zzz', 'ch1');
    expect(result[0].children).toHaveLength(0);
  });
});

// ── moveSceneToRoot ──────────────────────────────────────────────

describe('moveSceneToRoot', () => {
  it('moves nested scene to root', () => {
    const tree = [makeScene({ id: 'ch1', type: 'group', children: [makeScene({ id: 's1' })] })];
    const result = moveSceneToRoot(tree, 's1');
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('s1');
    expect(result[1].indent).toBe(0);
    expect(result[0].children).toHaveLength(0);
  });

  it('inserts at specific root index', () => {
    const tree = [
      makeScene({ id: 'ch1', type: 'group', children: [makeScene({ id: 's1' })] }),
      makeScene({ id: 's2' }),
    ];
    const result = moveSceneToRoot(tree, 's1', 0);
    expect(result[0].id).toBe('s1');
  });
});

// ── updateSceneDeep ──────────────────────────────────────────────

describe('updateSceneDeep', () => {
  it('updates scene at root', () => {
    const scenes = [makeScene({ id: 'a', title: 'Old' })];
    const result = updateSceneDeep(scenes, 'a', { title: 'New' });
    expect(result[0].title).toBe('New');
  });

  it('updates scene nested in group', () => {
    const tree = [
      makeScene({ id: 'ch1', type: 'group', children: [makeScene({ id: 's1', title: 'Old' })] }),
    ];
    const result = updateSceneDeep(tree, 's1', { title: 'New' });
    expect(result[0].children[0].title).toBe('New');
  });

  it('sets modifiedAt on update', () => {
    const scenes = [makeScene({ id: 'a', modifiedAt: '2020-01-01T00:00:00Z' })];
    const result = updateSceneDeep(scenes, 'a', { title: 'New' });
    expect(result[0].modifiedAt).not.toBe('2020-01-01T00:00:00Z');
  });
});

// ── Recursive countByStatus ──────────────────────────────────────

describe('recursive countByStatus', () => {
  it('counts nested file scenes only', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        status: 'idea',
        children: [
          makeScene({ id: 's1', status: 'draft' }),
          makeScene({ id: 's2', status: 'final' }),
        ],
      }),
      makeScene({ id: 's3', status: 'idea' }),
    ];
    const counts = countByStatus(tree);
    expect(counts.draft).toBe(1);
    expect(counts.final).toBe(1);
    expect(counts.idea).toBe(1);
  });

  it('excludes excluded nested scenes', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [
          makeScene({ id: 's1', status: 'draft', excluded: true }),
          makeScene({ id: 's2', status: 'draft' }),
        ],
      }),
    ];
    const counts = countByStatus(tree);
    expect(counts.draft).toBe(1);
  });
});

// ── Recursive computeProgress ────────────────────────────────────

describe('recursive computeProgress', () => {
  it('computes progress from nested scenes', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [
          makeScene({ id: 's1', status: 'final' }),
          makeScene({ id: 's2', status: 'final' }),
        ],
      }),
    ];
    expect(computeProgress(tree)).toBe(1);
  });

  it('ignores group nodes in progress calc', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        status: 'idea',
        children: [makeScene({ id: 's1', status: 'final' })],
      }),
    ];
    expect(computeProgress(tree)).toBe(1);
  });
});

// ── Recursive compileScenes ──────────────────────────────────────

describe('recursive compileScenes', () => {
  it('includes content from nested scenes', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        title: 'Chapter 1',
        children: [
          makeScene({ id: 's1', title: 'Scene 1' }),
          makeScene({ id: 's2', title: 'Scene 2' }),
        ],
      }),
    ];
    const contents = new Map([
      ['s1', 'Content A'],
      ['s2', 'Content B'],
    ]);
    const result = compileScenes(tree, contents, DEFAULT_COMPILE_WORKFLOW);
    expect(result.text).toContain('Scene 1');
    expect(result.text).toContain('Content A');
    expect(result.text).toContain('Scene 2');
    expect(result.text).toContain('Content B');
  });

  it('skips group nodes as content entries', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        title: 'Chapter 1',
        children: [makeScene({ id: 's1', title: 'Scene 1' })],
      }),
    ];
    const contents = new Map([
      ['ch1', 'Chapter content'],
      ['s1', 'Scene content'],
    ]);
    const result = compileScenes(tree, contents, DEFAULT_COMPILE_WORKFLOW);
    expect(result.text).not.toContain('Chapter content');
    expect(result.text).toContain('Scene content');
  });
});
