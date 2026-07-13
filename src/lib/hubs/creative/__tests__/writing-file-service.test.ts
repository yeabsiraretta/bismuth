import { describe, expect, it } from 'vitest';

import {
  draftFolderPath,
  findParentGroup,
  findSceneByNotePath,
  projectFolderPath,
  sanitiseName,
  sceneFolderPath,
  sceneNoteContent,
  sceneNotePath,
  WRITING_ROOT,
} from '@/hubs/creative/services/writing-file-service';
import type { Draft, SceneNode, WritingProject } from '@/hubs/creative/types/writing-types';

// ── Helpers ──────────────────────────────────────────────────────

function makeProject(overrides: Partial<WritingProject> = {}): WritingProject {
  return {
    id: overrides.id ?? 'proj-1',
    title: overrides.title ?? 'My Novel',
    author: overrides.author ?? 'Author',
    createdAt: '2025-01-01T00:00:00Z',
    activeDraftId: 'draft-1',
    drafts: overrides.drafts ?? [],
    targetWords: 80000,
    compileWorkflow: 'Default',
    ...overrides,
  };
}

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: overrides.id ?? 'draft-1',
    title: overrides.title ?? 'First Draft',
    createdAt: '2025-01-01T00:00:00Z',
    scenes: overrides.scenes ?? [],
    ...overrides,
  };
}

function makeScene(overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: overrides.id ?? 'scene-1',
    title: overrides.title ?? 'Opening Scene',
    type: overrides.type ?? 'file',
    status: overrides.status ?? 'idea',
    wordCount: 0,
    targetWordCount: 0,
    order: 0,
    indent: 0,
    children: overrides.children ?? [],
    tags: overrides.tags ?? [],
    excluded: false,
    createdAt: '2025-01-01T00:00:00Z',
    modifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── sanitiseName ─────────────────────────────────────────────────

describe('sanitiseName', () => {
  it('replaces forbidden characters', () => {
    expect(sanitiseName('Chapter: 1/2')).toBe('Chapter- 1-2');
  });

  it('trims and collapses whitespace', () => {
    expect(sanitiseName('  hello   world  ')).toBe('hello world');
  });

  it('replaces leading dots', () => {
    expect(sanitiseName('..hidden')).toBe('_hidden');
  });

  it('truncates to 120 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitiseName(long).length).toBe(120);
  });
});

// ── projectFolderPath ────────────────────────────────────────────

describe('projectFolderPath', () => {
  it('returns Writing/<ProjectTitle>', () => {
    const proj = makeProject({ title: 'My Novel' });
    expect(projectFolderPath(proj)).toBe(`${WRITING_ROOT}/My Novel`);
  });

  it('sanitises special characters', () => {
    const proj = makeProject({ title: 'Book: Part 1/2' });
    expect(projectFolderPath(proj)).toBe(`${WRITING_ROOT}/Book- Part 1-2`);
  });
});

// ── draftFolderPath ──────────────────────────────────────────────

describe('draftFolderPath', () => {
  it('returns Writing/<Project>/<Draft>', () => {
    const proj = makeProject({ title: 'Novel' });
    const draft = makeDraft({ title: 'First Draft' });
    expect(draftFolderPath(proj, draft)).toBe(`${WRITING_ROOT}/Novel/First Draft`);
  });
});

// ── findParentGroup ──────────────────────────────────────────────

describe('findParentGroup', () => {
  it('finds parent of nested scene', () => {
    const tree = [
      makeScene({
        id: 'ch1',
        type: 'group',
        title: 'Chapter 1',
        children: [makeScene({ id: 's1', title: 'Scene 1' })],
      }),
    ];
    const parent = findParentGroup(tree, 's1');
    expect(parent?.id).toBe('ch1');
  });

  it('returns undefined for root scene', () => {
    const tree = [makeScene({ id: 's1' })];
    expect(findParentGroup(tree, 's1')).toBeUndefined();
  });

  it('returns undefined for missing scene', () => {
    const tree = [makeScene({ id: 's1' })];
    expect(findParentGroup(tree, 'zzz')).toBeUndefined();
  });
});

// ── sceneFolderPath ──────────────────────────────────────────────

describe('sceneFolderPath', () => {
  it('root scene → draft folder', () => {
    const proj = makeProject({ title: 'Novel' });
    const draft = makeDraft({ title: 'Draft 1' });
    const scenes = [makeScene({ id: 's1' })];
    expect(sceneFolderPath(proj, draft, scenes, 's1')).toBe(`${WRITING_ROOT}/Novel/Draft 1`);
  });

  it('nested scene → chapter subfolder', () => {
    const proj = makeProject({ title: 'Novel' });
    const draft = makeDraft({ title: 'Draft 1' });
    const scenes = [
      makeScene({
        id: 'ch1',
        type: 'group',
        title: 'Chapter 1',
        children: [makeScene({ id: 's1' })],
      }),
    ];
    expect(sceneFolderPath(proj, draft, scenes, 's1')).toBe(
      `${WRITING_ROOT}/Novel/Draft 1/Chapter 1`
    );
  });
});

// ── sceneNotePath ────────────────────────────────────────────────

describe('sceneNotePath', () => {
  it('generates full path with .md', () => {
    const proj = makeProject({ title: 'Novel' });
    const draft = makeDraft({ title: 'Draft 1' });
    const scene = makeScene({ id: 's1', title: 'Opening' });
    const scenes = [scene];
    expect(sceneNotePath(proj, draft, scenes, scene)).toBe(
      `${WRITING_ROOT}/Novel/Draft 1/Opening.md`
    );
  });

  it('nested scene includes chapter folder', () => {
    const proj = makeProject({ title: 'Novel' });
    const draft = makeDraft({ title: 'Draft 1' });
    const scene = makeScene({ id: 's1', title: 'Arrival' });
    const scenes = [makeScene({ id: 'ch1', type: 'group', title: 'Chapter 1', children: [scene] })];
    expect(sceneNotePath(proj, draft, scenes, scene)).toBe(
      `${WRITING_ROOT}/Novel/Draft 1/Chapter 1/Arrival.md`
    );
  });
});

// ── sceneNoteContent ─────────────────────────────────────────────

describe('sceneNoteContent', () => {
  it('generates frontmatter with title and status', () => {
    const scene = makeScene({ title: 'Opening', status: 'draft' });
    const content = sceneNoteContent(scene);
    expect(content).toContain('title: "Opening"');
    expect(content).toContain('status: Draft');
  });

  it('includes POV when present', () => {
    const scene = makeScene({ pov: 'Alice' });
    expect(sceneNoteContent(scene)).toContain('pov: "Alice"');
  });

  it('includes tags when present', () => {
    const scene = makeScene({ tags: ['action', 'climax'] });
    expect(sceneNoteContent(scene)).toContain('tags: ["action", "climax"]');
  });

  it('uses template body when provided', () => {
    const scene = makeScene({ title: 'Fight' });
    const tmpl = {
      name: 'Action',
      description: '',
      defaultStatus: 'idea' as const,
      bodyTemplate: '## Goal\n\n## Conflict',
      defaultTags: [],
    };
    const content = sceneNoteContent(scene, tmpl);
    expect(content).toContain('## Goal');
    expect(content).toContain('## Conflict');
  });

  it('falls back to heading when no template', () => {
    const scene = makeScene({ title: 'Intro' });
    const content = sceneNoteContent(scene);
    expect(content).toContain('# Intro');
  });
});

// ── findSceneByNotePath ──────────────────────────────────────────

describe('findSceneByNotePath', () => {
  it('finds root scene by notePath', () => {
    const scenes = [
      makeScene({ id: 's1', notePath: 'Writing/Novel/Draft/Opening.md' }),
      makeScene({ id: 's2', notePath: 'Writing/Novel/Draft/Closing.md' }),
    ];
    const found = findSceneByNotePath(scenes, 'Writing/Novel/Draft/Opening.md');
    expect(found?.id).toBe('s1');
  });

  it('finds nested scene by notePath', () => {
    const scenes = [
      makeScene({
        id: 'ch1',
        type: 'group',
        children: [makeScene({ id: 's1', notePath: 'Writing/Novel/Draft/Ch1/Scene1.md' })],
      }),
    ];
    const found = findSceneByNotePath(scenes, 'Writing/Novel/Draft/Ch1/Scene1.md');
    expect(found?.id).toBe('s1');
  });

  it('returns null for non-matching path', () => {
    const scenes = [makeScene({ id: 's1', notePath: 'Writing/Novel/Draft/X.md' })];
    expect(findSceneByNotePath(scenes, 'Writing/Other/Y.md')).toBeNull();
  });

  it('returns null for scenes without notePath', () => {
    const scenes = [makeScene({ id: 's1' })];
    expect(findSceneByNotePath(scenes, 'Writing/Novel/Draft/X.md')).toBeNull();
  });
});
