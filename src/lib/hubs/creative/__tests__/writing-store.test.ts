import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WRITING_PROJECTS_KEY } from '@/constants/storage-keys';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('@/hubs/editor/services/file-ops', () => ({ createNewNote: vi.fn() }));
vi.mock('@/hubs/core/stores/gamification-store.svelte', () => ({ awardWritingXp: vi.fn() }));

type WritingStoreModule = typeof import('@/hubs/creative/stores/writing-store.svelte');

function sampleProject(id: string, title: string) {
  const draftId = `draft-${id}`;
  return {
    id,
    title,
    author: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    activeDraftId: draftId,
    drafts: [
      { id: draftId, title: `${title} Draft`, createdAt: '2026-01-01T00:00:00.000Z', scenes: [] },
    ],
    targetWords: 50_000,
    compileWorkflow: 'Default',
  };
}

describe('writing-store initialization', () => {
  const storage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function loadStore(): Promise<WritingStoreModule> {
    return import('@/hubs/creative/stores/writing-store.svelte');
  }

  it('initializes with no active project when storage has no projects', async () => {
    const store = await loadStore();

    expect(store.getProjects()).toEqual([]);
    expect(store.getActiveProject()).toBeNull();
  });

  it('initializes active project to first stored project when projects exist', async () => {
    const first = sampleProject('p-1', 'Alpha');
    const second = sampleProject('p-2', 'Beta');
    storage[WRITING_PROJECTS_KEY] = JSON.stringify([first, second]);

    const store = await loadStore();

    expect(store.getProjects().map((project) => project.id)).toEqual(['p-1', 'p-2']);
    expect(store.getActiveProject()?.id).toBe('p-1');
  });
});
